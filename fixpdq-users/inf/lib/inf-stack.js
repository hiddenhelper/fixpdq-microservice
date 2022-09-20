const cdk = require('@aws-cdk/core');
const lambda = require('@aws-cdk/aws-lambda');
const dynamodb = require('@aws-cdk/aws-dynamodb');
const iam = require('@aws-cdk/aws-iam');

const config = require('../config.json');

class UserInfStack extends cdk.Stack {
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
    const purpose = 'users';

    // TODO: make this dynamic rather than config or hardcoded
    const userPoolId = config.COGNITO_USERPOOL_ID;

    const usersLambda = new lambda.Function(this, `${prefix}-${purpose}-${environment}-lda`, {
      functionName: `${prefix}-${purpose}-${environment}-lda`,
      description: 'Users API lambda.',
      runtime: lambda.Runtime.NODEJS_12_X,
      memorySize: 128,
      handler: 'app.handler',
      code: lambda.Code.fromAsset(`assets/UserServiceFunction/`,{
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

    const existDynamoDBTable = dynamodb.Table.fromTableName(this, `${config.DYNAMODB_TABLE_NAME}-id`, `${config.DYNAMODB_TABLE_NAME}`);
    existDynamoDBTable.grantReadWriteData(usersLambda);

    usersLambda.addToRolePolicy(new iam.PolicyStatement({
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
        "cognito-idp:AdminUpdateUserAttributes",
      ],
      resources: [`arn:aws:cognito-idp:${region}:${account}:userpool/${userPoolId}`],
    }));

    usersLambda.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        "s3:GetObject",
        "s3:PutObject",
        "s3:PutObjectAcl"
      ],
      resources: [`arn:aws:s3:::fixpdq-person-storage/*`],
    }));
  }

  
}

module.exports = { UserInfStack }
