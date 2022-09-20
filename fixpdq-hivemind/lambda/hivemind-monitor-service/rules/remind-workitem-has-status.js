const transformStatus = (status) => {
  return status.toLowerCase().replace(new RegExp(/\_/g), "-");
};
export const workitemHasStatus = (status) => {
  return {
    conditions: {
      all: [
        {
          fact: "status",
          operator: "equal",
          value: status,
        },
      ],
    },
    event: {
      type: `remind-workitem-has-status-${transformStatus(status)}`,
      params: {
        message: `WORK ITEM(S) has status ${status}`,
      },
    },
  };
};
