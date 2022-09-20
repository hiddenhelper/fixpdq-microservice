const cdk = require('@aws-cdk/core');
const apigateway = require('@aws-cdk/aws-apigateway');
const lambda = require('@aws-cdk/aws-lambda');
const route53 = require('@aws-cdk/aws-route53');
const route53target = require('@aws-cdk/aws-route53-targets');
const certificateManager = require('@aws-cdk/aws-certificatemanager');

const config = require('../config');
const { Resource } = require('@aws-cdk/core');

class WebhookStack extends cdk.Stack {
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

        const mainDomainName = 'fixpdq.app'
        const purpose = 'webhook';
        const parentDomainName = `${environment}.${mainDomainName}`;
        const apiDomainName = `${purpose}.${parentDomainName}`;

        const mockLambda = new lambda.Function(this, `${prefix}-${purpose}-mock-${environment}-lda`, {
            functionName: `${prefix}-${purpose}-mock-${environment}-lda`,
            description: 'A placeholder lambda for FixPDQ Webhooks.',
            runtime: lambda.Runtime.NODEJS_12_X,
            memorySize: 128,
            handler: 'index.handler',
            code: lambda.Code.fromInline('exports.handler = function(event, ctx, cb) { return cb(null, {statusCode: 200, headers: { "Access-Control-Allow-Headers" : "Content-Type", "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "OPTIONS,POST,GET" }, body: JSON.stringify("Hello from Lambda!")}); }'),
            tracing: lambda.Tracing.ACTIVE,
            reservedConcurrentExecutions: 1,
            timeout: cdk.Duration.seconds(90),
            environment: {
                'ENVIRONMENT': environment
            }
        });
        const lambdaIntegration = new apigateway.LambdaIntegration(mockLambda);

        const fixpdqApi = new apigateway.RestApi(this, `${prefix}-${purpose}-${environment}-api`, {
            restApiName: 'FixPDQ Webhooks',
            description: 'A set of FixPDQ Webhooks',
            endpointTypes: [apigateway.EndpointType.REGIONAL],
            deployOptions: {
                loggingLevel: apigateway.MethodLoggingLevel.ERROR,
                dataTraceEnabled: true
            },
            defaultIntegration: lambdaIntegration,
            defaultCorsPreflightOptions: {
                allowHeaders: [ apigateway.Cors.DEFAULT_HEADERS ],
                allowMethods: [ apigateway.Cors.ALL_METHODS ],
                allowOrigins: [ apigateway.Cors.ALL_ORIGINS ]
            }
        });

        // const apiAuthorizer = new apigateway.CfnAuthorizer(this, `${prefix}-${purpose}-${environment}-auth`, {
        //     name: `${prefix}-${purpose}-${environment}-auth`,
        //     type: 'COGNITO_USER_POOLS',
        //     restApiId: fixpdqApi.restApiId,
        //     providerArns: [`arn:aws:cognito-idp:${region}:${account}:userpool/${userPoolId}`],
        //     identitySource: 'method.request.header.Authorization'
        // });

        // TODO: remove this later to create a Lambda Authorizer
        // create an api key -- START
        const apiKey = fixpdqApi.addApiKey(`${prefix}-${purpose}-api-key`, {
            apiKeyName: `${prefix}-${purpose}-api-key`,
            value: 'MyApiKeyThatIsAtLeast20Characters',
        });

        const usagePlan = new apigateway.UsagePlan(this, `${prefix}-${purpose}-api-usage`, {
            name: `${prefix}-${purpose}-api-usage`,
            description: `${prefix}-${purpose}-api-usage description`,
            apiKey: apiKey,
            quota: { limit: 500, offset: 10, period: apigateway.Period.MONTH},
            apiStages: [
                {
                    api: fixpdqApi,
                    stage: fixpdqApi.deploymentStage
                }
            ]
        });
        // create an api key -- END

