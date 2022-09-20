const cdk = require('@aws-cdk/core');
const lambda = require('@aws-cdk/aws-lambda');
const dynamodb = require('@aws-cdk/aws-dynamodb');
const iam = require('@aws-cdk/aws-iam');
const logGroup = require('@aws-cdk/aws-logs');
const events = require('@aws-cdk/aws-events');
const targets = require('@aws-cdk/aws-events-targets');
const config = require('../config.json');

class HivemindInfStack extends cdk.Stack {
  /**
   *
   * @param {cdk.Construct} scope
   * @param {string} id
   * @param {cdk.StackProps=} props
   */
  constructor(scope, id, props) {
    super(scope, id, props);

    const environment = config.ENVIRONMENT;
    const loggingLevel = config.HIVEMIND_LOGGING_LEVEL;
    const loggingDriver = config.HIVEMIND_LOGGING_DRIVER;
    const dynamoDbTableName = config.HIVEMIND_DB_DYNAMODB;
    const botName = config.BOT_NAME;
    const botAlias = config.BOT_ALIAS;

    const prefix = 'fixpdq';
    const region = config.AWS_REGION;
    const account = config.AWS_ACCOUNT;
    const purpose = 'hivemind';
    const purposeFulfilment = 'hivemindfulfilment';
    const purposeRules = 'hivemindmonitor';
    const purposeConversation = 'hivemindconversation';
    const apiGatewayRestApiId = config.API_ID;
    const webhookApiId = config.WEBHOOK_ID;
    const googleCloudCredentials = config.GOOGLE_APPLICATION_CREDENTIALS;
    const memorySize = parseInt(config.MEMORY_SIZE, 10);
    const concurrency = parseInt(config.CONCURRENCY, 10);
    const timeout = parseInt(config.TIMEOUT, 10);
    const hivemindUserId = config.HIVEMIND_USER_ID;
    const googleProjectName = config.GOOGLE_PROJECT_NAME;

    const isMonitorEnabled = (config.MONITOR_ENABLED === 'true');
    const monitorFrequency = parseInt(config.MONITOR_FREQUENCY, 10);

    // *** NOTE: hivemind
    const lambdaFunctionName = `${prefix}-${purpose}-${environment}-lda`;
    const hivemindLambda = new lambda.Function(this, `${prefix}-${purpose}-${environment}-lda`, {
      functionName: lambdaFunctionName,
      description: 'Hivemind Microservice (Lambda).',
      runtime: lambda.Runtime.NODEJS_12_X,
      memorySize: memorySize,
      handler: 'app.handler',
      code: lambda.Code.fromAsset(`assets/HivemindServiceFunction/`,{
        exclude: ['.gitkeep']
      }),
      tracing: lambda.Tracing.ACTIVE,
      reservedConcurrentExecutions: concurrency,
      timeout: cdk.Duration.seconds(timeout),
      environment: {
        'ENVIRONMENT': environment,
        'HIVEMIND_LOGGING_LEVEL': loggingLevel,
        'HIVEMIND_LOGGING_DRIVER': loggingDriver,
        'HIVEMIND_DB_DYNAMODB': dynamoDbTableName,
        'BOT_NAME': botName,
        'BOT_ALIAS': botAlias,
        'TWILIO_ACCOUNT_SID' : config.TWILIO_ACCOUNT_SID,
        'TWILIO_AUTH_TOKEN' : config.TWILIO_AUTH_TOKEN,
        'TWILIO_API_KEY' : config.TWILIO_API_KEY,
        'TWILIO_API_SECRET' : config.TWILIO_API_SECRET,
        'TWILIO_SERVICE_SID' : config.TWILIO_SERVICE_SID,
        'GOOGLE_APPLICATION_CREDENTIALS' : googleCloudCredentials,
        'HIVEMIND_USER_ID': hivemindUserId,
        'GOOGLE_PROJECT_NAME': googleProjectName,
      }
    });

    hivemindLambda.addPermission(`AllowAPIGwToCallLambda`, {
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
    existDynamoDBTable.grantReadWriteData(hivemindLambda);

    hivemindLambda.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [ "lambda:InvokeFunction", "lambda:InvokeAsync" ],
        resources: [ '*' ]
      })
    );

