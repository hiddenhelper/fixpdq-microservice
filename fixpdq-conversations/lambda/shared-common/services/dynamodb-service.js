import { DynamoDB } from "aws-sdk";
import { services as fpdqServices } from "@fixpdq/common";
import { v4 as uuidv4 } from "uuid";
import { configUtil } from "../utilities";
import { DYNAMODB_PARALLELISM } from "../models/global-definitions";

const asyncBatch = require("async-batch").default;

const QUERY_CHUNK_SIZE = 100;

const { winstonLogger: Log } = fpdqServices.loggerService;

const chunkify = (array, chunkSize) => {
  return new Array(Math.ceil(array.length / chunkSize))
    .fill()
    .map(() => array.splice(0, chunkSize));
};

export async function getByListOfWorkitemsChunk(workitems) {
  const config = configUtil.getConfig();
  const client = new DynamoDB.DocumentClient({
    apiVersion: "2012-10-17",
    region: "ap-southeast-2",
  });

  const params = {
    TableName: config.dynamodb.tableName,
    ExpressionAttributeNames: {
      "#workitemId": "workitemId",
    },
  };

  const filterExpr = "#workitemId in (";
  const values = [];
  const exprAttrVal = [];
  workitems.forEach((workitem, index) => {
    exprAttrVal[`:val${index}`] = workitem;
    values.push(`:val${index}`);
  });
  params.FilterExpression = `${filterExpr}${values.join(",")})`;
  params.ExpressionAttributeValues = exprAttrVal;

  const results = [];
  let items = {};

  try {
    do {
      items = await client.scan(params).promise();
      items.Items.forEach((item) => results.push(item));
      params.ExclusiveStartKey = items.LastEvaluatedKey;
    } while (typeof items.LastEvaluatedKey !== "undefined");

    return results;
  } catch (error) {
    Log.error(
      `[service] There was an error with 'getByListOfWorkitems' ${error.message}`
    );
    throw error;
  }
}

export async function getByListOfWorkitems(workitems) {
  const queryResult = [];
  const pages = chunkify(workitems, QUERY_CHUNK_SIZE);
  const processPage = async (page) => {
    const actions = await getByListOfWorkitemsChunk(page);
    actions.forEach((action) => {
      queryResult.push(action);
    });
  };
  await asyncBatch(pages, processPage, DYNAMODB_PARALLELISM);
  return queryResult;
}

export async function getConversationBySid(conversationid) {
  const config = configUtil.getConfig();
  const client = new DynamoDB.DocumentClient({
    apiVersion: "2012-10-17",
    region: "ap-southeast-2",
  });

  const filterParams = {
    TableName: config.dynamodb.tableName,
    FilterExpression: "#conversationid = :conversationid",
    ExpressionAttributeNames: {
      "#conversationid": "conversationid",
    },
    ExpressionAttributeValues: {
      ":conversationid": conversationid,
    },
  };

  const results = [];
  let items = {};

  try {
    do {
      items = await client.scan(filterParams).promise();
      items.Items.forEach((item) => results.push(item));
      filterParams.ExclusiveStartKey = items.LastEvaluatedKey;
    } while (typeof items.LastEvaluatedKey !== "undefined");

    return results;
  } catch (error) {
    Log.error(
      `[service] There was an error with 'getConversationById' ${error.message}`
    );
    throw error;
  }
}

export async function getConversationById(params) {
  const config = configUtil.getConfig();
  const client = new DynamoDB.DocumentClient({
    apiVersion: "2012-10-17",
    region: "ap-southeast-2",
  });

  const filterParams = {
    TableName: config.dynamodb.tableName,
    Key: {
      ...params,
    },
  };

  const results = [];
  let items = {};

  try {
    do {
      items = await client.scan(filterParams).promise();
      items.Items.forEach((item) => results.push(item));
      filterParams.ExclusiveStartKey = items.LastEvaluatedKey;
    } while (typeof items.LastEvaluatedKey !== "undefined");

    return results;
  } catch (error) {
    Log.error(
      `[service] There was an error with 'getConversationById' ${error.message}`
    );
    throw error;
  }
}

