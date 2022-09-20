/* eslint-disable no-useless-catch */
import { dynamodbService } from '../services';

export async function getTeamsByCreatorId(creatorid) {

  try {
    const result = await dynamodbService.getBy([{ creatorid }]);

    return result;
  } catch (error) {
    console.log(`[getTeams] ${JSON.stringify(error)}`);
  }
}

export async function createTeam(creatorid, data) {
  try {
    const UNIX_TS = new Date().getTime();
    const date_created = UNIX_TS;
    const date_updated = UNIX_TS;

    return await dynamodbService.addItem({
      ...data,
      creatorid,
      date_created,
      date_updated,
    });
  } catch (error) {
    throw error;
  }
}

export async function updateTeam(teamid, data) {
  try {
    const UNIX_TS = new Date().getTime();
    const date_updated = UNIX_TS;

    return await dynamodbService.updateItem({ teamid }, [
      {
        ...data,
        date_updated,
      },
    ]);
  } catch (error) {
    throw error;
  }
}
