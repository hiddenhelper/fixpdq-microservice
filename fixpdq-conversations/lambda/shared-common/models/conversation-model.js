import { services as fpdqServices } from "@fixpdq/common";
import { twilioService, dynamodbService } from "../services";
import { storeOneMessage } from "../services/dynamodb-service";
import { TWILIO_PARALLELISM } from "./global-definitions";

const asyncBatch = require("async-batch").default;

const { winstonLogger: Log } = fpdqServices.loggerService;

// generate Twilio Token
export async function getTwilioToken(username) {
  try {
    const result = await twilioService.generateToken(username);
    return result;
  } catch (error) {
    Log.error(
      `[model] There was an error with 'getTwilioToken' ${error.message}`
    );
    throw error;
  }
}

// create a new conversation to db (used for non-action conversations)
export async function createConversationOnly(data) {
  const { channelId, conversationid, twilioMessage } = data;
  try {
    let startDate = new Date().getTime();
    let endDate;
    Log.info(`start - add participants`);

    let participants;
    if (data.participants && data.participants.length > 0) {
      participants = await twilioService.addParticipants(
        channelId,
        data.participants
      );
    }

    endDate = new Date().getTime();
    Log.info(`done - add participants: ${endDate - startDate}`);

    startDate = new Date().getTime();
    Log.info(`start - create a new conversation`);

    const messageToStore = {
      dateUpdated: twilioMessage.dateUpdated,
      dateCreated: twilioMessage.dateCreated,
      conversationSid: twilioMessage.conversationSid,
      body: twilioMessage.body,
      author: twilioMessage.author,
      attributes: twilioMessage.attributes,
      sid: twilioMessage.sid,
    };

    await dynamodbService.createConversation(conversationid, {
      ...data,
      body: JSON.stringify(messageToStore),
      messageId: twilioMessage.sid,
    });

    endDate = new Date().getTime();
    Log.info(`done - create a new conversation: ${endDate - startDate}`);

    return { messageId: twilioMessage.sid, participants };
  } catch (error) {
    Log.error(
      `[model] There was an error with 'createConversationOnly' ${error.message}`
    );
    throw error;
  }
}

// create a new conversation (used for actions)
export async function createConversationAndSendMessage({
  data,
  creatorid,
  hivemind,
}) {
  const {
    channelId,
    conversationid,
    body,
    msgRecipient,
    workitemid,
    topicName,
    actionOwner,
    actionName,
  } = data;
  const creatorOrHivemind = creatorid || data.hivemindUser;
  try {
    const startDate = new Date().getTime();
    Log.info(`start - add participants`);

    const participants = await twilioService.addParticipants(
      channelId,
      data.participants
    );

    const response = await twilioService.sendMessage({
      channelId,
      conversationid,
      author: creatorOrHivemind,
      body,
      recipient: msgRecipient,
      workitemid,
      topicName,
      actionOwner,
      actionName,
      hivemind,
    });

    const endDate = new Date().getTime();
    Log.info(`done - create a new conversation: ${endDate - startDate}`);

    const messageToStore = {
      dateUpdated: response.dateUpdated,
      dateCreated: response.dateCreated,
      conversationSid: response.conversationSid,
      body: response.body,
      author: response.author,
      attributes: response.attributes,
      sid: response.sid,
    };

    const addedHivemindBlock = {
      ...data,
      hivemind: {
        user: data.hivemindUser,
      },
    };

    await dynamodbService.createConversation(conversationid, {
      ...addedHivemindBlock,
      body: JSON.stringify(messageToStore),
      messageId: response.sid,
    });
    return {
      messageId: response.sid,
      participants,
      conversationSid: response.conversationSid,
    };
  } catch (error) {
    Log.error(
      `[model] There was an error with 'createConversationAndSendMessage' ${error.message}`
    );
    throw error;
  }
}

// delete conversation
export async function deleteConversation(sid) {
  try {
    await twilioService.deleteConversation(sid);
    const result = await dynamodbService.deleteItem(sid);
    return result;
  } catch (error) {
    Log.error(
      `[model] There was an error with 'deleteConversation' ${error.message}`
    );
    throw error;
  }
}

// Store Messages to DB
export async function storeMessages(conversationid, creatorid, data) {
  const { channelId, body, msgRecipient, workitemid, twilioMessage } = data;
  try {
    let response;
    if (twilioMessage) {
      response = twilioMessage;
      if (twilioMessage.attributes.recipient) {
        const participants = [];
        twilioMessage.attributes.recipient.split(",").forEach((s) => {
          if (s) {
            participants.push({ Username: s });
          }
        });
        await twilioService.addParticipants(
          twilioMessage.conversationSid,
          participants
        );
      }
    } else {
      response = await twilioService.sendMessage({
        channelId,
        conversationid,
        author: creatorid,
        body,
        recipient: msgRecipient,
        workitemid,
      });
    }
    const messageToStore = {
      dateUpdated: response.dateUpdated,
      dateCreated: response.dateCreated,
      conversationSid: response.conversationSid,
      body: response.body,
      author: response.author,
      attributes: response.attributes,
      sid: response.sid,
    };

    return storeOneMessage(conversationid, messageToStore);
  } catch (error) {
    Log.error(
      `[model] There was an error with 'storeMessages' ${error.message}`
    );
    throw error;
  }
}

