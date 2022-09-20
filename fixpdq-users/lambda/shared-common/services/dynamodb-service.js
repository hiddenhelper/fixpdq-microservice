import { DynamoDB } from "aws-sdk";
import { services as fpdqServices } from "@fixpdq/common";

const { winstonLogger: Log } = fpdqServices.loggerService;

// eslint-disable-next-line import/prefer-default-export
export async function getUser() {
  const userTableName = process.env.DYNAMODB_TABLE_NAME;

  const client = new DynamoDB.DocumentClient({
    apiVersion: "2012-10-17",
    region: "ap-southeast-2",
  });

  // userTableName // @todo use config service
  const params = {
    TableName: "users",
  };

  try {
    let items;
    const scanResults = [];

    do {
      // eslint-disable-next-line no-await-in-loop
      items = await client.scan(params).promise();
      items.Items.forEach((item) => scanResults.push(item));
      params.ExclusiveStartKey = items.LastEvaluatedKey;
    } while (typeof items.LastEvaluatedKey !== "undefined");

    return scanResults;
  } catch (error) {
    Log.error(`[service] There was an error with 'getUser' ${error.message}`);
    throw error;
  }
}
