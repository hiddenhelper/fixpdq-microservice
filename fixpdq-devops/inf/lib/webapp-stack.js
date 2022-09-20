const cdk = require('@aws-cdk/core');
const s3 = require('@aws-cdk/aws-s3');
const route53 = require('@aws-cdk/aws-route53');
const route53target = require('@aws-cdk/aws-route53-targets');
const cloudfront = require('@aws-cdk/aws-cloudfront');
const cloudfrontOrigins = require('@aws-cdk/aws-cloudfront-origins');
const certificateManager = require('@aws-cdk/aws-certificatemanager');
const config = require('../config');

class WebAppStack extends cdk.Stack {
    /**
     *
     * @param {cdk.Construct} scope
     * @param {string} id
     * @param {cdk.StackProps=} props
     */
    constructor(scope, id, props) {
        super(scope, id, props);

        // TODO: since CloudFront is still unstable,
        // after this runs, add webapp.dev.fixpdq.app to the CNAME (alias)

        const prefix = 'fixpdq';
        const environment = config.ENVIRONMENT;

        const mainDomainName = 'fixpdq.app';
        const purpose = 'webapp';
        const parentDomainName = `${environment}.${mainDomainName}`;
        const appDomainName = `${purpose}.${parentDomainName}`;

        const webappBucket = new s3.Bucket(this, `${prefix}-${purpose}-${environment}-s3`, {
            bucketName: `${appDomainName}`,
            websiteIndexDocument: 'index.html',
            websiteErrorDocument: 'index.html',
            publicReadAccess: true,
            versioned: true,
            blockPublicAccess: {
                blockPublicAcls: true,
                ignorePublicAcls: true,
                blockPublicPolicy: false
            },
            removalPolicy: cdk.RemovalPolicy.RETAIN
        })

        const parentHostedZone = route53.HostedZone.fromLookup(this, `${prefix}-${purpose}-${environment}-parentHostedZone`, {
            domainName: parentDomainName,
            privateZone: false
        });

        const webappCertificate = new certificateManager.DnsValidatedCertificate(this,
            `${prefix}-${purpose}-${environment}-certificate`, {
                domainName: appDomainName,
                hostedZone: parentHostedZone,
                region: 'us-east-1'
            });

        // need to add alternate domain name
        // webapp.${environment}.fixpdq.app
        const webappS3CloudFrontDistribution = new cloudfront.Distribution(this, `${prefix}-${purpose}-${environment}-cfdistribution`, {
            certificate: webappCertificate,
            defaultBehavior: {
                origin: new cloudfrontOrigins.S3Origin(webappBucket),
                allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
                viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS
            }
        });

        const webAppTarget = new route53target.CloudFrontTarget(webappS3CloudFrontDistribution);

        const webAppRoute53RecordSet = new route53.RecordSet(this, `${prefix}-${purpose}-${environment}-ar53`, {
            zone: parentHostedZone,
            recordName: appDomainName,
            target: route53.RecordTarget.fromAlias(webAppTarget),
            recordType: route53.RecordType.A
        });

        new cdk.CfnOutput(this, 'webappBucketArn', { value: webappBucket.bucketArn });
        new cdk.CfnOutput(this, 'appDomainName', { value: appDomainName });
        new cdk.CfnOutput(this, 'distributionId', { value: webappS3CloudFrontDistribution.distributionId });
    }
}

module.exports = { WebAppStack }
