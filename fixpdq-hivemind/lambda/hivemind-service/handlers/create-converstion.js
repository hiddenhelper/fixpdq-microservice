import { lambdaUtil } from "../../shared-common/utilities";

export const createConversationForAction = async ({ action, payload }) => {
  const { Payload: conversationResponse } = await lambdaUtil.invokeLambda(
    lambdaUtil.CONVERSATION_LAMBDA,
    action,
    payload
  );
  const {
    statusCode: conversationStatus,
    body: conversationRespBody,
  } = JSON.parse(conversationResponse);
  if (conversationStatus === 200) {
    const { conversationSid } = conversationRespBody;
    return conversationSid;
  }
  throw `Error creating conversation`;
};
