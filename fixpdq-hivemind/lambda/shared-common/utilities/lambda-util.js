import { getConfig } from "./config-util";

const AWS = require("aws-sdk");

const config = getConfig();

export const ACTION_LAMBDA = `fixpdq-actions-${config.env}-lda`;
export const HIVEMIND_LAMBDA = `fixpdq-hivemind-${config.env}-lda`;
export const WORKITEMS_LAMBDA = `fixpdq-workitems-${config.env}-lda`;
export const CONVERSATION_LAMBDA = `fixpdq-conversations-${config.env}-lda`;
export const PLAYBOOKS_LAMBDA = `fixpdq-playbooks-${config.env}-lda`;
export const SWARMS_LAMBDA = `fixpdq-swarms-${config.env}-lda`;

export const invokeLambda = async (name, action, payload) => {
  const lambda = new AWS.Lambda();
  try {
    const result = await lambda
      .invoke({
        FunctionName: name,
        InvocationType: "RequestResponse",
        Payload: JSON.stringify(
          {
            action,
            payload,
          },
          null,
          2
        ),
      })
      .promise();

    return result;
  } catch (e) {
    throw `Error calling ${name}: ${JSON.stringify(e)}`;
  }
};
