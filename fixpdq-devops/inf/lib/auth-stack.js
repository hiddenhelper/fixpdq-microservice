const cdk = require('@aws-cdk/core');
const lambda = require('@aws-cdk/aws-lambda');
const cognito = require('@aws-cdk/aws-cognito');
const route53 = require('@aws-cdk/aws-route53');
const route53target = require('@aws-cdk/aws-route53-targets');
const certificateManager = require('@aws-cdk/aws-certificatemanager');
const config = require('../config');
const core = require('@aws-cdk/core');
const dynamodb = require('@aws-cdk/aws-dynamodb');
const iam = require('@aws-cdk/aws-iam');

class AuthStack extends cdk.Stack {
    /**
     *
     * @param {cdk.Construct} scope
     * @param {string} id
     * @param {cdk.StackProps=} props
     */
    constructor(scope, id, props) {
        super(scope, id, props);

        const prefix = 'fixpdq';
        const region = config.AWS_REGION;
        const account = config.AWS_ACCOUNT;
        const environment = config.ENVIRONMENT;

        const mainDomainName = 'fixpdq.app';
        const purpose = 'auth';
        const webAppPurpose = 'webapp';
        const apiPurpose = 'api';
        const parentDomainName = `${environment}.${mainDomainName}`;
        const authDomainName = `${purpose}.${webAppPurpose}.${parentDomainName}`;
        const apiDomainName = `${apiPurpose}.${parentDomainName}`;
        const callbackUrlsValues = config.CALLBACK_URLS;
        const usersTableName = 'users';

        const parentHostedZone = route53.HostedZone.fromLookup(this, `${prefix}-${purpose}-${environment}-parentHostedZone`, {
                domainName: parentDomainName,
                privateZone: false
            });

        const authCertificate = new certificateManager.DnsValidatedCertificate(this,
            `${prefix}-${purpose}-${environment}-certificate`, {
                domainName: authDomainName,
                hostedZone: parentHostedZone,
                region: 'us-east-1'
            });

        const table = dynamodb.Table.fromTableName(this, `${prefix}-${usersTableName}-${environment}-ddb`, `${usersTableName}`);

        const postConfirmationLambda = new lambda.Function(this, `${prefix}-${purpose}-postconfirmation-${environment}-lda`, {
            functionName: `${prefix}-${purpose}-postconfirmation-${environment}-lda`,
            description: 'A post confirmation lambda.',
            runtime: lambda.Runtime.NODEJS_12_X,
            memorySize: 128,
            handler: 'app.handler',
            code: lambda.Code.fromAsset(`assets/PostConfirmationFunction/`,{
                exclude: ['.gitkeep']
            }),
            tracing: lambda.Tracing.ACTIVE,
            reservedConcurrentExecutions: 1,
            timeout: cdk.Duration.seconds(90),
            environment: {
                'ENVIRONMENT': environment,
                'TWILIO_ACCOUNT_SID' : config.TWILIO_ACCOUNT_SID,
                'TWILIO_AUTH_TOKEN' : config.TWILIO_AUTH_TOKEN,
                'TWILIO_SERVICE_SID' : config.TWILIO_SERVICE_SID
            }
        });

        table.grantReadWriteData(postConfirmationLambda);

        const preSignUpLambda = new lambda.Function(this, `${prefix}-${purpose}-presignup-${environment}-lda`, {
            functionName: `${prefix}-${purpose}-presignup-${environment}-lda`,
            description: 'A pre signup lambda.',
            runtime: lambda.Runtime.NODEJS_12_X,
            memorySize: 128,
            handler: 'app.handler',
            code: lambda.Code.fromAsset(`assets/PreSignupFunction/`, {
                exclude: ['.gitkeep']
            }),
            tracing: lambda.Tracing.ACTIVE,
            reservedConcurrentExecutions: 1,
            timeout: cdk.Duration.seconds(90),
            environment: {
                'ENVIRONMENT': environment
            }
        });

        const fixpdqUserPool = new cognito.UserPool(this, `${prefix}-${purpose}-${environment}-userpool`, {
            lambdaTriggers: {
                postConfirmation: postConfirmationLambda,
                preSignUp: preSignUpLambda
            },
            userPoolName: `${prefix}-${purpose}-${environment}-userpool`,
            selfSignUpEnabled: true,
            userVerification: {
                emailSubject: 'Verify your email for FixPDQ!',
                emailBody: 'Hello, Thanks for signing up to FixPDQ! Your verification code is {####}',
                emailStyle: cognito.VerificationEmailStyle.CODE
            },
            userInvitation: {
                emailSubject: 'Invite to join FixPDQ!',
                emailBody: 'Hello {username}, you have been invited to join FixPDQ! Your temporary password is {####}'
            },
            signInAliases: {
                username: true,
                email: true,
                preferredUsername: true,
            },
            signInCaseSensitive: false,
            passwordPolicy: {
                minLength: 12,
                requireLowercase: true,
                requireUppercase: true,
                requireDigits: true,
                requireSymbols: true,
                tempPasswordValidity: core.Duration.days(3),
            },
            accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
            accountRecoverySettings: cognito.AccountRecovery.EMAIL_ONLY,
            standardAttributes: {
                email: {
                    required: true,
                    mutable: false
                }
            }
        });

        // Note: it seems, only one can be specified
        // Error: ('One of, and only one of, cognitoDomain or customDomain must be specified');
        // cognitoDomain: {
        //     domainPrefix: `${prefix}-${purpose}-${environment}`
        // },
        const fixpdqUserPoolDomain = new cognito.UserPoolDomain(this, `${prefix}-${purpose}-${environment}-userpooldomain`, {
            userPool: fixpdqUserPool,
            customDomain: {
                domainName: authDomainName,
                certificate: authCertificate
            }
        });

        new route53.ARecord(this, `${prefix}-${purpose}-${environment}-cfaliasrecord`, {
            zone: parentHostedZone,
            recordName: authDomainName,
            target: route53.RecordTarget.fromAlias(new route53target.UserPoolDomainTarget(fixpdqUserPoolDomain)),
        });

        const apiResourceServer = new cognito.CfnUserPoolResourceServer(this,
            `${prefix}-${purpose}-${environment}-apiresourceserver`, {
                name: `${prefix}-${purpose}-${environment}-apiresourceserver`,
                identifier: `https://${apiPurpose}.${environment}.${mainDomainName}`,
                userPoolId: fixpdqUserPool.userPoolId,
                scopes: [ {
                    scopeName: `user.all`,
                    scopeDescription: `access to all user data.`
                }]
            })

        let callbackUrlsArray = callbackUrlsValues.trim().length > 0 ? callbackUrlsValues.split(',') : [];
        callbackUrlsArray.unshift(`https://${webAppPurpose}.${parentDomainName}/callback`);
        callbackUrlsArray.unshift(`https://${webAppPurpose}.${parentDomainName}`);
        const fixpdqAppClient = fixpdqUserPool.addClient(`${prefix}-${purpose}-${environment}-appclient`, {
            oAuth: {
                flows: {
                    authorizationCodeGrant: true,
                    implicitCodeGrant: true
                },
                scopes: [
                    cognito.OAuthScope.PROFILE,
                    cognito.OAuthScope.OPENID,
                    cognito.OAuthScope.COGNITO_ADMIN,
                    cognito.OAuthScope.custom(`https://${apiDomainName}/user.all`)
                ],
                callbackUrls: callbackUrlsArray
            }
        });
        const clientId = fixpdqAppClient.userPoolClientId;

        // TODO: set to wildcard rather than ${fixpdqUserPool.userPoolId} as specifid userpoolid causes a circular dependency issue although setting it manually in AWS Console work
        preSignUpLambda.addToRolePolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
                "cognito-idp:ListUsersInGroup",
                "cognito-idp:ListUsers",
            ],
            resources: [`arn:aws:cognito-idp:${region}:${account}:userpool/*`],
        }));

        // IaC CDK Outputs
        new cdk.CfnOutput(this, 'authCertificate', {value: authCertificate.certificateArn});
        new cdk.CfnOutput(this, 'authUserPoolDomainPrefix', {value: `${prefix}-${purpose}-${environment}`});
        new cdk.CfnOutput(this, 'authDomainName', {value: `${authDomainName}`});
        new cdk.CfnOutput(this, 'userPoolId', {value: `${fixpdqUserPool.userPoolId}`});
        new cdk.CfnOutput(this, 'clientAppId', {value: `${clientId}`});
    }
}

module.exports = { AuthStack }