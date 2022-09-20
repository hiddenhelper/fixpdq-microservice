import { CognitoIdentityServiceProvider } from "aws-sdk";
import { services as fpdqServices } from "@fixpdq/common";

const { winstonLogger: Log } = fpdqServices.loggerService;

const cognitoIdentityServiceProvider = new CognitoIdentityServiceProvider({
  apiVersion: "2016-04-18",
  region: "ap-southeast-2",
});


// eslint-disable-next-line import/prefer-default-export
export async function getUser(parameter) {
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
    Log.error(`[service] There was an error with 'getUser' ${error.message}`);
    throw error;
  }
}

// eslint-disable-next-line import/prefer-default-export
export async function getAllUsers() {
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
      `[service] There was an error with 'getAllUsers' ${error.message}`
    );
    throw error;
  }
}

export async function updateUser(parameter, data, avatarURL) {

  const attributes = avatarURL ? 
    [
      {
        Name: "nickname",
        Value: `${data.nickname}`
      },
      {
        Name: "given_name",
        Value: `${data.firstname}`
      },
      {
        Name: "family_name",
        Value: `${data.lastname}`
      },
      {
        Name: "address",
        Value: `${data.address}`
      },
      {
        Name: "picture",
        Value: `${avatarURL}`
      },
    ] :
    [
      {
        Name: "nickname",
        Value: `${data.nickname}`
      },
      {
        Name: "given_name",
        Value: `${data.firstname}`
      },
      {
        Name: "family_name",
        Value: `${data.lastname}`
      },
      {
        Name: "address",
        Value: `${data.address}`
      },
    ]
  const params = {
    UserPoolId: process.env.COGNITO_USERPOOL_ID,
    Username: parameter,
    UserAttributes: attributes
  };

  const params_filter = {
    UserPoolId: process.env.COGNITO_USERPOOL_ID,
    AttributesToGet: null,
    Filter: `username = "${parameter}"`,
  };

  try {
    await cognitoIdentityServiceProvider
      .adminUpdateUserAttributes(params)
      .promise();
    
    const item = await cognitoIdentityServiceProvider
      .listUsers(params_filter)
      .promise();

    return item.Users[0];
  } catch (error) {
    Log.error(`[service] There was an error with 'updateUser' ${error.message}`);
    throw error;
  }
}