import { ACTION } from "../../shared-common/services/state-definitions";
import { configUtil } from "../../shared-common/utilities";

const config = configUtil.getConfig();

export const accContractNumDaysOpen = (timerTimestamp) => {
  return {
    conditions: {
      all: [
        {
          fact: "date_created",
          operator: "lessThanInclusive",
          value:
            timerTimestamp -
            config.rules.ACC_CONTRACT_NUM_DAYS_OPEN * 1000 * 60 * 60 * 24,
        },
        {
          fact: "status",
          operator: "equal",
          value: "OPEN",
        },
        {
          fact: "actionType",
          operator: "equal",
          value: ACTION.ASSIGN,
        },
      ],
    },
    event: {
      type: "accountability-contract-not-accepted",
      params: {
        message:
          "Please answer the questions to accept accountability contract",
      },
    },
  };
};
