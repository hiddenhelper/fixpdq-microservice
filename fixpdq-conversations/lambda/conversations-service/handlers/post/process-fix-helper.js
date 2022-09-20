import { lambdaUtil } from "../../../shared-common/utilities";

export const HELPER_PREFIX = "/fix";
export const HELPER_ACTION_NAME = "FIXPDQ-HELPER";

/* eslint-disable import/prefer-default-export */
export const processFixHelper = async ({ event, userName }) => {
  const eventBody = JSON.parse(event.body);
  const { channelId, conversationid, workitemid } = eventBody;
  const metadata = eventBody.twilioMessage;

  if (metadata.body && metadata.body.startsWith(HELPER_PREFIX)) {
    await lambdaUtil.invokeLambda(lambdaUtil.HIVEMIND_LAMBDA, {
      action: "fix-helper",
      payload: {
        channelId,
        conversationid,
        message: metadata.body,
        workItem: workitemid,
        messageOwner: userName,
        swarmId: eventBody.swarmId,
        lastChild: eventBody.lastChild,
      },
    });
  }
};
