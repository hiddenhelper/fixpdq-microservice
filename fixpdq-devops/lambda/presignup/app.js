import { services as fpdqServices } from '@fixpdq/common';
import { CognitoIdentityServiceProvider } from "aws-sdk";

const AWS = require('aws-sdk')
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
  let responseValue = null;

  try {
    cloudWatchLogger.initialiseCorrelationIds(event, context);
    Log.info(event);

    const cognitoIdentityServiceProvider = new CognitoIdentityServiceProvider({
      apiVersion: "2016-04-18",
      region: "ap-southeast-2",
    });

    const params = {
      UserPoolId: `${event.userPoolId}`,
      AttributesToGet: null,
      Filter: `email = "${event.request.userAttributes.email}"`,
    };

    const item = await cognitoIdentityServiceProvider
      .listUsers(params)
      .promise();

    if (item.Users.length > 0) {
      throw new Error('The username/email has already been taken.');
      return event
      context.done();
    }

    responseValue = {
      "autoConfirmUser": false,
      "autoVerifyPhone": false,
      "autoVerifyEmail": false
    };

    return {
      ...event,
      response: responseValue
    };

  } catch (error) {
    throw new Error(error);
    Log.error(`[user] An error encountered ${error.message}.`);
  } finally {
    Log.info('[user] PreSignup done.');
  }
}