// Add message to Conversation DB-------------
export async function storeMessagesToDB(conversationid, messages) {
  const config = configUtil.getConfig();
  const client = new DynamoDB.DocumentClient({
    apiVersion: "2012-10-17",
    region: "ap-southeast-2",
  });

  try {
    const params = {
      TableName: config.dynamodb.tableName,
      Key: {
        conversationid,
      },
      UpdateExpression: "set #messages = :messages",
      ExpressionAttributeValues: {
        ":messages": messages,
      },
      ExpressionAttributeNames: {
        "#messages": "messages",
      },
      ReturnValues: "ALL_NEW",
    };
    return await client.update(params).promise();
  } catch (error) {
    Log.error(
      `[service] There was an error with 'storeMessagesToDB' ${error.message}`
    );
    throw error;
  }
}

export async function createConversation(conversationid, data) {
  const config = configUtil.getConfig();
  const client = new DynamoDB.DocumentClient({
    apiVersion: "2012-10-17",
    region: "ap-southeast-2",
  });
  const UNIX_TS = new Date().getTime();
  const date_created = UNIX_TS;
  const date_updated = UNIX_TS;

  try {
    const params = {
      TableName: config.dynamodb.tableName,
      Item: {
        date_created,
        date_updated,
        conversationid,
        workitemId: data.workItem || data.workitemid,
        actionName: data.actionName,
        actionOwner: data.actionOwner,
        topicName: data.topicName,
        messages: [data.body],
        hivemind: data.hivemind,
        providerMetadata: {
          messageId: data.messageId,
          channelId: data.channelId,
        },
      },
    };
    await client.put(params).promise();
    return params.Item;
  } catch (error) {
    Log.error(
      `[service] There was an error with 'createConversation' ${error.message}`
    );
    throw error;
  }
}

export async function deleteItem(conversationid) {
  const config = configUtil.getConfig();
  const client = new DynamoDB.DocumentClient({
    apiVersion: "2012-10-17",
    region: "ap-southeast-2",
  });

  try {
    const params = {
      TableName: config.dynamodb.tableName,
      Key: {
        conversationid,
      },
    };
    return await client.delete(params).promise();
  } catch (error) {
    Log.error(
      `[service] There was an error with 'deleteItem' ${error.message}`
    );
    throw error;
  }
}

export async function getById(conversationid) {
  const config = configUtil.getConfig();
  const client = new DynamoDB.DocumentClient({
    apiVersion: "2012-10-17",
    region: "ap-southeast-2",
  });

  const params = {
    TableName: config.dynamodb.tableName,
    FilterExpression: "#conversationid = :conversationid",
    ExpressionAttributeNames: {
      "#conversationid": "conversationid",
    },
    ExpressionAttributeValues: {
      ":conversationid": conversationid,
    },
  };

  const results = [];
  let items = {};

  try {
    do {
      items = await client.scan(params).promise();
      items.Items.forEach((item) => results.push(item));
      params.ExclusiveStartKey = items.LastEvaluatedKey;
    } while (typeof items.LastEvaluatedKey !== "undefined");

    return results;
  } catch (error) {
    Log.error(
      `[service] There was an error with 'getByListOfWorkitems' ${error.message}`
    );
    throw error;
  }
}

export const storeOneMessage = async (conversationid, messageToStore) => {
  try {
    const conversation = await getById(conversationid);
    if (conversation) {
      const { messages } = conversation[0];
      messages.push(JSON.stringify(messageToStore));
      const result = await storeMessagesToDB(conversationid, messages);
      return result;
    }
  } catch (error) {
    Log.error(
      `[service] There was an error with 'getByListOfWorkitems' ${error.message}`
    );
    throw error;
  }
};
