import { services as fpdqServices } from "@fixpdq/common";

import dialogflow from "@google-cloud/dialogflow";

import { ACTION } from "../shared-common/services/state-definitions";
import { twilioService } from "../shared-common/services";
import handlers from "./handlers";

// const aws = require("aws-sdk");

const allowReply = async ({ conversationId, sender }) => {
  const { actionOwner, actionName } = await twilioService.getActionAttributes(
    conversationId
  );
  if (actionName === ACTION.HOUSEKEEPING) {
    return false;
  } else {
    return actionOwner && sender === actionOwner;
  }
};

const { cloudWatchLogger, winstonLogger: Log } = fpdqServices.loggerService;
let response;
/**
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Context doc: https://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-context.html
 * @param {Object} context
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 *
 */
export async function handler(event, context) {
  let result;
  try {
    cloudWatchLogger.initialiseCorrelationIds(event, context);

    Log.info(event);
    Log.debug("[main] Initialising correlation IDs");

    if (event.action) {
      // TheCoach receives events from TheMonitor
      const actionResult = await handlers.action(event);
      //TODO: to move into handler
      const { workItemId } = event;
      const { conversationSid } = actionResult;

      const hivemindUser = process.env.HIVEMIND_USER_ID;
      const googleProjectName = process.env.GOOGLE_PROJECT_NAME;
      const environment = process.env.ENVIRONMENT;
      const sessionClient = new dialogflow.SessionsClient();

      const sessionPath = sessionClient.projectAgentEnvironmentUserSessionPath(
        googleProjectName,
        environment,
        hivemindUser,
        conversationSid
      );

      const request = {
        session: sessionPath,
        analyzeQueryTextSentiment: true,
        queryInput: {
          event: {
            name: event.action,
            languageCode: 'en-US'
          },
        },
      };

      const conversationId = conversationSid;
      const dialogFlowResponse = await sessionClient.detectIntent(request);
      Log.info(dialogFlowResponse);
      if (dialogFlowResponse) {
        const dialogFlowResult = dialogFlowResponse[0].queryResult;
        const messageToSend = dialogFlowResult.fulfillmentText;
        await twilioService.sendMessage({
          conversationId,
          author: hivemindUser,
          body: messageToSend,
        });
        Log.info(dialogFlowResult);
      }

      response = {
        statusCode: 200,
        body: JSON.stringify({
          actionResult,
        }),
      };
      return response;
    } else {
      // TheCoach processes what comes from the chat window
      const message = event.inputText;
      const userId = event.author;
      const conversationId = event.conversationSid;
      const { workItemId } = event;
      const hivemindUser = process.env.HIVEMIND_USER_ID;
      const googleProjectName = process.env.GOOGLE_PROJECT_NAME;
      const environment = process.env.ENVIRONMENT;

      const isAllowReply = await allowReply({ conversationId, sender: userId });
      if (isAllowReply) {
        const sessionClient = new dialogflow.SessionsClient();
        const sessionPath = sessionClient.projectAgentEnvironmentUserSessionPath(
          googleProjectName,
          environment,
          hivemindUser,
          conversationId
        );
        const request = {
          session: sessionPath,
          analyzeQueryTextSentiment: true,
          queryInput: {
            text: {
              text: message,
              languageCode: "en-US",
            },
          },
          queryParams: {
            webhookHeaders: {
              workItemId,
              conversationId,
              userId,
            },
          },
        };

        const dialogFlowResponse = await sessionClient.detectIntent(request);
        Log.info(dialogFlowResponse);
        if (dialogFlowResponse) {
          // if (dialogFlowResponse.intentDetectionConfidence > .8) {
          const dialogFlowResult = dialogFlowResponse[0].queryResult;
          if (dialogFlowResult.intent) {
            const messageToSend = dialogFlowResult.fulfillmentText;
            await twilioService.sendMessage({
              conversationId,
              author: hivemindUser,
              body: messageToSend,
            });
          } else {
            console.log("no intent detected.");
          }
          // }
        }
      }
    }
  } catch (error) {
    Log.error(`[main] An error encountered ${error.message}`);
  } finally {
    Log.info("[main] done hivemind-service api");
  }
}
