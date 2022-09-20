import { STATUS } from "../../shared-common/services/state-definitions";
import { onRemindWorkitemHasStatus } from "./shared/workitems-has-status";

export const onRemindWorkitemHasStatusOnHold = async (event) => {
  try {
    await onRemindWorkitemHasStatus(STATUS.ON_HOLD);
  } catch (err) {
    throw `Error in onRemindWorkitemHasStatusOnHold: ${err}`;
  }
};
