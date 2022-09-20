import { services as fpdqServices } from "@fixpdq/common";

import { userModel } from "../shared-common/models";

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
  const corsHeader = {
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
  };

  try {
    Log.debug(event);

    cloudWatchLogger.initialiseCorrelationIds(event, context);
    Log.debug("[main] Initialising correlation IDs");

    // TODO: express implementation later on, for now thru conditions
    if (event.resource === "/users") {
      const result = await userModel.getAllUsers();
      response = {
        statusCode: 200,
        headers: corsHeader,
        body: JSON.stringify(result),
      };
    }
    if (event.resource === "/users/{user}" && event.httpMethod === "GET") {
      const parameter = event.pathParameters.user;
      const result = await userModel.getUser(parameter);
      response = {
        statusCode: 200,
        headers: corsHeader,
        body: JSON.stringify(result),
      };
    }
    if (event.resource === "/users/{user}" && event.httpMethod === "POST") {
      const parameter = event.pathParameters.user;
      const result = await userModel.updateUser( parameter, JSON.parse(event.body) );
      response = {
        statusCode: 200,
        headers: corsHeader,
        body: JSON.stringify(result),
      };
    }
  } catch (error) {
    Log.error(`[main] An error encountered ${error.message}`);
  } finally {
    Log.info("[main] done user-service api");

    // TODO: move to main section above
    // eslint-disable-next-line no-unsafe-finally
    return response;
  }
}
