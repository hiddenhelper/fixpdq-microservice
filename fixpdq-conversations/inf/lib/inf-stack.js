const cdk = require('@aws-cdk/core');
const lambda = require('@aws-cdk/aws-lambda');
const dynamodb = require('@aws-cdk/aws-dynamodb');
const iam = require('@aws-cdk/aws-iam');
const logGroup = require('@aws-cdk/aws-logs');

const config = require('../config.json');

class ConversationInfStack extends cdk.Stack {
  /**
   *
   * @param {cdk.Construct} scope
   * @param {string} id
   * @param {cdk.StackProps=} props
   */
  constructor(scope, id, props) {
    super(scope, id, props);

    const environment = config.ENVIRONMENT;

    const prefix = 'fixpdq';
    const region = config.AWS_REGION;
    const account = config.AWS_ACCOUNT;
    const purpose = 'conversations';
    const apiGatewayRestApiId = config.API_ID;

    const memorySize = parseInt(config.MEMORY_SIZE, 10);
    const concurrency = parseInt(config.CONCURRENCY, 10);
    const timeout = parseInt(config.TIMEOUT, 10);

    // TODO: make this dynamic rather than config or hardcoded
    const userPoolId = config.COGNITO_USERPOOL_ID;
    const CONVERSATIONS_DB_DYNAMODB = config.CONVERSATIONS_DB_DYNAMODB;

    const lambdaFunctionName = `${prefix}-${purpose}-${environment}-lda`;
    const conversationsLambda = new lambda.Function(this, `${prefix}-${purpose}-${environment}-lda`, {
      functionName: lambdaFunctionName,
      description: 'Conversations API lambda.',
      runtime: lambda.Runtime.NODEJS_12_X,
      memorySize: memorySize,
      handler: 'app.handler',
      code: lambda.Code.fromAsset(`assets/ConversationServiceFunction/`,{
        exclude: ['.gitkeep']
      }),
      tracing: lambda.Tracing.ACTIVE,
      reservedConcurrentExecutions: concurrency,
      timeout: cdk.Duration.seconds(timeout),
      environment: {
        'ENVIRONMENT': environment,
        'COGNITO_USERPOOL_ID': userPoolId,
        'TWILIO_ACCOUNT_SID' : config.TWILIO_ACCOUNT_SID,
        'TWILIO_AUTH_TOKEN' : config.TWILIO_AUTH_TOKEN,
        'TWILIO_API_KEY' : config.TWILIO_API_KEY,
        'TWILIO_API_SECRET' : config.TWILIO_API_SECRET,
        'TWILIO_SERVICE_SID' : config.TWILIO_SERVICE_SID,
        'CONVERSATIONS_DB_DYNAMODB' : CONVERSATIONS_DB_DYNAMODB,
        'ENABLE_HIVEMIND': config.ENABLE_HIVEMIND
      }
    });

    conversationsLambda.addPermission(`AllowAPIGwToCallLambda`, {
      action: "lambda:InvokeFunction",
      sourceArn: `arn:aws:execute-api:${region}:${account}:${apiGatewayRestApiId}/*/*/*`,
      principal: new iam.ServicePrincipal("apigateway.amazonaws.com")
    });

    const lambdaCloudWatchLogGroup = new logGroup.LogGroup(this,
      `${prefix}-${purpose}-${environment}-loggroup`,
      {
        logGroupName: `/aws/lambda/${lambdaFunctionName}`,
        retention: logGroup.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY
      });

    const existDynamoDBTable = dynamodb.Table.fromTableName(this, `${CONVERSATIONS_DB_DYNAMODB}-id`, `${CONVERSATIONS_DB_DYNAMODB}`);
    existDynamoDBTable.grantReadWriteData(conversationsLambda);

    conversationsLambda.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        "cognito-idp:ListUsersInGroup",
        "cognito-idp:AdminUserGlobalSignOut",
        "cognito-idp:AdminEnableUser",
        "cognito-idp:AdminDisableUser",
        "cognito-idp:AdminRemoveUserFromGroup",
        "cognito-idp:AdminAddUserToGroup",
        "cognito-idp:AdminListGroupsForUser",
        "cognito-idp:AdminGetUser",
        "cognito-idp:AdminConfirmSignUp",
        "cognito-idp:ListUsers",
        "cognito-idp:DescribeUserPoolClient",
        "cognito-idp:CreateGroup",
        "cognito-idp:DeleteGroup",

      ],
      resources: [`arn:aws:cognito-idp:${region}:${account}:userpool/${userPoolId}`],
    }));

    conversationsLambda.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [ "lambda:InvokeFunction", "lambda:InvokeAsync" ],
        resources: [ '*' ]
      })
    );
  }
}

module.exports = { ConversationInfStack }
