import { CognitoIdentityServiceProvider } from "aws-sdk";
import { services as fpdqServices } from "@fixpdq/common";
import { sync } from "rimraf";

const { winstonLogger: Log } = fpdqServices.loggerService;


// eslint-disable-next-line import/prefer-default-export
export async function getTeam(parameter) {
  const cognitoIdentityServiceProvider = new CognitoIdentityServiceProvider({
    apiVersion: "2016-04-18",
    region: "ap-southeast-2",
  });

  const params = {
    UserPoolId: process.env.COGNITO_USERPOOL_ID,
    AttributesToGet: null,
    Filter: `email = "${parameter}"`,
  };

  try {
    const item = await cognitoIdentityServiceProvider
      .listUsers(params)
      .promise();
    return item;
  } catch (error) {
    Log.error(`[service] There was an error with 'getTeam' ${error.message}`);
    throw error;
  }
}

// eslint-disable-next-line import/prefer-default-export
export async function getAllTeams() {
  const cognitoIdentityServiceProvider = new CognitoIdentityServiceProvider({
    apiVersion: "2016-04-18",
    region: "ap-southeast-2",
  });

  // TODO: 1. specify specific attributes
  // TODO: 2. make userpoolid a env variable
  // TODO: 3. Use Limit and Pagination
  const params = {
    UserPoolId: process.env.COGNITO_USERPOOL_ID,
    AttributesToGet: null,
    // Limit: 5,
    // PaginationToken: null,
  };
  // AttributesToGet: [
  //   "email",
  //   "username",
  //   "phone_number",
  //   "name",
  //   "given_name",
  //   "family_name",
  //   "preferred_username",
  //   "cognito:user_status",
  //   "status",
  //   "sub",
  // ],

  try {
    const items = await cognitoIdentityServiceProvider
      .listUsers(params)
      .promise();
    return items;

    // TODO: for item #3 above
    // let items;
    // const scanResults = [];
    // do {
    //   // eslint-disable-next-line no-await-in-loop
    //   items = await cognitoIdentityServiceProvider.listUsers(params).promise();
    //   console.log(items);
    //   items.Users.forEach((item) => scanResults.push(item));
    //   params.PaginationToken = items.PaginationToken;
    // } while (typeof items.PaginationToken !== "undefined");
    // return scanResults;
  } catch (error) {
    Log.error(
      `[service] There was an error with 'getAllTeams' ${error.message}`
    );
    throw error;
  }
}

export async function createGroup(teamName, groupType ) {
  const cognitoIdentityServiceProvider = new CognitoIdentityServiceProvider({
    apiVersion: "2016-04-18",
    region: "ap-southeast-2",
  });

  const params = {
    UserPoolId: process.env.COGNITO_USERPOOL_ID,
    GroupName: teamName + "." + groupType,
  };

  try {
    const res = await cognitoIdentityServiceProvider.createGroup( params ).promise();
    Log.debug(res);
    return res;
  } catch (error) {
    Log.error(`[service] There was an error with 'createGroup' ${error.message}`);
    throw error;
  }
}
