const cdk = require('@aws-cdk/core');
const apigateway = require('@aws-cdk/aws-apigateway');
const lambda = require('@aws-cdk/aws-lambda');
const route53 = require('@aws-cdk/aws-route53');
const route53target = require('@aws-cdk/aws-route53-targets');
const certificateManager = require('@aws-cdk/aws-certificatemanager');
const dynamodb = require('@aws-cdk/aws-dynamodb');

const config = require('../config');
const { Resource } = require('@aws-cdk/core');

class ApiStack extends cdk.Stack {
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
    const userPoolId = config.USER_POOL_ID;

    //TODO: move this to config or common file
    const mainDomainName = 'fixpdq.app';
    const purpose = 'api';
    const parentDomainName = `${environment}.${mainDomainName}`;
    const apiDomainName = `${purpose}.${parentDomainName}`;

    const mockLambda = new lambda.Function(
      this,
      `${prefix}-mock-${environment}-lda`,
      {
        functionName: `${prefix}-mock-${environment}-lda`,
        description: 'A placeholder lambda for API resources',
        runtime: lambda.Runtime.NODEJS_12_X,
        memorySize: 128,
        handler: 'index.handler',
        code: lambda.Code.fromInline(
          'exports.handler = function(event, ctx, cb) { return cb(null, {statusCode: 200, headers: { "Access-Control-Allow-Headers" : "Content-Type", "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "OPTIONS,POST,GET" }, body: JSON.stringify("Hello from Lambda!")}); }'
        ),
        tracing: lambda.Tracing.ACTIVE,
        reservedConcurrentExecutions: 1,
        timeout: cdk.Duration.seconds(90),
        environment: {
          ENVIRONMENT: environment,
        },
      }
    );
    const lambdaIntegration = new apigateway.LambdaIntegration(mockLambda);

    // TODO: set proper CORS configuration
    const fixpdqApi = new apigateway.RestApi(
      this,
      `${prefix}-${purpose}-${environment}-api`,
      {
        restApiName: 'FixPDQ APIs',
        description: 'A set of FixPDQ Backend APIs',
        endpointTypes: [apigateway.EndpointType.REGIONAL],
        deployOptions: {
          loggingLevel: apigateway.MethodLoggingLevel.ERROR,
          dataTraceEnabled: true,
        },
        defaultIntegration: lambdaIntegration,
        defaultCorsPreflightOptions: {
          allowHeaders: [apigateway.Cors.DEFAULT_HEADERS],
          allowMethods: [apigateway.Cors.ALL_METHODS],
          allowOrigins: [apigateway.Cors.ALL_ORIGINS],
        },
      }
    );

    const apiAuthorizer = new apigateway.CfnAuthorizer(
      this,
      `${prefix}-${purpose}-${environment}-auth`,
      {
        name: `${prefix}-${purpose}-${environment}-auth`,
        type: 'COGNITO_USER_POOLS',
        restApiId: fixpdqApi.restApiId,
        providerArns: [
          `arn:aws:cognito-idp:${region}:${account}:userpool/${userPoolId}`,
        ],
        identitySource: 'method.request.header.Authorization',
      }
    );

    /**
     * Add Custom Domain Name
     */
    // Add Custom Domain Name - START
    const parentHostedZone = route53.HostedZone.fromLookup(
      this,
      `${prefix}-parentHostedZone`,
      {
        domainName: parentDomainName,
        privateZone: false,
      }
    );

    const apiCertificate = new certificateManager.DnsValidatedCertificate(
      this,
      `${prefix}-${purpose}-${environment}-certificate`,
      {
        domainName: apiDomainName,
        hostedZone: parentHostedZone,
      }
    );

    const apiCustomDomainName = new apigateway.DomainName(
      this,
      `${prefix}-api-${environment}-cdm`,
      {
        domainName: apiDomainName,
        certificate: apiCertificate,
        endpointType: 'REGIONAL',
      }
    );

    apiCustomDomainName.addBasePathMapping(fixpdqApi, {
      basePath: '',
    });

    const apiGatewayTarget = new route53target.ApiGatewayDomain(
      apiCustomDomainName
    );