    hivemindLambda.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          "lex:PostText",
          "lex:PutSession",
          "lex:PutBot",
          "lex:PostContent",
          "lex:GetIntent",
          "lex:PutIntent",
          "lex:PutBotAlias"
        ],
        resources: [
          `arn:aws:lex:*:${account}:bot:*:*`,
          `arn:aws:lex:*:${account}:slottype:*:*`,
          `arn:aws:lex:*:${account}:intent:*:*`
        ]
      })
    );

    hivemindLambda.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          "lex:GetIntents",
          "lex:GetBots"
        ],
        resources: [ '*' ]
      })
    );

    // *** NOTE: hivemind fulfilment
    const lambdaFulfilmentFunctionName = `${prefix}-${purposeFulfilment}-${environment}-lda`;
    const hivemindFulfilmentLambda = new lambda.Function(this, `${prefix}-${purposeFulfilment}-${environment}-lda`, {
      functionName: lambdaFulfilmentFunctionName,
      description: 'Hivemind Fulfilment Microservice (Lambda).',
      runtime: lambda.Runtime.NODEJS_12_X,
      memorySize: memorySize,
      handler: 'app.handler',
      code: lambda.Code.fromAsset(`assets/HivemindFulfilmentServiceFunction/`,{
        exclude: ['.gitkeep']
      }),
      tracing: lambda.Tracing.ACTIVE,
      reservedConcurrentExecutions: concurrency,
      timeout: cdk.Duration.seconds(timeout),
      environment: {
        'ENVIRONMENT': environment,
        'HIVEMIND_LOGGING_LEVEL': loggingLevel,
        'HIVEMIND_LOGGING_DRIVER': loggingDriver,
        'HIVEMIND_DB_DYNAMODB': dynamoDbTableName,
        'BOT_NAME': botName,
        'BOT_ALIAS': botAlias,
        'TWILIO_ACCOUNT_SID' : config.TWILIO_ACCOUNT_SID,
        'TWILIO_AUTH_TOKEN' : config.TWILIO_AUTH_TOKEN,
        'TWILIO_API_KEY' : config.TWILIO_API_KEY,
        'TWILIO_API_SECRET' : config.TWILIO_API_SECRET,
        'TWILIO_SERVICE_SID' : config.TWILIO_SERVICE_SID,
        'HIVEMIND_USER_ID': hivemindUserId,
        'GOOGLE_APPLICATION_CREDENTIALS' : googleCloudCredentials,
        'GOOGLE_PROJECT_NAME': googleProjectName,
      }
    });

    hivemindFulfilmentLambda.addPermission(`AllowAPIGwToCallLambda`, {
      action: "lambda:InvokeFunction",
      sourceArn: `arn:aws:execute-api:${region}:${account}:${apiGatewayRestApiId}/*/*/*`,
      principal: new iam.ServicePrincipal("apigateway.amazonaws.com")
    });

    hivemindFulfilmentLambda.addPermission(`AllowWebhookGwToCallLambda`, {
      action: "lambda:InvokeFunction",
      sourceArn: `arn:aws:execute-api:${region}:${account}:${webhookApiId}/*/*/*`,
      principal: new iam.ServicePrincipal("apigateway.amazonaws.com")
    });

    const lambdaFulfilmentCloudWatchLogGroup = new logGroup.LogGroup(this,
      `${prefix}-${purposeFulfilment}-${environment}-loggroup`,
      {
        logGroupName: `/aws/lambda/${lambdaFulfilmentFunctionName}`,
        retention: logGroup.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY
      });

    const existingDynamoDBTable = dynamodb.Table.fromTableName(this, `${prefix}-dynamodb-${purposeFulfilment}-${environment}-ddb`, `${dynamoDbTableName}`);
    existingDynamoDBTable.grantReadWriteData(hivemindFulfilmentLambda);

    hivemindFulfilmentLambda.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [ "lambda:InvokeFunction", "lambda:InvokeAsync" ],
        resources: [ '*' ]
      })
    );

    hivemindFulfilmentLambda.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          "lex:PostText",
          "lex:PutSession",
          "lex:PutBot",
          "lex:PostContent",
          "lex:GetIntent",
          "lex:PutIntent",
          "lex:PutBotAlias"
        ],
        resources: [
          `arn:aws:lex:*:${account}:bot:*:*`,
          `arn:aws:lex:*:${account}:slottype:*:*`,
          `arn:aws:lex:*:${account}:intent:*:*`
        ]
      })
    );

    hivemindFulfilmentLambda.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          "lex:GetIntents",
          "lex:GetBots"
        ],
        resources: [ '*' ]
      })
    );

    // *** NOTE: hivemind conversations
    const lambdaConversationFunctionName = `${prefix}-${purposeConversation}-${environment}-lda`;
    const hivemindConversationLambda = new lambda.Function(this, `${prefix}-${purposeConversation}-${environment}-lda`, {
      functionName: lambdaConversationFunctionName,
      description: 'Hivemind Conversations Microservice (Lambda).',
      runtime: lambda.Runtime.NODEJS_12_X,
      memorySize: memorySize,
      handler: 'app.handler',
      code: lambda.Code.fromAsset(`assets/HivemindConversationServiceFunction/`,{
        exclude: ['.gitkeep']
      }),
      tracing: lambda.Tracing.ACTIVE,
      reservedConcurrentExecutions: concurrency,
      timeout: cdk.Duration.seconds(timeout),
      environment: {
        'ENVIRONMENT': environment,
        'HIVEMIND_LOGGING_LEVEL': loggingLevel,
        'HIVEMIND_LOGGING_DRIVER': loggingDriver,
        'HIVEMIND_DB_DYNAMODB': dynamoDbTableName,
        'BOT_NAME': botName,
        'BOT_ALIAS': botAlias,
        'TWILIO_ACCOUNT_SID' : config.TWILIO_ACCOUNT_SID,
        'TWILIO_AUTH_TOKEN' : config.TWILIO_AUTH_TOKEN,
        'TWILIO_API_KEY' : config.TWILIO_API_KEY,
        'TWILIO_API_SECRET' : config.TWILIO_API_SECRET,
        'TWILIO_SERVICE_SID' : config.TWILIO_SERVICE_SID,
        'HIVEMIND_USER_ID': hivemindUserId,
        'GOOGLE_APPLICATION_CREDENTIALS' : googleCloudCredentials,
        'GOOGLE_PROJECT_NAME': googleProjectName
      }
    });

    hivemindConversationLambda.addPermission(`AllowAPIGwToCallLambda`, {
      action: "lambda:InvokeFunction",
      sourceArn: `arn:aws:execute-api:${region}:${account}:${apiGatewayRestApiId}/*/*/*`,
      principal: new iam.ServicePrincipal("apigateway.amazonaws.com")
    });

    hivemindConversationLambda.addPermission(`AllowWebhookGwToCallLambda`, {
      action: "lambda:InvokeFunction",
      sourceArn: `arn:aws:execute-api:${region}:${account}:${webhookApiId}/*/*/*`,
      principal: new iam.ServicePrincipal("apigateway.amazonaws.com")
    });

    const lambdaConversationCloudWatchLogGroup = new logGroup.LogGroup(this,
      `${prefix}-${purposeConversation}-${environment}-loggroup`,
      {
        logGroupName: `/aws/lambda/${lambdaConversationFunctionName}`,
        retention: logGroup.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY
      });

    const theConversationsDynamoDBTable = dynamodb.Table.fromTableName(this, `${prefix}-dynamodb-${purposeConversation}-${environment}-ddb`, `${dynamoDbTableName}`);
    theConversationsDynamoDBTable.grantReadWriteData(hivemindConversationLambda);

    hivemindConversationLambda.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [ "lambda:InvokeFunction", "lambda:InvokeAsync" ],
        resources: [ '*' ]
      })
    );

    // *** NOTE: hivemind rules - monitor
    const lambdaMonitorFunctionName = `${prefix}-${purposeRules}-${environment}-lda`;
    const hivemindMonitorLambda = new lambda.Function(this, `${prefix}-${purposeRules}-${environment}-lda`, {
      functionName: lambdaMonitorFunctionName,
      description: 'Hivemind Rules Microservice (Lambda).',
      runtime: lambda.Runtime.NODEJS_12_X,
      memorySize: memorySize,
      handler: 'app.handler',
      code: lambda.Code.fromAsset(`assets/HivemindMonitorServiceFunction/`,{
        exclude: ['.gitkeep']
      }),
      tracing: lambda.Tracing.ACTIVE,
      reservedConcurrentExecutions: concurrency,
      timeout: cdk.Duration.seconds(timeout),
      environment: {
        'ENVIRONMENT': environment,
        'HIVEMIND_LOGGING_LEVEL': loggingLevel,
        'HIVEMIND_LOGGING_DRIVER': loggingDriver,
        'HIVEMIND_DB_DYNAMODB': dynamoDbTableName,
        'BOT_NAME': botName,
        'BOT_ALIAS': botAlias,
        'TWILIO_ACCOUNT_SID' : config.TWILIO_ACCOUNT_SID,
        'TWILIO_AUTH_TOKEN' : config.TWILIO_AUTH_TOKEN,
        'TWILIO_API_KEY' : config.TWILIO_API_KEY,
        'TWILIO_API_SECRET' : config.TWILIO_API_SECRET,
        'TWILIO_SERVICE_SID' : config.TWILIO_SERVICE_SID,
        'HIVEMIND_USER_ID': hivemindUserId,
        'GOOGLE_APPLICATION_CREDENTIALS' : googleCloudCredentials,
        'GOOGLE_PROJECT_NAME': googleProjectName,
        'RULES_RUNNER_PARALLELISM': config.RULES_RUNNER_PARALLELISM,
        'RULE_PARALLELISM': config.RULE_PARALLELISM,
        'ACC_CONTRACT_NUM_DAYS_OPEN': config.ACC_CONTRACT_NUM_DAYS_OPEN,
        'WORKITEM_NUM_DAYS_BEFORE_DUE': config.WORKITEM_NUM_DAYS_BEFORE_DUE,
        'REMIND_WORKITEM_HAS_STATUS_NEW': config.REMIND_WORKITEM_HAS_STATUS_NEW,
        'REMIND_WORKITEM_HAS_STATUS_ON_HOLD': config.REMIND_WORKITEM_HAS_STATUS_ON_HOLD,
        'REMIND_WORKITEM_DUE_TODAY': config.REMIND_WORKITEM_DUE_TODAY,
        'REMIND_WORKITEM_UNASSIGNED': config.REMIND_WORKITEM_UNASSIGNED,
      }
    });

    const rule = new events.Rule(this, `${prefix}-${purposeRules}-${environment}-trigger`, {
      ruleName: `${prefix}-${purposeRules}-${environment}-trigger`,
      description: `Triggers the monitor (rules engine).`,
      enabled: isMonitorEnabled,
      schedule: events.Schedule.rate(cdk.Duration.minutes(monitorFrequency))
    });
    rule.addTarget(new targets.LambdaFunction(hivemindMonitorLambda));

    hivemindMonitorLambda.addPermission(`AllowAPIGwToCallLambda`, {
      action: "lambda:InvokeFunction",
      sourceArn: `arn:aws:execute-api:${region}:${account}:${apiGatewayRestApiId}/*/*/*`,
      principal: new iam.ServicePrincipal("apigateway.amazonaws.com")
    });

    hivemindMonitorLambda.addPermission(`AllowWebhookGwToCallLambda`, {
      action: "lambda:InvokeFunction",
      sourceArn: `arn:aws:execute-api:${region}:${account}:${webhookApiId}/*/*/*`,
      principal: new iam.ServicePrincipal("apigateway.amazonaws.com")
    });

    const lambdaMonitorCloudWatchLogGroup = new logGroup.LogGroup(this,
      `${prefix}-${purposeRules}-${environment}-loggroup`,
      {
        logGroupName: `/aws/lambda/${lambdaMonitorFunctionName}`,
        retention: logGroup.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY
      });

    const existingConversationsDynamoDBTable = dynamodb.Table.fromTableName(this, `${prefix}-dynamodb-${purposeRules}-${environment}-ddb`, `${dynamoDbTableName}`);
    existingConversationsDynamoDBTable.grantReadWriteData(hivemindMonitorLambda);

    hivemindMonitorLambda.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [ "lambda:InvokeFunction", "lambda:InvokeAsync" ],
        resources: [ '*' ]
      })
    );
  }
}

module.exports = { HivemindInfStack }
