/* eslint-disable import/prefer-default-export */
import { services as fpdqServices } from "@fixpdq/common";
import jwt_decode from "jwt-decode";
import { conversationModel } from "../shared-common/models";
import { lambdaUtil } from "../shared-common/utilities";
import handlers from "./handlers";
import {
  HELPER_ACTION_NAME,
  HELPER_PREFIX,
  processFixHelper,
} from "./handlers/post/process-fix-helper";

let response;

const { cloudWatchLogger, winstonLogger: Log } = fpdqServices.loggerService;

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

  const corsHeader = {
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
  };

  console.log(JSON.stringify(event), JSON.stringify(context));

  try {
    Log.debug(event);

    cloudWatchLogger.initialiseCorrelationIds(event, context);
    Log.debug("[main] Initialising correlation IDs");

    if (event.action) {
      response = handlers.action(event);
    } else {
      const userToken = jwt_decode(
        event.headers.Authorization.split("Bearer ")[1].trim()
      );

      if (event.resource === "/conversations" && event.httpMethod === "GET") {
        if (!event.queryStringParameters) {
          result = await conversationModel.getTwilioToken(userToken.username);
        }
      }
      if (
        event.resource === "/conversations/workitems" &&
        event.httpMethod === "POST"
      ) {
        const workitems = JSON.parse(event.body);
        if (workitems) {
          result = await conversationModel.getConversationsByWorkitemIdList(
            workitems
          );
        }
      }
      if (
        event.resource === "/conversations/channel" &&
        event.httpMethod === "POST"
      ) {
        const data = JSON.parse(event.body);
        result = await conversationModel.createChannel(data);
      }
      if (event.resource === "/conversations" && event.httpMethod === "POST") {
        if (!event.queryStringParameters) {
          // TODO: put this in common
          const eventBody = JSON.parse(event.body);
          // TODO:  Just for this phase, I'll edit the actionName so that the conversation becomes 'repliable'
          // if the prefix is /fix
          Log.info(eventBody);
          if (
            eventBody.twilioMessage.body &&
            eventBody.twilioMessage.body.startsWith(HELPER_PREFIX)
          ) {
            eventBody.actionName = HELPER_ACTION_NAME;
            eventBody.hivemind = { allowHivemindProcessing: true };
          }

          result = await conversationModel.createConversationOnly(eventBody);

          if (process.env.ENABLE_HIVEMIND === "true") {
            await processFixHelper({ event, userName: userToken.username });
          }
        } else {
          result = await conversationModel.addParticipantsToExistingConversation(
            JSON.parse(event.body)
          );
        }
      }
      if (
        event.resource === "/conversations/{conversationid}" &&
        event.httpMethod === "DELETE"
      ) {
        const conversationSid = event.pathParameters.conversationid;
        result = await conversationModel.deleteConversation(conversationSid);
      }
      if (
        event.resource === "/conversations/{conversationid}" &&
        event.httpMethod === "POST"
      ) {
        const { conversationid } = event.pathParameters;
        const { workitemid } = JSON.parse(event.body);
        result = await conversationModel.storeMessages(
          conversationid,
          userToken.username,
          JSON.parse(event.body)
        );

        // TODO: Temporary way of calling HiveMind, thru lambda call.  This will be event-driven later on.
        // TODO: seems metadata does not contain the workitemid and author anymore
        if (process.env.ENABLE_HIVEMIND === "true") {
          await processFixHelper({ event, userName: userToken.username });
          const metadata = JSON.parse(event.body).twilioMessage;

          // Log.info(`metadata ${JSON.stringify(metadata)}`);
          const { Payload: lambdaCallResponse } = await lambdaUtil.invokeLambda(
            lambdaUtil.HIVEMIND_LAMBDA,
            {
              author: userToken.username,
              inputText: metadata.body,
              conversationid,
              workItemId: workitemid,
              channelId: metadata.conversationSid,
              messageId: metadata.sid,
            }
          );
        }
      }
      response = {
        statusCode: 200,
        headers: corsHeader,
        body: JSON.stringify(result),
      };
    }
  } catch (error) {
    Log.error(`[main] An error encountered ${error.message}`);

    response = {
      statusCode: 500,
      headers: corsHeader,
      body: JSON.stringify({
        errorCode: 500,
        message: error.message,
      }),
    };
  } finally {
    Log.info("[main] done conversation-service api");

    // TODO: move to main section above
    // eslint-disable-next-line no-unsafe-finally
    return response;
  }
}