    const apiRoute53RecordSet = new route53.RecordSet(
      this,
      `${prefix}-${purpose}-${environment}-ar53`,
      {
        zone: parentHostedZone,
        recordName: apiDomainName,
        target: route53.RecordTarget.fromAlias(apiGatewayTarget),
        recordType: route53.RecordType.A,
      }
    );
    // Add Custom Domain Name - END

    // users
    const usersLabel = 'users';
    const usersLambdaName = `${prefix}-${usersLabel}-${environment}-lda`;
    const usersLambda = lambda.Function.fromFunctionAttributes(
      this,
      `${usersLambdaName}`,
      {
        functionArn: `arn:aws:lambda:${region}:${account}:function:${usersLambdaName}`,
      }
    );
    const usersIntegration = new apigateway.LambdaIntegration(usersLambda);

    const users = fixpdqApi.root.addResource(`${usersLabel}`);
    createGetMethod(users, usersIntegration, apiDomainName, apiAuthorizer);

    // users/{user}
    const userId = users.addResource('{user}');
    createGetMethod(userId, usersIntegration, apiDomainName, apiAuthorizer);
    createPostMethod(userId, usersIntegration, apiDomainName, apiAuthorizer);
    createPutMethod(userId, usersIntegration, apiDomainName, apiAuthorizer);

    // teams
    const teamsLabel = 'teams';
    const teamsLambdaName = `${prefix}-${teamsLabel}-${environment}-lda`;
    const teamsLambda = lambda.Function.fromFunctionAttributes(
      this,
      `${teamsLambdaName}`,
      {
        functionArn: `arn:aws:lambda:${region}:${account}:function:${teamsLambdaName}`,
      }
    );
    const teamsIntegration = new apigateway.LambdaIntegration(teamsLambda);
    const teams = fixpdqApi.root.addResource('teams');
    createGetMethod(teams, teamsIntegration, apiDomainName, apiAuthorizer);
    createPostMethod(teams, teamsIntegration, apiDomainName, apiAuthorizer);
    const singleTeam = teams.addResource('{teamid}');
    createPutMethod(singleTeam, teamsIntegration, apiDomainName, apiAuthorizer);
    createGetMethod(singleTeam, teamsIntegration, apiDomainName, apiAuthorizer);
    createDeleteMethod(
      singleTeam,
      teamsIntegration,
      apiDomainName,
      apiAuthorizer
    );

    // swarms
    const swarmsLabel = 'swarms';
    const swarmsLambdaName = `${prefix}-${swarmsLabel}-${environment}-lda`;
    const swarmsLambda = lambda.Function.fromFunctionAttributes(
      this,
      `${swarmsLambdaName}`,
      {
        functionArn: `arn:aws:lambda:${region}:${account}:function:${swarmsLambdaName}`,
      }
    );
    const swarmsIntegration = new apigateway.LambdaIntegration(swarmsLambda);
    const swarms = fixpdqApi.root.addResource('swarms');
    createGetMethod(swarms, swarmsIntegration, apiDomainName, apiAuthorizer);
    createPostMethod(swarms, swarmsIntegration, apiDomainName, apiAuthorizer);
    const singleSwarm = swarms.addResource('{swarmid}');
    createGetMethod(
      singleSwarm,
      swarmsIntegration,
      apiDomainName,
      apiAuthorizer
    );
    createPutMethod(
      singleSwarm,
      swarmsIntegration,
      apiDomainName,
      apiAuthorizer
    );
    const swarmsCopy = swarms.addResource('copy');
    createPostMethod(
      swarmsCopy,
      swarmsIntegration,
      apiDomainName,
      apiAuthorizer
    );

