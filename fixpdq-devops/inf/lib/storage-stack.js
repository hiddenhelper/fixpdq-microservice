const cdk = require('@aws-cdk/core');
const dynamodb = require('@aws-cdk/aws-dynamodb');
const s3 = require('@aws-cdk/aws-s3');

const config = require('../config');

class StorageStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const prefix = 'fixpdq';
    const environment = config.ENVIRONMENT;

    /************************************************************
     * DynamoDB
     * - tables don't need to be globally unique, so we'll stick with a simplified name
     ***********************************************************/

    // user table
    const userLabel = 'users';
    const userTable = new dynamodb.Table(
      this,
      `${prefix}-${userLabel}-${environment}-ddb`,
      {
        tableName: `${userLabel}`,
        partitionKey: {
          name: 'userid',
          type: dynamodb.AttributeType.STRING,
        },
        encryption: dynamodb.TableEncryption.DEFAULT,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    // workitems table
    const workitemsLabel = 'workitems';
    const workItemsTable = new dynamodb.Table(
      this,
      `${prefix}-${workitemsLabel}-${environment}-ddb`,
      {
        tableName: `${workitemsLabel}`,
        partitionKey: {
          name: 'workitemid',
          type: dynamodb.AttributeType.STRING,
        },
        encryption: dynamodb.TableEncryption.DEFAULT,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    // teams table
    const teamsLabel = 'teams';
    const teamsTable = new dynamodb.Table(
      this,
      `${prefix}-${teamsLabel}-${environment}-ddb`,
      {
        tableName: `${teamsLabel}`,
        partitionKey: {
          name: 'teamid',
          type: dynamodb.AttributeType.STRING,
        },
        encryption: dynamodb.TableEncryption.DEFAULT,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    //swarms table
    const swarmsLabel = 'swarms';
    const swarmsTable = new dynamodb.Table(
      this,
      `${prefix}-${swarmsLabel}-${environment}-ddb`,
      {
        tableName: `${swarmsLabel}`,
        partitionKey: {
          name: 'swarmid',
          type: dynamodb.AttributeType.STRING,
        },
        encryption: dynamodb.TableEncryption.DEFAULT,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    //conversations table
    const conversationsLabel = 'conversations';
    const conversationsTable = new dynamodb.Table(
      this,
      `${prefix}-${conversationsLabel}-${environment}-ddb`,
      {
        tableName: `${conversationsLabel}`,
        partitionKey: {
          name: 'conversationid',
          type: dynamodb.AttributeType.STRING,
        },
        encryption: dynamodb.TableEncryption.DEFAULT,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    // actions table
    const actionsLabel = 'actions';
    const actionsTable = new dynamodb.Table(
      this,
      `${prefix}-${actionsLabel}-${environment}-ddb`,
      {
        tableName: `${actionsLabel}`,
        partitionKey: {
          name: 'actionid',
          type: dynamodb.AttributeType.STRING,
        },
        encryption: dynamodb.TableEncryption.DEFAULT,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    // filters table
    const filtersLabel = 'filters';
    const filtersTable = new dynamodb.Table(
      this,
      `${prefix}-${filtersLabel}-${environment}-ddb`,
      {
        tableName: `${filtersLabel}`,
        partitionKey: {
          name: 'filterid',
          type: dynamodb.AttributeType.STRING,
        },
        encryption: dynamodb.TableEncryption.DEFAULT,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    // playbooks table
    const playbooksLabel = 'playbooks';
    const playbooksTable = new dynamodb.Table(
      this,
      `${prefix}-${playbooksLabel}-${environment}-ddb`,
      {
        tableName: `${playbooksLabel}`,
        partitionKey: {
          name: 'playbookid',
          type: dynamodb.AttributeType.STRING,
        },
        encryption: dynamodb.TableEncryption.DEFAULT,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    //subscriptions table
    const subscriptionsLabel = 'subscriptions';
    const subscriptionsTable = new dynamodb.Table(
      this,
      `${prefix}-${subscriptionsLabel}-${environment}-ddb`,
      {
        tableName: `${subscriptionsLabel}`,
        partitionKey: {
          name: 'subscriptionid',
          type: dynamodb.AttributeType.STRING,
        },
        encryption: dynamodb.TableEncryption.DEFAULT,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );
    subscriptionsTable.addGlobalSecondaryIndex({
      indexName: `${subscriptionsLabel}-person-index`,
      partitionKey: { name: 'personid', type: dynamodb.AttributeType.STRING }
    });

    /************************************************************
     * S3
     * - bucket names needs to be globally unique across AWS, so we need a unique prefix
     ***********************************************************/

    // user bucket
    const userBucketName = `${prefix}-${userLabel}-${environment}-s3`;
    const userBucket = new s3.Bucket(
      this,
      `${prefix}-${userLabel}-${environment}-s3`,
      {
        bucketName: userBucketName,
        versioned: false,
        removalPolicy: cdk.RemovalPolicy.RETAIN,
        blockPublicAccess: {
          blockPublicAcls: false,
          ignorePublicAcls: false,
          blockPublicPolicy: false,
        },
      }
    );

    // workitems bucket
    const workitemsBucketName = `${prefix}-${workitemsLabel}-${environment}-s3`;
    const workitemBucket = new s3.Bucket(
      this,
      `${prefix}-${workitemsLabel}-${environment}-s3`,
      {
        bucketName: workitemsBucketName,
        versioned: true,
        removalPolicy: cdk.RemovalPolicy.RETAIN,
        blockPublicAccess: {
          blockPublicAcls: false,
          ignorePublicAcls: false,
          blockPublicPolicy: false,
        },
        cors: [
          {
            allowedHeaders: ['*'],
            allowedOrigins: ['*'],
            allowedMethods: ['GET', 'PUT'],
            exposedHeaders: [
              'x-amz-server-side-encryption',
              'x-amz-request-id',
              'x-amz-id-2',
            ],
            maxAge: 3000,
          },
        ],
      }
    );

    // playbooks bucket
    const playbooksBucketName = `${prefix}-${playbooksLabel}-${environment}-s3`;
    const playbookBucket = new s3.Bucket(
      this,
      `${prefix}-${playbooksLabel}-${environment}-s3`,
      {
        bucketName: playbooksBucketName,
        versioned: true,
        removalPolicy: cdk.RemovalPolicy.RETAIN,
        blockPublicAccess: {
          blockPublicAcls: false,
          ignorePublicAcls: false,
          blockPublicPolicy: false,
        },
        cors: [
          {
            allowedHeaders: ['*'],
            allowedOrigins: ['*'],
            allowedMethods: ['GET', 'PUT'],
            exposedHeaders: [
              'x-amz-server-side-encryption',
              'x-amz-request-id',
              'x-amz-id-2',
            ],
            maxAge: 3000,
          },
        ],
      }
    );
  }
}

module.exports = { StorageStack };
