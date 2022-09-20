import { STATUS } from "../../shared-common/services/state-definitions";

export const remindWorkitemUnassigned = () => {
  return {
    conditions: {
      all: [
        {
          fact: "ownerid",
          operator: "equal",
          value: undefined,
        },
        {
          fact: "status",
          operator: "notEqual",
          value: STATUS.DELETED,
        },
        {
          fact: "status",
          operator: "notEqual",
          value: STATUS.DONE,
        },
      ],
    },
    event: {
      type: "remind-workitem-unassigned",
    },
  };
};
