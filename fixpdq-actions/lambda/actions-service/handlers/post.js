import { actionsModel } from "../../common/models";

export const post = async (event) => {
  let result;
  if (event.resource === "/actions/workitems") {
    const workitems = JSON.parse(event.body);
    if (workitems) {
      const items = await actionsModel.getByListOfWorkiems(workitems);
      result = { items };
    }
  }
  return result;
};
