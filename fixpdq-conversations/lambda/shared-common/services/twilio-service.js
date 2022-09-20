import { services as fpdqServices } from "@fixpdq/common";
import { configUtil } from "../utilities";
import { TWILIO_PARALLELISM } from "../models/global-definitions";

const asyncBatch = require("async-batch").default;

const { winstonLogger: Log } = fpdqServices.loggerService;
const { twilioService } = fpdqServices;

const config = configUtil.getConfig();

export const twilioClient = twilioService.getClient({
  accountSid: config.TWILIO_ACCOUNT_SID,
  authToken: config.TWILIO_AUTH_TOKEN,
});

export const generateToken = (username) => {
  return twilioService.generateToken({
    username,
    accountSid: config.TWILIO_ACCOUNT_SID,
    apiKey: config.TWILIO_API_KEY,
    apiSecret: config.TWILIO_API_SECRET,
    serviceSid: config.TWILIO_SERVICE_SID,
  });
};

export async function createChannel(data) {
  try {
    const newConversation = await twilioClient.conversations
      .services(config.TWILIO_SERVICE_SID)
      .conversations.create({
        attributes: JSON.stringify(data),
      });
    return newConversation.sid;
  } catch (error) {
    Log.error(
      `[service] There was an error with ' createChannel' ${error.message}`
    );
    throw error;
  }
}

export async function addParticipants(channelId, participants) {
  try {
    const participantsList = [];
    if (participants && participants.length > 0) {
      const uniqueParticipants = participants
        .map((item) => item.Username)
        .filter((value, index, self) => self.indexOf(value) === index);
      if (uniqueParticipants.length) {
        const currentParticipants = await twilioClient.conversations
          .services(config.TWILIO_SERVICE_SID)
          .conversations(channelId)
          .participants.list();

        const addOneParticipant = async (person) => {
          if (
            currentParticipants &&
            !currentParticipants.find((p) => p.identity === person)
          ) {
            const newParticipant = await twilioClient.conversations
              .services(config.TWILIO_SERVICE_SID)
              .conversations(channelId)
              .participants.create({ identity: person });
            participantsList.push(newParticipant);
          }
        };
        await asyncBatch(
          uniqueParticipants,
          addOneParticipant,
          TWILIO_PARALLELISM
        );
      }
    }
    return participantsList;
  } catch (error) {
    Log.error(
      `[service] There was an error with 'addParticipants' ${error.message}`
    );
    throw error;
  }
}

export async function deleteConversation(sid) {
  try {
    const result = await twilioClient.conversations
      .services(config.TWILIO_SERVICE_SID)
      .conversations(sid)
      .remove();
    return result;
  } catch (error) {
    Log.error(
      `[service] There was an error with 'deleteConversation' ${error.message}`
    );
    throw error;
  }
}

export async function addParticipantsToExistingConversation(
  conversations,
  useridlist
) {
  const channelIds = [
    ...new Set(
      conversations.map(
        (conv) => conv.providerMetadata && conv.providerMetadata.channelId
      )
    ),
  ].filter((channel) => channel);
  const userid = useridlist[0];
  const addOneParticipant = async (channelId) => {
    try {
      const participants = await twilioClient.conversations
        .services(config.TWILIO_SERVICE_SID)
        .conversations(channelId)
        .participants.list();
      if (participants && !participants.find((p) => p.identity === userid)) {
        await twilioClient.conversations
          .services(config.TWILIO_SERVICE_SID)
          .conversations(channelId)
          .participants.create({ identity: userid });
      }
    } catch (error) {
      Log.error(
        `[addParticipantsToExistingConversation] There was an error with 'addParticipantsToExistingConversation' ${error.message} conversationid: ${channelId} user: ${userid}`
      );
      throw error;
    }
  };
  await asyncBatch(channelIds, addOneParticipant, TWILIO_PARALLELISM);
}

export async function sendMessage({
  channelId,
  conversationid,
  author,
  body,
  recipient,
  workitemid,
  topicName,
  actionOwner,
  actionName,
  hivemind,
}) {
  try {
    const message = await twilioClient.conversations
      .services(config.TWILIO_SERVICE_SID)
      .conversations(channelId)
      .messages.create({
        author,
        body,
        attributes: JSON.stringify({
          recipient,
          conversationid,
          workitemid,
          topicName,
          actionOwner,
          actionName,
          hivemind,
        }),
      });

    if (recipient) {
      const participants = [];
      recipient.split(",").forEach((s) => {
        if (s) {
          participants.push({ Username: s });
        }
      });
      await addParticipants(channelId, participants);
    }
    return message;
  } catch (error) {
    Log.error(
      `[service] There was an error with 'sendMessage' ${error.message}`
    );
    throw error;
  }
}

export const getFirstMessage = async ({ channelId, conversationid }) => {
  try {
    const messages = await twilioClient.conversations
      .services(config.TWILIO_SERVICE_SID)
      .conversations(channelId)
      .messages.list();
    const messagesFromConversation = messages.filter(
      (message) =>
        JSON.parse(message.attributes).conversationid === conversationid
    );
    const firstMessage = messagesFromConversation.sort(
      (a, b) => a.index > b.index
    )[0];

    return firstMessage || null;
  } catch (error) {
    Log.error(`[twilio service] getFirstMessage ${JSON.stringify(error)}`);
    return null;
  }
};

export const updateMessageAttributes = async ({
  channelId,
  messageId,
  updatedAttributes,
}) => {
  try {
    await twilioClient.conversations
      .services(process.env.TWILIO_SERVICE_SID)
      .conversations(channelId)
      .messages(messageId)
      .update({
        attributes: JSON.stringify(updatedAttributes),
      });
  } catch (error) {
    Log.error(`[twilio service] updateMessageAttributes ${error}`);
  }
};

export const updateFirstMessage = async ({
  conversationid,
  channelId,
  hivemind,
  workitemid,
}) => {
  try {
    // update attributes of the first message.
    const firstMessage = await getFirstMessage({ channelId, conversationid });
    const attributes = JSON.parse(firstMessage.attributes);
    await updateMessageAttributes({
      channelId,
      messageId: firstMessage.sid,
      updatedAttributes: { ...attributes, hivemind, workitemid },
    });
    // add a new message

    return firstMessage;
  } catch (error) {
    Log.error(`[twilio service] ${JSON.stringify(error)}`);
  }
};
