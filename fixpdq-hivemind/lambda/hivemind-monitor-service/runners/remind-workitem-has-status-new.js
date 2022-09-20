import { STATUS } from "../../shared-common/services/state-definitions";
import { onRemindWorkitemHasStatus } from "./shared/workitems-has-status";

export const onRemindWorkitemHasStatusNew = async (event) => {
  try {
    await onRemindWorkitemHasStatus(STATUS.NEW);
  } catch (err) {
    throw `Error in onRemindWorkitemHasStatusNew: ${err}`;
  }
};
