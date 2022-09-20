import { invokeLambda, ACTION_LAMBDA } from "../utilities/lambda-util";

export const getActions = async ({ days }) => {
  const { Payload: actionsResponse } = await invokeLambda(
    ACTION_LAMBDA,
    "getLatestActions",
    { days }
  );

  const { statusCode: conversationStatus, body: actions } = JSON.parse(
    actionsResponse
  );
  if (conversationStatus === 200) {
    return Object.entries(JSON.parse(actions)).map(([, value]) => value);
  }
  return [];
};

export const createAction = async (payload) => {
  try {
    await invokeLambda(ACTION_LAMBDA, "createAction", payload);
  } catch (e) {
    throw e;
  }
  return [];
};
export const processActionList = async (payload) => {
  try {
    await invokeLambda(ACTION_LAMBDA, "processActionList", payload);
  } catch (e) {
    throw e;
  }
  return [];
};
