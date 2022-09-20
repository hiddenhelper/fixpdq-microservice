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

    // WorkItems Service
    const workitemsServiceFnName = `${id}-lda`;
    const workitemsServiceLambda = new Lambda.Function(this, `${workitemsServiceFnName}-id`, {
      functionName: workitemsServiceFnName,
      runtime: Lambda.Runtime.NODEJS_12_X,
      memorySize: 128,
      handler: 'app.handler',
      code: Lambda.Code.fromAsset(`assets/WorkItemsServiceFunction/`,{
        exclude: ['.gitkeep']
      }),
      environment: props.config,
      timeout: cdk.Duration.seconds(90)
    });

    const workItemsDynamoDBTable = Dynamodb.Table.fromTableName(this, `${props.config.DYNAMODB_TABLE_NAME}-id`, `${props.config.DYNAMODB_TABLE_NAME}`);
    workItemsDynamoDBTable.grantReadWriteData(workitemsServiceLambda);
  }
}

module.exports = { LambdaStack }
