import { services as fpdqServices } from "@fixpdq/common";
var aws = require('aws-sdk');
const twilio = require("twilio");
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

  try {
    cloudWatchLogger.initialiseCorrelationIds(event, context);

    Log.info(event);
    Log.debug("[main] Initialising correlation IDs");

    const corsHeader = {
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
    };

    const environment = process.env.ENVIRONMENT;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const messageBody = event.body;

    const twilioSignature = event.headers['X-Twilio-Signature'];
    const url = `https://webhook.${environment}.fixpdq.app/hivemindconversation`;

    const requestIsValid = twilio.validateRequest(
      authToken,
      twilioSignature,
      url,
      messageBody
    );

    if (!requestIsValid) {
      Log.error(`request is invalid`);
    } else {
      //NOTE: do something with message
      // 1. retrieve message
      // 2. determine workitem id thru conversations lambda
    }

    response = {
      statusCode: 200,
      headers: corsHeader,
      body: ''
    };
    return response;

  } catch (error) {
    Log.error(`[main] An error encountered ${error.message}`);
  } finally {
    Log.info("[main] done hivemind-conversation-service api");
  }
}
