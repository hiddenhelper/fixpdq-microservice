import { actionsModel } from "../../common/models";

export const get = async (event) => {
  let result;
  if (event.pathParameters) {
    const { actionid } = event.pathParameters;
    result = { message: "It's working", actionid };
  } else {
    const { workitemid } = event.queryStringParameters;
    if (workitemid) {
      const items = await actionsModel.getActionsByWorkitemId(workitemid);
      result = { items };
    } else {
      const { actionType, activeFor, timeStamp } = event.queryStringParameters;
      const items = await actionsModel.getActionsByTypeAndOwnerAndTimestamp({actionType, activeFor, timeStamp});
      result = { items };
    }
  }
  return result;
};
