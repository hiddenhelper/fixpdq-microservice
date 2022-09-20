import { getConfig } from "./config-util";

const AWS = require("aws-sdk");
const config = getConfig();

export const HIVEMIND_LAMBDA = `fixpdq-hivemind-${config.env}-lda`;

export const invokeLambda = async (name, payload) => {
  const lambda = new AWS.Lambda();
  try {
    const result = await lambda
      .invoke({
        FunctionName: name,
        InvocationType: "RequestResponse",
        Payload: JSON.stringify(payload,null,2),
      })
      .promise();

    return result;
  } catch (e) {
    throw `Error calling ${name}: ${JSON.stringify(e)}`;
  }
};
