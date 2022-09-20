/* eslint-disable indent */
import { services as fpdqServices } from "@fixpdq/common";
import { twilioClient } from "../shared-common/services/twilio-service";
import { handleFulfilmentAction } from "./fulfilment-action";

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
  // TODO: fine tune this
  const corsHeader = {
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
  };

  try {
    cloudWatchLogger.initialiseCorrelationIds(event, context);

    Log.info(event);
    Log.debug("[main] Initialising correlation IDs");

    const messageBody = event.body;
    if (messageBody) {
      const dialogFlowPayload = JSON.parse(messageBody);
      const actionToPerform = dialogFlowPayload.queryResult.action;

      const conversationId = event.headers.conversationid;
      const userId = event.headers.userid;
      const workItemId = event.headers.workitemid;

      const fulfilmentActionPayload = {
        client: twilioClient,
        workItemId,
        conversationId,
        userId,
        Log,
      };
      if (actionToPerform) {
        await handleFulfilmentAction({
          name: actionToPerform,
          payload: fulfilmentActionPayload,
        });
      }
    }
  } catch (error) {
    Log.error(`[main] An error encountered ${error.message}`);
  } finally {
    Log.info("[main] done hivemindfulfilment-service api");

    Log.info(response);
    return response;
  }
}
