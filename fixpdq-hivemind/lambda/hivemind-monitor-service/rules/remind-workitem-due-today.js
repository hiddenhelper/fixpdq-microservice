import { getStartOfDay } from "../runners/shared/get-start-of-day";

export const remindWorkitemDueToday = (time) => {
  return {
    conditions: {
      all: [
        {
          fact: "end_time",
          operator: "greaterThanInclusive",
          value: getStartOfDay(time),
        },
        {
          fact: "end_time",
          operator: "lessThan",
          value: getStartOfDay(time) + 1000 * 60 * 60 * 24,
        },
      ],
    },
    event: {
      type: "remind-workitem-due-today",
    },
  };
};
