import { configUtil } from "../../shared-common/utilities";

const config = configUtil.getConfig();

export const workitemNumDaysBeforeDue = (timerTimestamp) => {
  return {
    conditions: {
      all: [
        {
          fact: "end_time",
          operator: "lessThanInclusive",
          value:
            timerTimestamp +
            config.rules.WORKITEM_NUM_DAYS_BEFORE_DUE * 1000 * 60 * 60 * 24,
        },
      ],
    },
    event: {
      type: "workitem-close-to-due-date",
      params: {
        topic: "Progress?",
        text: "Will this item be completed before due date?",
      },
    },
  };
};
