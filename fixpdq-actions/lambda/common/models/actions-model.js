/* eslint-disable no-useless-catch */
import { v4 as uuidv4 } from "uuid";

import { dynamodbService } from "../services";
import { STATUS as ACTION_STATE } from "./actions-states";

export async function createAction(data) {
  try {
    const UNIX_TS = new Date().getTime();
    const date_created = UNIX_TS;
    const date_updated = UNIX_TS;

    const result = await dynamodbService.addItem({
      ...data,
      date_created,
      date_updated,
      status: ACTION_STATE.OPEN,
    });
    return result;
  } catch (error) {
    throw error;
  }
}

export async function updateAction(actionid, data) {
  await dynamodbService.updateItem({ actionid }, [
    {
      ...data,
    },
  ]);
  return dynamodbService.getBy([{ actionid }]);
}

export async function getActionsByWorkitemId(workitemid) {
  try {
    const result = await dynamodbService.getBy([{ workitemid }]);
    return result;
  } catch (error) {
    console.log(`[getActionsByWorkitemId] ${JSON.stringify(error)}`);
    return {};
  }
}

export async function getActionsByWorkitemIdAndType({
  workitemid,
  actionType,
}) {
  try {
    const result = await dynamodbService.getBy([
      { workitemid },
      { actionType },
    ]);
    return result.find((action) => action.status === ACTION_STATE.OPEN);
  } catch (error) {
    console.log(`[getActionsByWorkitemIdAndType] ${JSON.stringify(error)}`);
    return {};
  }
}

const chunkify = (array, chunkSize) => {
  return new Array(Math.ceil(array.length / chunkSize))
    .fill()
    .map(() => array.splice(0, chunkSize));
};

export async function getByListOfWorkiems(workitems) {
  const QUERY_CHUNK_SIZE = 100;
  try {
    const queryResult = [];
    const pages = chunkify(workitems, QUERY_CHUNK_SIZE);
    await Promise.all(
      pages.map(async (page) => {
        const actions = await dynamodbService.getByListOfWorkiems(page);
        actions.forEach((action) => {
          queryResult.push(action);
        });
      })
    );
    return queryResult;
  } catch (error) {
    console.log(`[getByListOfWorkiems] ${JSON.stringify(error)}`);
    return {};
  }
}

export async function getLatestActions(days) {
  try {
    const result = await dynamodbService.getLatestActions(days);
    return result;
  } catch (error) {
    console.log(`[getLatestActions] ${JSON.stringify(error)}`);
    return {};
  }
}

export async function getActionsByTypeAndOwnerAndTimestamp({
  actionType,
  activeFor,
  timeStamp
}) {
  try {
    const result = await dynamodbService.getBy([
      { actionType },
      { activeFor },
    ]);
    return result.filter((action) => action.date_created > timeStamp);
  } catch (error) {
    console.log(`[getActionsByTypeAndOwnerAndTimestamp] ${JSON.stringify(error)}`);
    return {};
  }
}