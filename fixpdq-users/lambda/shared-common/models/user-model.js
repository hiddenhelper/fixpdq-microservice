import { services as fpdqServices } from "@fixpdq/common";

import { dynamodbService, cognitoService, s3Service } from "../services";

const { winstonLogger: Log } = fpdqServices.loggerService;

// // eslint-disable-next-line consistent-return
// export async function getUser(parameter) {
//   try {
//     const result = await dynamodbService.getUser();
//     return result;
//   } catch (error) {
//     Log.error(`[model] There was an error with 'getUser' ${error.message}`);
//   }
// }

// eslint-disable-next-line no-unused-vars
export async function getUser(parameter) {
  try {
    const result = await cognitoService.getUser(parameter);
    return result;
  } catch (error) {
    Log.error(`[model] There was an error with 'getUser' ${error.message}`);
  }
}

// eslint-disable-next-line consistent-return
export async function getAllUsers() {
  try {
    const result = await cognitoService.getAllUsers();
    return result;
  } catch (error) {
    Log.error(`[model] There was an error with 'getAllUsers' ${error.message}`);
  }
}

// eslint-disable-next-line no-unused-vars
export async function updateUser(parameter, data) {
  try {
    const avatarURL = data.avatar ? await s3Service.getImageUrl( parameter, data.avatar): null;
    const result = await cognitoService.updateUser(parameter, data, avatarURL);
    return result;
  } catch (error) {
    Log.error(`[model] There was an error with 'updateUser' ${error.message}`);
  }
}