// Add participants to existing conversations
export async function addParticipantsToExistingConversation(data) {
  try {
    const conversationsList = await dynamodbService.getByListOfWorkitems(
      data.workitemidlist
    );
    if (conversationsList.length > 0) {
      await twilioService.addParticipantsToExistingConversation(
        conversationsList,
        data.useridlist
      );
    }
    return conversationsList;
  } catch (error) {
    Log.error(
      `[model] There was an error with 'addParticipantsToExistingConversation' ${error.message}`
    );
    throw error;
  }
}

// Get Converations By WorkItemIdList
export async function getConversationsByWorkitemIdList(workitemIds) {
  try {
    const conversations = await dynamodbService.getByListOfWorkitems(
      workitemIds
    );
    return conversations;
  } catch (error) {
    Log.error(
      `[model] There was an error with 'getConversationsByWorkitemIdList' ${error.message}`
    );
    throw error;
  }
}

// Get Workitem by ConversationId
export async function getWorkItemId(conversationid) {
  try {
    const conversation = await dynamodbService.getConversationBySid(
      conversationid
    );
    if (conversation) {
      // get the first one for now,x theoretically there should only be one anyway ...
      const message = conversation[0];
      return message.workitemId;
    }
  } catch (error) {
    Log.error(
      `[model] There was an error with 'getWorkItemId' ${error.message}`
    );
    throw error;
  }
}

export async function processConversationList(list) {
  try {
    await asyncBatch(
      list,
      createConversationAndSendMessage,
      TWILIO_PARALLELISM
    );
    return {};
  } catch (error) {
    Log.error(`[model] processConversationList' ${error.message}`);
    return {};
  }
}

export async function createChannel(data) {
  try {
    const channelId = await twilioService.createChannel({
      workItem: data.workItem,
    });
    if (data.participants) {
      await twilioService.addParticipants(channelId, data.participants);
    }
    return channelId;
  } catch (error) {
    Log.error(
      `[model] There was an error with 'createChannel' ${error.message}`
    );
    throw error;
  }
}

export async function getOrCreateChannelByWorkitemId(workitemid, data) {
  try {
    let channelId;
    const conversations = await dynamodbService.getByListOfWorkitems([
      workitemid,
    ]);
    if (
      conversations[0] &&
      conversations[0].providerMetadata &&
      conversations[0].providerMetadata.channelId
    ) {
      channelId = conversations[0].providerMetadata.channelId;
    } else {
      channelId = createChannel(data);
    }
    return channelId;
  } catch (error) {
    Log.error(
      `[model] There was an error with 'getOrCreateChannelByWorkitemId' ${error.message}`
    );
    throw error;
  }
}

export async function sendMessageFromChat(data) {
  const { conversationid, channelId, author, body, workitemid } = data;
  return storeMessages(conversationid, author, { body, channelId, workitemid });
}

export async function processAccContractNotifications(list) {
  const processOneAccContractNotification = async (notification) => {
    const {
      conversationId: conversationid,
      messageFromRule,
      workitemId: workitemid,
      hivemind,
    } = notification;
    const conversation = await dynamodbService.getConversationBySid(
      conversationid
    );
    const { channelId } = conversation[0].providerMetadata;
    const firstMessage = await twilioService.updateFirstMessage({
      channelId,
      conversationid,
      messageFromRule,
      hivemind,
      workitemid,
    });
    const response = await twilioService.sendMessage({
      channelId,
      author: firstMessage.author,
      body: `${messageFromRule} ${firstMessage.body}`,
      conversationid,
      workitemid,
    });

    const messageToStore = {
      dateUpdated: response.dateUpdated,
      dateCreated: response.dateCreated,
      conversationSid: conversationid,
      body: `${messageFromRule} ${firstMessage.body}`,
      author: response.author,
      attributes: response.attributes,
      sid: response.sid,
    };
    await dynamodbService.storeOneMessage(conversationid, messageToStore);
  };
  try {
    await asyncBatch(
      list,
      processOneAccContractNotification,
      TWILIO_PARALLELISM
    );
    return {};
  } catch (error) {
    Log.error(`[model] processAccContractNotifications' ${error.message}`);
    return {};
  }
}

export async function processWorkitemNumDaysBeforeDueNotifications(list) {
  // const processOneNotification = async (notification) => {};
  try {
    // await asyncBatch(list, processOneNotification, TWILIO_PARALLELISM);
    return { list };
  } catch (error) {
    Log.error(
      `[model] processWorkitemNumDaysBeforeDueNotifications' ${error.message}`
    );
    return {};
  }
}
