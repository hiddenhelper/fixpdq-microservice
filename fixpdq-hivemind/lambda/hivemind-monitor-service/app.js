/* eslint-disable no-await-in-loop */
import { services as fpdqServices } from "@fixpdq/common";
import { configUtil } from "../shared-common/utilities";

import { processRules } from "./rules-runner";

const aws = require("aws-sdk");

const config = configUtil.getConfig();

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

    Log.info(`
      All Rules: ${JSON.stringify(config.rules)}`);

    Log.info(event);
    Log.debug("[main] Initialising correlation IDs");

    await processRules(event);
  } catch (error) {
    Log.error(`[main] An error encountered ${JSON.stringify(error)}`);
  } finally {
    Log.info("[main] done hivemind-monitor-service api");
  }
}