        /**
         * Add Custom Domain Name
         */
        // Add Custom Domain Name - START
        const parentHostedZone = route53.HostedZone.fromLookup(this, `${prefix}-parentHostedZone`, {
                domainName: parentDomainName,
                privateZone: false
            });

        const apiCertificate = new certificateManager.DnsValidatedCertificate(this,
            `${prefix}-${purpose}-${environment}-certificate`, {
                domainName: apiDomainName,
                hostedZone: parentHostedZone
            });

        const apiCustomDomainName = new apigateway.DomainName(this, `${prefix}-api-${environment}-cdm`, {
            domainName: apiDomainName,
            certificate: apiCertificate,
            endpointType: 'REGIONAL'
        });

        apiCustomDomainName.addBasePathMapping(fixpdqApi, {
            basePath: ''
        });

        const apiGatewayTarget = new route53target.ApiGatewayDomain(apiCustomDomainName);

        const apiRoute53RecordSet = new route53.RecordSet(this, `${prefix}-${purpose}-${environment}-ar53`, {
            zone: parentHostedZone,
            recordName: apiDomainName,
            target: route53.RecordTarget.fromAlias(apiGatewayTarget),
            recordType: route53.RecordType.A
        });
        // Add Custom Domain Name - END

        const fulfilmentLabel = 'hivemindfulfilment';
        const fulfilmentLambdaName = `${prefix}-${fulfilmentLabel}-${environment}-lda`;
        const fulfilmentLambda = lambda.Function.fromFunctionAttributes(
            this,
            `${fulfilmentLambdaName}`,
            {
                functionArn: `arn:aws:lambda:${region}:${account}:function:${fulfilmentLambdaName}`
            }
        );
        const fulfilmentIntegration = new apigateway.LambdaIntegration(fulfilmentLambda);

        const fulfilment = fixpdqApi.root.addResource(`${fulfilmentLabel}`);
        createPostMethod(fulfilment, fulfilmentIntegration, true);

        // Note: need to move this as an external service rather than part of hivemind?
        const conversationLabel = 'hivemindconversation';
        const conversationWebHookLambdaName = `${prefix}-${conversationLabel}-${environment}-lda`;
        const conversationWebHookLambda = lambda.Function.fromFunctionAttributes(
            this,
            `${conversationWebHookLambdaName}`,
            {
                functionArn: `arn:aws:lambda:${region}:${account}:function:${conversationWebHookLambdaName}`
            }
        );
        const conversationWebHookIntegration = new apigateway.LambdaIntegration(conversationWebHookLambda);

        const conversationWebhook = fixpdqApi.root.addResource(`${conversationLabel}`);
        createPostMethod(conversationWebhook, conversationWebHookIntegration, false);

        // IaC CDK Outputs:
        new cdk.CfnOutput(this, 'apiCertificate', { value: apiCertificate.certificateArn });
        new cdk.CfnOutput(this, 'apiCustomDomain', { value: apiCustomDomainName.domainName });
        new cdk.CfnOutput(this, 'apiRestApiId', { value: fixpdqApi.restApiId });
    }
}

function createPostMethod(resource, lambdaIntegration, isApiKeyRequired) {
    resource.addMethod('POST', lambdaIntegration, {
        authorizationType: apigateway.AuthorizationType.NONE,
        apiKeyRequired: isApiKeyRequired,
        methodResponses: [
            {
                statusCode: '200',
                responseParameters: {
                    'method.response.header.Content-Type': true,
                    'method.response.header.Access-Control-Allow-Headers': true,
                    'method.response.header.Access-Control-Allow-Origin': true,
                    'method.response.header.Access-Control-Allow-Methods': true
                },
                responseModels: [
                ]
            },
            {
                statusCode: '400',
                responseParameters: {
                    'method.response.header.Content-Type': true,
                    'method.response.header.Access-Control-Allow-Headers': true,
                    'method.response.header.Access-Control-Allow-Origin': true,
                    'method.response.header.Access-Control-Allow-Methods': true
                }
            }
        ]
    });
}

module.exports = { WebhookStack }