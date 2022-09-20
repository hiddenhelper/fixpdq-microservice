/* eslint-disable no-useless-catch */
import { DynamoDB } from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

import { configUtil } from '../utilities';

let docClient;
let defaultParams = {};

function getDocClient() {
  if (!docClient) {
    const config = configUtil.getConfig();
    defaultParams = {
      TableName: config.dynamodb.tableName,
    };

    docClient = new DynamoDB.DocumentClient({
      apiVersion: '2012-10-17',
      region: 'ap-southeast-2',
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
      return `${enableAttributeNames ? '#' : ''}${fieldname} = :${fieldname}`;
    })
    .join(',');
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

  try {
    const teamid = uuidv4();
    const itemData = {
      ...data,
      teamid,
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
 * id - MUST be passed in as object eg. { teamid: xxx }, { creatorid: xxx},
 *      this way we can dynamically extract the xxid for "Key" value filter
 *
 * @param {Object} id
 * @param {Array} data
 */
export async function updateItem(id, data) {
  const db = getDocClient();
  const filters = getFilters(data, true); // enableAttributeNames = true, fixes reserve keyword issue eg. `name`

  const params = {
    ...defaultParams,
    Key: {
      ...id,
    },
    UpdateExpression: `SET ${filters.FilterExpression}`,
    ExpressionAttributeValues: filters.ExpressionAttributeValues,
    ExpressionAttributeNames: filters.ExpressionAttributeNames,
  };

  try {
    await db.update(params).promise();
    return { ...data[0], ...id };
  } catch (error) {
    throw error;
  }
}
