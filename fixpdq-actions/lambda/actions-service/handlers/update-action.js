import { models as fpdqModels } from "@fixpdq/common";

import { actionsModel } from "../../common/models";
import { STATUS as ACTION_STATE } from "../../common/models/actions-states";

const { ACTION: WORKITEM_ACTION } = fpdqModels.workitemsState;

// TODO: Implement proper state machine
const getClosedStatus = (actionType) => {
  let finalStatus;
  if (
    [
      WORKITEM_ACTION.APPROVE,
      WORKITEM_ACTION.COMPLETE_ACCOUNTABILITY_CONTRACT,
    ].includes(actionType)
  ) {
    finalStatus = ACTION_STATE.CLOSED_APPROVED;
  } else if (
    [
      WORKITEM_ACTION.REJECT,
      WORKITEM_ACTION.REJECT_ACCOUNTABILITY_CONTRACT,
    ].includes(actionType)
  ) {
    finalStatus = ACTION_STATE.CLOSED_REJECTED;
  } else {
    finalStatus = null;
  }

  return finalStatus;
};

export const updateAction = async (event) => {
  let actionid;
  if (event.payload.actionid) {
    actionid = event.payload.actionid;
  } else {
    const { workitemid, actionType } = event.payload;
    if (workitemid && actionType) {
      const action = await actionsModel.getActionsByWorkitemIdAndType({
        workitemid,
        actionType,
      });
      if (action) {
        actionid = action.actionid;
      }
    } else {
      throw new Error("Wrong payload parameters");
    }
  }
  return actionid
    ? await actionsModel.updateAction(actionid, {
        status: getClosedStatus(event.action),
      })
    : null;
};