    // workitems
    const workitemsLabel = 'workitems';
    const workitemsLambdaName = `${prefix}-${workitemsLabel}-${environment}-lda`;
    const workitemsLambda = lambda.Function.fromFunctionAttributes(
      this,
      `${workitemsLambdaName}`,
      {
        functionArn: `arn:aws:lambda:${region}:${account}:function:${workitemsLambdaName}`,
      }
    );
    const workitemsIntegration = new apigateway.LambdaIntegration(
      workitemsLambda
    );
    const workitems = fixpdqApi.root.addResource('workitems');
    createGetMethod(
      workitems,
      workitemsIntegration,
      apiDomainName,
      apiAuthorizer
    );
    createPostMethod(
      workitems,
      workitemsIntegration,
      apiDomainName,
      apiAuthorizer
    );
    const singleWorkitem = workitems.addResource('{workitemid}');
    createPutMethod(
      singleWorkitem,
      workitemsIntegration,
      apiDomainName,
      apiAuthorizer
    );
    createGetMethod(
      singleWorkitem,
      workitemsIntegration,
      apiDomainName,
      apiAuthorizer
    );
    createDeleteMethod(
      singleWorkitem,
      workitemsIntegration,
      apiDomainName,
      apiAuthorizer
    );

    // filters
    const filtersLabel = 'filters';
    const filtersLambdaName = `${prefix}-${filtersLabel}-${environment}-lda`;
    const filtersLambda = lambda.Function.fromFunctionAttributes(
      this,
      `${filtersLambdaName}`,
      {
        functionArn: `arn:aws:lambda:${region}:${account}:function:${filtersLambdaName}`,
      }
    );
    const filtersIntegration = new apigateway.LambdaIntegration(filtersLambda);
    const filters = fixpdqApi.root.addResource('filters');
    createGetMethod(
      filters,
      filtersIntegration,
      apiDomainName,
      apiAuthorizer
    );
    createPostMethod(
      filters,
      filtersIntegration,
      apiDomainName,
      apiAuthorizer
    );
    const singleFilter = filters.addResource('{filterid}');
    createPutMethod(
      singleFilter,
      filtersIntegration,
      apiDomainName,
      apiAuthorizer
    );
    createGetMethod(
      singleFilter,
      filtersIntegration,
      apiDomainName,
      apiAuthorizer
    );
    createDeleteMethod(
      singleFilter,
      filtersIntegration,
      apiDomainName,
      apiAuthorizer
    );

    // conversations
    const conversationsLabel = 'conversations';
    const conversationsLambdaName = `${prefix}-${conversationsLabel}-${environment}-lda`;
    const conversationsLambda = lambda.Function.fromFunctionAttributes(
      this,
      `${conversationsLambdaName}`,
      {
        functionArn: `arn:aws:lambda:${region}:${account}:function:${conversationsLambdaName}`,
      }
    );
    const conversationsIntegration = new apigateway.LambdaIntegration(
      conversationsLambda
    );
    const conversations = fixpdqApi.root.addResource('conversations');
    createGetMethod(
      conversations,
      conversationsIntegration,
      apiDomainName,
      apiAuthorizer
    );
    createPostMethod(
      conversations,
      conversationsIntegration,
      apiDomainName,
      apiAuthorizer
    );
    const singleConversation = conversations.addResource('{conversationid}');
    createDeleteMethod(
      singleConversation,
      conversationsIntegration,
      apiDomainName,
      apiAuthorizer
    );
    createPostMethod(
      singleConversation,
      conversationsIntegration,
      apiDomainName,
      apiAuthorizer
    );
    const getConversationsByWorkitems = conversations.addResource('workitems');
    createPostMethod(
      getConversationsByWorkitems,
      conversationsIntegration,
      apiDomainName,
      apiAuthorizer
    );
    const createChannel = conversations.addResource('channel');
    createPostMethod(
      createChannel,
      conversationsIntegration,
      apiDomainName,
      apiAuthorizer
    );

    // actions
    const actionsLabel = 'actions';
    const actionsLambdaName = `${prefix}-${actionsLabel}-${environment}-lda`;
    const actionsLambda = lambda.Function.fromFunctionAttributes(
      this,
      `${actionsLambdaName}`,
      {
        functionArn: `arn:aws:lambda:${region}:${account}:function:${actionsLambdaName}`,
      }
    );
    const actionsIntegration = new apigateway.LambdaIntegration(actionsLambda);
    const actions = fixpdqApi.root.addResource('actions');
    createGetMethod(actions, actionsIntegration, apiDomainName, apiAuthorizer);
    createPostMethod(actions, actionsIntegration, apiDomainName, apiAuthorizer);
    const singleAction = actions.addResource('{actionid}');
    createPutMethod(
      singleAction,
      actionsIntegration,
      apiDomainName,
      apiAuthorizer
    );
    createGetMethod(
      singleAction,
      actionsIntegration,
      apiDomainName,
      apiAuthorizer
    );
    const getActionsByWorkitems = actions.addResource('workitems');
    createPostMethod(
      getActionsByWorkitems,
      actionsIntegration,
      apiDomainName,
      apiAuthorizer
    );

