const cdk = require('@aws-cdk/core');
const lambda = require('@aws-cdk/aws-lambda');
const dynamodb = require('@aws-cdk/aws-dynamodb');
const iam = require('@aws-cdk/aws-iam');
const logGroup = require('@aws-cdk/aws-logs');

const config = require('../config.json');

class ActionsInfStack extends cdk.Stack {
  /**
   *
   * @param {cdk.Construct} scope
   * @param {string} id
   * @param {cdk.StackProps=} props
   */
  constructor(scope, id, props) {
    super(scope, id, props);

    const environment = config.ENVIRONMENT;
    const loggingLevel = config.ACTIONS_LOGGING_LEVEL;
    const loggingDriver = config.ACTIONS_LOGGING_DRIVER;
    const dynamoDbTableName = config.ACTIONS_DB_DYNAMODB;

    const memorySize = parseInt(config.MEMORY_SIZE, 10);
    const concurrency = parseInt(config.CONCURRENCY, 10);
    const timeout = parseInt(config.TIMEOUT, 10);

    const prefix = 'fixpdq';
    const purpose = 'actions';
    const region = config.AWS_REGION;
    const account = config.AWS_ACCOUNT;
    const userPoolId = config.COGNITO_USERPOOL_ID;
    const apiGatewayRestApiId = config.API_ID;

    const lambdaFunctionName = `${prefix}-${purpose}-${environment}-lda`;
    const actionsLambda = new lambda.Function(this, `${prefix}-${purpose}-${environment}-lda`, {
      functionName: lambdaFunctionName,
      description: 'Actions API lambda.',
      runtime: lambda.Runtime.NODEJS_12_X,
      memorySize: memorySize,
      handler: 'app.handler',
      code: lambda.Code.fromAsset(`assets/ActionsServiceFunction/`,{
        exclude: ['.gitkeep']
      }),
      tracing: lambda.Tracing.ACTIVE,
      reservedConcurrentExecutions: concurrency,
      timeout: cdk.Duration.seconds(timeout),
      environment: {
        'ENVIRONMENT': environment,
        'ACTIONS_LOGGING_LEVEL': loggingLevel,
        'ACTIONS_LOGGING_DRIVER': loggingDriver,
        'ACTIONS_DB_DYNAMODB': dynamoDbTableName,
        'COGNITO_USERPOOL_ID': userPoolId
      }
    });

    actionsLambda.addPermission(`AllowAPIGwToCallLambda`, {
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

    const existDynamoDBTable = dynamodb.Table.fromTableName(this, `${prefix}-dynamodb-${purpose}-${environment}-ddb`, `${dynamoDbTableName}`);
    existDynamoDBTable.grantReadWriteData(actionsLambda);

    actionsLambda.addToRolePolicy(new iam.PolicyStatement({
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
  }
}

module.exports = { ActionsInfStack }
