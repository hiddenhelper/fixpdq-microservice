const cdk = require('@aws-cdk/core');
const lambda = require('@aws-cdk/aws-lambda');
const dynamodb = require('@aws-cdk/aws-dynamodb');
const iam = require('@aws-cdk/aws-iam');

const config = require('../config.json');

class TeamInfStack extends cdk.Stack {
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
    const purpose = 'teams';

    // TODO: make this dynamic rather than config or hardcoded
    const userPoolId = config.COGNITO_USERPOOL_ID;

    const teamsLambda = new lambda.Function(this, `${prefix}-${purpose}-${environment}-lda`, {
      functionName: `${prefix}-${purpose}-${environment}-lda`,
      description: 'Teams API lambda.',
      runtime: lambda.Runtime.NODEJS_12_X,
      memorySize: 128,
      handler: 'app.handler',
      code: lambda.Code.fromAsset(`assets/TeamServiceFunction/`,{
        exclude: ['.gitkeep']
      }),
      tracing: lambda.Tracing.ACTIVE,
      reservedConcurrentExecutions: 1,
      timeout: cdk.Duration.seconds(90),
      environment: {
        'ENVIRONMENT': environment,
        'COGNITO_USERPOOL_ID': userPoolId
      }
    });

    const existDynamoDBTable = dynamodb.Table.fromTableName(this, `${config.DB_DYNAMODB}-id`, `${config.DB_DYNAMODB}`);
    existDynamoDBTable.grantReadWriteData(teamsLambda);

    teamsLambda.addToRolePolicy(new iam.PolicyStatement({
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
      ],
      resources: [`arn:aws:cognito-idp:${region}:${account}:userpool/${userPoolId}`],
    }));
  }
}

module.exports = { TeamInfStack }