    // playbooks
    const playbooksLabel = 'playbooks';
    const playbooksLambdaName = `${prefix}-${playbooksLabel}-${environment}-lda`;
    const playbooksLambda = lambda.Function.fromFunctionAttributes(
      this,
      `${playbooksLambdaName}`,
      {
        functionArn: `arn:aws:lambda:${region}:${account}:function:${playbooksLambdaName}`,
      }
    );
    const playbooksIntegration = new apigateway.LambdaIntegration(
      playbooksLambda
    );
    const playbooks = fixpdqApi.root.addResource('playbooks');
    createGetMethod(
      playbooks,
      playbooksIntegration,
      apiDomainName,
      apiAuthorizer
    );
    createPostMethod(
      playbooks,
      playbooksIntegration,
      apiDomainName,
      apiAuthorizer
    );
    const singlePlaybook = playbooks.addResource('{playbookid}');
    createGetMethod(
      singlePlaybook,
      playbooksIntegration,
      apiDomainName,
      apiAuthorizer
    );
    createDeleteMethod(
      singlePlaybook,
      playbooksIntegration,
      apiDomainName,
      apiAuthorizer
    );
    createPutMethod(
      singlePlaybook,
      playbooksIntegration,
      apiDomainName,
      apiAuthorizer
    );

    // subscriptions
    const subscriptionsLabel = 'subscriptions';
    const subscriptionsLambdaName = `${prefix}-${subscriptionsLabel}-${environment}-lda`;
    const subscriptionsLambda = lambda.Function.fromFunctionAttributes(
      this,
      `${subscriptionsLambdaName}`,
      {
        functionArn: `arn:aws:lambda:${region}:${account}:function:${subscriptionsLambdaName}`,
      }
    );
    const subscriptionsIntegration = new apigateway.LambdaIntegration(subscriptionsLambda);
    const subscriptions = fixpdqApi.root.addResource('subscriptions');
    createGetMethod(subscriptions, subscriptionsIntegration, apiDomainName, apiAuthorizer);
    createPostMethod(subscriptions, subscriptionsIntegration, apiDomainName, apiAuthorizer);
    const singleSubscription = subscriptions.addResource('{subscriptionid}');
    createGetMethod(singleSubscription, subscriptionsIntegration, apiDomainName, apiAuthorizer);

    // IaC CDK Outputs:
    new cdk.CfnOutput(this, 'apiCertificate', {
      value: apiCertificate.certificateArn,
    });
    new cdk.CfnOutput(this, 'apiCustomDomain', {
      value: apiCustomDomainName.domainName,
    });
    new cdk.CfnOutput(this, 'apiRestApiId', { value: fixpdqApi.restApiId });
  }
}

function createGetMethod(
  resource,
  lambdaIntegration,
  apiDomainName,
  apiAuthorizer
) {
  // TODO: re-visit aws.cognito.signin.user.admin
  resource.addMethod('GET', lambdaIntegration, {
    authorizationScopes: [
      `https://${apiDomainName}/user.all`,
      `aws.cognito.signin.user.admin`,
    ],
    authorizationType: apigateway.AuthorizationType.COGNITO,
    authorizer: {
      authorizerId: apiAuthorizer.ref,
    },
    apiKeyRequired: false,
    methodResponses: [
      {
        statusCode: '200',
        responseParameters: {
          'method.response.header.Content-Type': true,
          'method.response.header.Access-Control-Allow-Headers': true,
          'method.response.header.Access-Control-Allow-Origin': true,
          'method.response.header.Access-Control-Allow-Methods': true,
        },
        responseModels: [],
      },
      {
        statusCode: '400',
        responseParameters: {
          'method.response.header.Content-Type': true,
          'method.response.header.Access-Control-Allow-Headers': true,
          'method.response.header.Access-Control-Allow-Origin': true,
          'method.response.header.Access-Control-Allow-Methods': true,
        },
      },
    ],
  });
}

