const cdk = require('@aws-cdk/core');
const Lambda = require('@aws-cdk/aws-lambda');
const Dynamodb = require('@aws-cdk/aws-dynamodb');

class LambdaStack extends cdk.Stack {
  /**
   *
   * @param {cdk.Construct} scope
   * @param {string} id
   * @param {cdk.StackProps=} props
   */
  constructor(scope, id, props) {
    super(scope, id, props);

    // Teams Service
    const teamsServiceFnName = `${id}-lda`;
    const teamsServiceLambda = new Lambda.Function(this, `${teamsServiceFnName}-id`, {
      functionName: teamsServiceFnName,
      runtime: Lambda.Runtime.NODEJS_12_X,
      memorySize: 128,
      handler: 'app.handler',
      code: Lambda.Code.fromAsset(`assets/TeamsServiceFunction/`,{
        exclude: ['.gitkeep']
      }),
      environment: props.config,
      timeout: cdk.Duration.seconds(90)
    });

    const teamsDynamoDBTable = Dynamodb.Table.fromTableName(this, `${props.config.DYNAMODB_TABLE_NAME}-id`, `${props.config.DYNAMODB_TABLE_NAME}`);
    teamsDynamoDBTable.grantReadWriteData(teamsServiceLambda);
  }
}

module.exports = { LambdaStack }
