import { services as fpdqServices } from "@fixpdq/common";
import { configUtil, lambdaUtil } from "../utilities";
import { ACTION } from "./state-definitions";

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

export const notifyAccContractOpen = async ({
  conversationId,
  messageFromRule,
}) => {
  try {
    let firstMessage;
    await twilioClient.conversations
      .services(config.TWILIO_SERVICE_SID)
      .conversations(conversationId)
      .messages.list({ limit: 1 })
      .then((messages) => {
        firstMessage = messages.find((m) => m.index === 0);
      });
    await twilioClient.conversations
      .services(config.TWILIO_SERVICE_SID)
      .conversations(conversationId)
      .messages.create({
        author: config.HIVEMIND_USER_ID,
        body: messageFromRule,
      });
    if (firstMessage) {
      await twilioClient.conversations
        .services(config.TWILIO_SERVICE_SID)
        .conversations(conversationId)
        .messages.create({
          author: firstMessage.author,
          body: firstMessage.body,
        });
    }
  } catch (error) {
    Log.error(`[twilio service] ${JSON.stringify(error)}`);
  }
};

export const notifyWorkitemBeforeDueDate = async ({
  workitemid,
  ownerid,
  creatorid,
  topic,
  text,
}) => {
  const hivemindUser = config.HIVEMIND_USER_ID;
  const participants = [ownerid || creatorid, hivemindUser].map((user) => {
    return { Username: user };
  });
  await lambdaUtil.invokeLambda(
    lambdaUtil.HIVEMIND_LAMBDA,
    ACTION.HOUSEKEEPING,
    {
      actionName: ACTION.HOUSEKEEPING,
      topicName: topic,
      workItem: workitemid,
      message: text,
      messageOwner: hivemindUser,
      actionOwner: ownerid,
      participants,
    }
  );
};

export const getActionOwner = async (conversationId) => {
  let actionOwner;
  await twilioClient.conversations
    .services(config.TWILIO_SERVICE_SID)
    .conversations(conversationId)
    .fetch()
    .then((conversation) => {
      actionOwner = JSON.parse(conversation.attributes).actionOwner;
    });
  return actionOwner;
};

export const getActionType = async (conversationId) => {
  let actionType;
  await twilioClient.conversations
    .services(config.TWILIO_SERVICE_SID)
    .conversations(conversationId)
    .fetch()
    .then((conversation) => {
      actionType = JSON.parse(conversation.attributes).actionName;
    });
  return actionType;
};

export const sendMessage = async ({ conversationId, author, body }) => {
  await twilioClient.conversations
    .services(config.TWILIO_SERVICE_SID)
    .conversations(conversationId)
    .messages.create({ author, body })
    .then((msg) => {
      Log.info(msg.sid);
    });
};

export const getActionAttributes = async (conversationId) => {
  let actionAttrubutes;
  await twilioClient.conversations
    .services(config.TWILIO_SERVICE_SID)
    .conversations(conversationId)
    .fetch()
    .then((conversation) => {
      actionAttrubutes = JSON.parse(conversation.attributes);
    });
  return actionAttrubutes;
};
