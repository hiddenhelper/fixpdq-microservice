import { DynamoDB } from "aws-sdk";
import { services as fpdqServices } from "@fixpdq/common";
import { v4 as uuidv4 } from 'uuid';

const { winstonLogger: Log } = fpdqServices.loggerService;

// eslint-disable-next-line import/prefer-default-export
export async function getTeam() {
  const teamTableName = process.env.DB_DYNAMODB;

  const client = new DynamoDB.DocumentClient({
    apiVersion: "2012-10-17",
    region: "ap-southeast-2",
  });

  // teamTableName // @todo use config service
  const params = {
    TableName: "teams",
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
    Log.error(`[service] There was an error with 'getTeam' ${error.message}`);
    throw error;
  }
}

// export async function createTeamTable( data, adminGroup, membersGroup, invitedGroup ) {
export async function createTeamTable() {
  const tablename = process.env.DYNAMODB_TABLE_NAME;

  const client = new DynamoDB.DocumentClient({
    apiVersion: "2012-10-17",
    region: "ap-southeast-2",
  });

  try {
    const teamid = uuidv4();
    const params = {
      TableName: tablename,
      Item: {
        Id: teamid,
        // Name: data.team_name,
        // Purpose: data.team_purpose,
        // Creator: data.creator,
        // Owner: data.owner,
        // Admin: adminGroup.Group.UserPoolId,
        // Members: membersGroup.Group.UserPoolId,
        // Invited: invitedGroup.Group.UserPoolId
      },
    };
    await client.put( params ).promise();
    return params.Item;
  } catch (error) {
    console.log( error );
    throw error;
  }

}
