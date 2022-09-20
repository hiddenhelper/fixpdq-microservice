import { services as fpdqServices } from '@fixpdq/common';
const AWS = require("aws-sdk");
const util = require('util');
const client = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

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

  let createdUser = null;

  try {
    cloudWatchLogger.initialiseCorrelationIds(event, context);
    Log.debug('[users] Initialising correlation IDs');

    Log.info(event);

    const documentClient = new AWS.DynamoDB.DocumentClient({apiVersion: '2012-08-10'});
    documentClient.putPromise = util.promisify(documentClient.put);

    var params = {
      TableName: "users",
      Item: {
        "userid": `${event.userName}`,
        "userPoolId": `${event.userPoolId}`,
      }
    };

    const createdUser = await documentClient.putPromise(params);
    Log.info("user inserted in Lambda", createdUser);

    // create a twilio user
    const createdTwilioUser = await client.conversations.services(process.env.TWILIO_SERVICE_SID).users.create({identity: event.userName});
    Log.info(`New Twilio User`, createdTwilioUser.sid);

  } catch (error) {
    Log.error(`[user] An error encountered ${error.message}`);
  } finally {
    Log.info('[user] PostConfirmation done.');

    return {...event, response: createdUser}
  }
}
