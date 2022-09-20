import { conversationModel } from "../../shared-common/models";
import { ACTION_ARRAY } from "../../shared-common/models/state-definitions";
import { lambdaUtil } from "../../shared-common/utilities";

// eslint-disable-next-line import/prefer-default-export
export const action = async (event) => {
  let response;
  if (ACTION_ARRAY.includes(event.action)) {
    const creatorid = event.payload.hivemindUser || event.payload.messageOwner;
    const result = await conversationModel.createConversationAndSendMessage({
      data: event.payload,
      creatorid,
      hivemind: {
        allowHivemindProcessing: true,
      },
    });

    // like below, need to intercept this message for now -> will be event driven later and it will be thru the Twilio webhook in the next iteration
    if (process.env.ENABLE_HIVEMIND === "true") {
      await lambdaUtil.invokeLambda(lambdaUtil.HIVEMIND_LAMBDA, {
        author: event.payload.participants[0].Username,
        inputText: event.payload.body,
        conversationSid: result.conversationSid,
        workItemId: event.payload.workItem,
      });
    }

    response = {
      statusCode: 200,
      body: {
        // ...result.participants,
        conversationSid: result.newConversationSid,
      },
    };
  } else if (event.action === "processConversationList") {
    const result = await conversationModel.processConversationList(
      event.payload.conversations
    );
    response = {
      statusCode: 200,
      body: {
        result,
      },
    };
  } else if (event.action === "getWorkitemChannelId") {
    const result = await conversationModel.getOrCreateChannelByWorkitemId(
      event.payload.workitemid,
      event.payload.data
    );
    response = {
      statusCode: 200,
      body: {
        result,
      },
    };
  } else if (event.action === "sendMessage") {
    const result = await conversationModel.sendMessageFromChat(event.payload);
    response = {
      statusCode: 200,
      body: {
        result,
      },
    };
  } else if (event.action === "processAccContractNotifications") {
    const result = await conversationModel.processAccContractNotifications(
      event.payload.notifications
    );
    response = {
      statusCode: 200,
      body: {
        result,
      },
    };
  } else if (event.action === "processWorkitemNumDaysBeforeDueNotifications") {
    const result = await conversationModel.processWorkitemNumDaysBeforeDueNotifications(
      event.payload.notifications
    );
    response = {
      statusCode: 200,
      body: {
        result,
      },
    };
  } else {
    // eslint-disable-next-line no-throw-literal
    throw `Unknow action ${event.action}`;
  }
  return response;
};
