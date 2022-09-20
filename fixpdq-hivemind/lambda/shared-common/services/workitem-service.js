import { twilioService } from ".";
import { invokeLambda, WORKITEMS_LAMBDA } from "../utilities/lambda-util";
import { TRANSITIONS } from "./state-definitions";

const aws = require("aws-sdk");

const lambda = new aws.Lambda();

const getStatusAction = (actionItem, actionType) => {
  return TRANSITIONS.find((t) => t.action === actionType)[`${actionItem}`];
};

export const updateWorkitem = async ({
  client,
  workItemId,
  conversationId,
  actionItem,
}) => {
  const actionType = await twilioService.getActionType(conversationId);

  await lambda
    .invoke({
      FunctionName: `fixpdq-workitems-${process.env.ENVIRONMENT}-lda`,
      InvocationType: "RequestResponse",
      Payload: JSON.stringify(
        {
          action: getStatusAction(actionItem, actionType),
          payload: {
            workitemid: workItemId,
            actionType,
          },
        },
        null,
        2
      ),
    })
    .promise();
};

export const getWorkitemsBeforeDue = async ({ days }) => {
  const { Payload: lambdaResponse } = await invokeLambda(
    WORKITEMS_LAMBDA,
    "getWorkitemsBeforeDue",
    { days }
  );

  const { statusCode: callStatus, body: workitems } = JSON.parse(
    lambdaResponse
  );
  if (callStatus === 200) {
    return Object.entries(JSON.parse(workitems)).map(([, value]) => value);
  }
  return [];
};

export const getWorkitemsByStatus = async ({ status }) => {
  const { Payload: lambdaResponse } = await invokeLambda(
    WORKITEMS_LAMBDA,
    "getWorkitemsByStatus",
    { status }
  );

  const { statusCode: callStatus, body: workitems } = JSON.parse(
    lambdaResponse
  );
  if (callStatus === 200) {
    return Object.values(JSON.parse(workitems));
  }
  return [];
};

export const getWorkitemsByEndDateInterval = async ({ start, end }) => {
  const { Payload: lambdaResponse } = await invokeLambda(
    WORKITEMS_LAMBDA,
    "getWorkitemsByEndDateInterval",
    { start, end }
  );

  const { statusCode: callStatus, body: workitems } = JSON.parse(
    lambdaResponse
  );
  if (callStatus === 200) {
    return Object.values(JSON.parse(workitems));
  }
  return [];
};

export const getWorkitemsUnassigned = async () => {
  const { Payload: lambdaResponse } = await invokeLambda(
    WORKITEMS_LAMBDA,
    "getWorkitemsUnassigned",
    {}
  );

  const { statusCode: callStatus, body: workitems } = JSON.parse(
    lambdaResponse
  );
  if (callStatus === 200) {
    return Object.values(JSON.parse(workitems));
  }
  return [];
};
