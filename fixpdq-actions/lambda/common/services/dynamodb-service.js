/* eslint-disable no-useless-catch */
import { DynamoDB } from "aws-sdk";
import { v4 as uuidv4 } from "uuid";

import { services as fpdqServices } from "@fixpdq/common";
import { configUtil } from "../utilities";

const { winstonLogger: Log } = fpdqServices.loggerService;

let docClient;
let defaultParams = {};

function getDocClient() {
  if (!docClient) {
    const config = configUtil.getConfig();
    defaultParams = {
      TableName: config.dynamodb.tableName,
    };

    docClient = new DynamoDB.DocumentClient({
      apiVersion: "2012-10-17",
      region: "ap-southeast-2",
    });
  }

  return docClient;
}

/**
 * [
 *    {
 *      FieldName:  // DB Fieldname
 *      "Value"     // Value to compare with
 *                  // eg. where OwnerID = '2323-123123'
 *    }
 * ],
 * [ {} ], [ {} ]...
 *
 * enableAttributeNames - default false.
 *                      - when TRUE, it avoids the `reserve` keyword issue with DynamoDB
 *                        by returning ExpressionAttributeNames with fields names prepended with `#`
 *                        eg.
 *                            '#reservekeyword': 'reservekeyword',
 *                            '#name': 'name'
 */
function getFilters(where, enableAttributeNames) {
  const FilterExpression = where
    .map((i) => {
      const fieldname = Object.keys(i)[0];
      return `${enableAttributeNames ? "#" : ""}${fieldname} = :${fieldname}`;
    })
    .join(" and ");
  const ExpressionAttributeValues = Object.assign(
    {},
    ...where.map((i) => {
      const k = Object.keys(i)[0];
      const v = {};
      v[`:${k}`] = i[k];
      return v;
    })
  );
  const ExpressionAttributeNames = Object.assign(
    {},
    ...where.map((i) => {
      const k = Object.keys(i)[0];
      const v = {};
      v[`#${k}`] = `${k}`;
      return v;
    })
  );

  return {
    FilterExpression,
    ExpressionAttributeValues,
    ExpressionAttributeNames,
  };
}

export async function getBy(params) {
  const db = getDocClient();
  const dbFilters = getFilters(params);

  const filterParams = {
    ...defaultParams,
    FilterExpression: dbFilters.FilterExpression,
    ExpressionAttributeValues: dbFilters.ExpressionAttributeValues,
  };

  const results = [];
  let items = {};

  try {
    do {
      items = await db.scan(filterParams).promise();
      items.Items.forEach((item) => results.push(item));
      filterParams.ExclusiveStartKey = items.LastEvaluatedKey;
    } while (typeof items.LastEvaluatedKey !== "undefined");

    return results;
  } catch (error) {
    throw error;
  }
}

export async function addItem(data) {
  const db = getDocClient();
  delete data.parentid;
  try {
    const actionid = uuidv4();
    const itemData = {
      ...data,
      actionid,
    };
    const params = {
      ...defaultParams,
      Item: itemData,
    };

    await db.put(params).promise();
    return itemData;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

/**
 * id - MUST be passed in as object eg. { actionid: xxx }, { creatorid: xxx},
 *      this way we can dynamically extract the xxid for "Key" value filter
 *
 * @param {Object} id
 * @param {Array} data
 */

// TODO Temporary fix. Refactor/Troubleshoot getFilters
export async function updateItem(id, data) {
  const UNIX_TS = new Date().getTime();
  const date_updated = UNIX_TS;
  const db = getDocClient();
  const dataToUse = data[0];

  const updateExpression = Object.entries(dataToUse).reduce((acc, [key]) => {
    acc += `, #${key}=:${key}`;
    return acc;
  }, "SET #date_updated=:date_updated");

  // console.log(updateExpression);

  const params = {
    ...defaultParams,
    Key: {
      ...id,
    },
    UpdateExpression: updateExpression,
    ExpressionAttributeValues: {
      ":date_updated": date_updated,
    },
    ExpressionAttributeNames: {
      "#date_updated": "date_updated",
    },
    // ReturnValues: "ALL_NEW",
  };

  Object.entries(dataToUse).forEach(([key, value]) => {
    params.ExpressionAttributeValues[`:${key}`] = value;
    params.ExpressionAttributeNames[`#${key}`] = `${key}`;
  });

  try {
    await db.update(params).promise();
    return { ...data[0], ...id };
  } catch (error) {
    throw error;
  }
}

const query = async ({ client, params }) => {
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
    Log.error(
      `[service] There was an error with 'getByListOfWorkiems' ${error}`
    );
    throw error;
  }
};

export async function getByListOfWorkiems(workitems) {
  const config = configUtil.getConfig();
  const client = new DynamoDB.DocumentClient({
    apiVersion: "2012-10-17",
    region: "ap-southeast-2",
  });

  const params = {
    TableName: config.dynamodb.tableName,
    ExpressionAttributeNames: {
      "#workitemid": "workitemid",
    },
  };

  const filterExpr = "#workitemid in (";
  const values = [];
  const exprAttrVal = [];
  workitems.forEach((workitem, index) => {
    exprAttrVal[`:val${index}`] = workitem;
    values.push(`:val${index}`);
  });
  params.FilterExpression = `${filterExpr}${values.join(",")})`;
  params.ExpressionAttributeValues = exprAttrVal;

  const actions = await query({ client, params });

  return actions;
}

export async function getLatestActions(days) {
  const timestamp = new Date().getTime() - days * 24 * 60 * 60 * 1000;
  const config = configUtil.getConfig();
  const client = new DynamoDB.DocumentClient({
    apiVersion: "2012-10-17",
    region: "ap-southeast-2",
  });

  const params = {
    TableName: config.dynamodb.tableName,
    ExpressionAttributeNames: {
      "#date_created": "date_created",
      "#status": "status",
    },
    FilterExpression: "#date_created < :val1 AND #status = :val2",
  };

  const exprAttrVal = [];
  exprAttrVal[":val1"] = timestamp;
  exprAttrVal[":val2"] = "OPEN";
  params.ExpressionAttributeValues = exprAttrVal;

  const actions = await query({ client, params });

  return actions;
}