function createPostMethod(
  resource,
  lambdaIntegration,
  apiDomainName,
  apiAuthorizer
) {
  // TODO: re-visit aws.cognito.signin.user.admin
  resource.addMethod('POST', lambdaIntegration, {
    authorizationScopes: [
      `https://${apiDomainName}/user.all`,
      `aws.cognito.signin.user.admin`,
    ],
    authorizationType: apigateway.AuthorizationType.COGNITO,
    authorizer: {
      authorizerId: apiAuthorizer.ref,
    },
    apiKeyRequired: false,
    methodResponses: [
      {
        statusCode: '200',
        responseParameters: {
          'method.response.header.Content-Type': true,
          'method.response.header.Access-Control-Allow-Headers': true,
          'method.response.header.Access-Control-Allow-Origin': true,
          'method.response.header.Access-Control-Allow-Methods': true,
        },
        responseModels: [],
      },
      {
        statusCode: '400',
        responseParameters: {
          'method.response.header.Content-Type': true,
          'method.response.header.Access-Control-Allow-Headers': true,
          'method.response.header.Access-Control-Allow-Origin': true,
          'method.response.header.Access-Control-Allow-Methods': true,
        },
      },
    ],
  });
}

function createPutMethod(
  resource,
  lambdaIntegration,
  apiDomainName,
  apiAuthorizer
) {
  // TODO: re-visit aws.cognito.signin.user.admin
  resource.addMethod('PUT', lambdaIntegration, {
    authorizationScopes: [
      `https://${apiDomainName}/user.all`,
      `aws.cognito.signin.user.admin`,
    ],
    authorizationType: apigateway.AuthorizationType.COGNITO,
    authorizer: {
      authorizerId: apiAuthorizer.ref,
    },
    apiKeyRequired: false,
    methodResponses: [
      {
        statusCode: '200',
        responseParameters: {
          'method.response.header.Content-Type': true,
          'method.response.header.Access-Control-Allow-Headers': true,
          'method.response.header.Access-Control-Allow-Origin': true,
          'method.response.header.Access-Control-Allow-Methods': true,
        },
        responseModels: [],
      },
      {
        statusCode: '400',
        responseParameters: {
          'method.response.header.Content-Type': true,
          'method.response.header.Access-Control-Allow-Headers': true,
          'method.response.header.Access-Control-Allow-Origin': true,
          'method.response.header.Access-Control-Allow-Methods': true,
        },
      },
    ],
  });
}

function createDeleteMethod(
  resource,
  lambdaIntegration,
  apiDomainName,
  apiAuthorizer
) {
  // TODO: re-visit aws.cognito.signin.user.admin
  resource.addMethod('DELETE', lambdaIntegration, {
    authorizationScopes: [
      `https://${apiDomainName}/user.all`,
      `aws.cognito.signin.user.admin`,
    ],
    authorizationType: apigateway.AuthorizationType.COGNITO,
    authorizer: {
      authorizerId: apiAuthorizer.ref,
    },
    apiKeyRequired: false,
    methodResponses: [
      {
        statusCode: '200',
        responseParameters: {
          'method.response.header.Content-Type': true,
          'method.response.header.Access-Control-Allow-Headers': true,
          'method.response.header.Access-Control-Allow-Origin': true,
          'method.response.header.Access-Control-Allow-Methods': true,
        },
        responseModels: [],
      },
      {
        statusCode: '400',
        responseParameters: {
          'method.response.header.Content-Type': true,
          'method.response.header.Access-Control-Allow-Headers': true,
          'method.response.header.Access-Control-Allow-Origin': true,
          'method.response.header.Access-Control-Allow-Methods': true,
        },
      },
    ],
  });
}

module.exports = { ApiStack };
