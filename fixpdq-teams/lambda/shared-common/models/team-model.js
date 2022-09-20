import { services as fpdqServices } from "@fixpdq/common";

import { dynamodbService, cognitoService } from "../services";

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
export async function getTeam(parameter) {
  try {
    const result = await cognitoService.getTeam(parameter);
    return result;
  } catch (error) {
    Log.error(`[model] There was an error with 'getTeam' ${error.message}`);
  }
}

// eslint-disable-next-line consistent-return
export async function getAllTeams() {
  try {
    const result = await cognitoService.getAllTeams();
    return result;
  } catch (error) {
    Log.error(`[model] There was an error with 'getAllTeams' ${error.message}`);
  }
}

//
export async function createTeam( data ) {
  try {
    // const adminGroup = await cognitoService.createGroup( data.team_name, "admin");
    // const membersGroup = await cognitoService.createGroup( data.team_name, "members");
    // const invitedGroup = await cognitoService.createGroup( data.team_name, "invited");

    // return await dynamodbService.createTeamTable( data, adminGroup, membersGroup, invitedGroup );
    return await dynamodbService.createTeamTable();
  } catch (error) {
    Log.error(`[model] There was an error with 'getAllTeams' ${error.message}`);
  }
}
