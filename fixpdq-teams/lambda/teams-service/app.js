import { services as fpdqServices } from "@fixpdq/common";

import { teamModel } from "../shared-common/models";

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
//    Log.debug(event);

    cloudWatchLogger.initialiseCorrelationIds(event, context);
 //   Log.debug("[main] Initialising correlation IDs");

    // TODO: express implementation later on, for now thru conditions
    if (event.resource === "/teams" && event.httpMethod === "GET") {
      const result = await teamModel.getAllTeams();
      response = {
        statusCode: 200,
        headers: corsHeader,
        body: JSON.stringify(result),
      };
    }
    if (event.resource === "/teams/{teamid}" && event.httpMethod === "GET") {
      const parameter = event.pathParameters.teamid;
      const result = await teamModel.getTeam(parameter);
      response = {
        statusCode: 200,
        headers: corsHeader,
        body: JSON.stringify(result),
      };
    }
    if (event.resource === "/teams" && event.httpMethod === "POST") {
      const result = await teamModel.createTeam( JSON.parse(event.body) );
      response = {
        statusCode: 200,
        headers: corsHeader,
        body: JSON.stringify(result),
      };
    }
    if (event.resource === "/teams/{teamid}" && event.httpMethod === "PUT") {

      // response = {
      //   statusCode: 200,
      //   headers: corsHeader,
      //   body: JSON.stringify({
      //     statusCode: 200,
      //     message: "updated - TBD",
      //   }),
      // };
    }
  } catch (error) {
    Log.error(`[main] An error encountered ${error.message}`);
  } finally {
    Log.info("[main] done team-service api");

    // TODO: move to main section above
    // eslint-disable-next-line no-unsafe-finally
    return response;
  }
}
