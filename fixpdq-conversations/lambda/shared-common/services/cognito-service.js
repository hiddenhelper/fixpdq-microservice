import { CognitoIdentityServiceProvider } from "aws-sdk";
import { services as fpdqServices } from "@fixpdq/common";
import { sync } from "rimraf";

const { winstonLogger: Log } = fpdqServices.loggerService;

const cognitoIdentityServiceProvider = new CognitoIdentityServiceProvider({
  apiVersion: "2016-04-18",
  region: "ap-southeast-2",
});

export async function getUserByUsername(userName) {
  const params = {
    UserPoolId: process.env.COGNITO_USERPOOL_ID,
    AttributesToGet: null,
    Filter: `username = "${userName}"`,
  };

  try {
    const item = await cognitoIdentityServiceProvider
      .listUsers(params)
      .promise();
    return item.Users[0];
  } catch (error) {
    Log.error(
      `[service] There was an error with 'getUserByUsername' ${error.message}`
    );
    throw error;
  }
}
