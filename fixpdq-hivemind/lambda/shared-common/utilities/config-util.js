export function getConfig() {
  return {
    env: process.env["ENVIRONMENT"],
    TWILIO_ACCOUNT_SID: process.env["TWILIO_ACCOUNT_SID"],
    TWILIO_AUTH_TOKEN: process.env["TWILIO_AUTH_TOKEN"],
    TWILIO_API_KEY: process.env["TWILIO_API_KEY"],
    TWILIO_API_SECRET: process.env["TWILIO_API_SECRET"],
    TWILIO_SERVICE_SID: process.env["TWILIO_SERVICE_SID"],
    HIVEMIND_USER_ID: process.env["HIVEMIND_USER_ID"],
    dynamodb: {
      tableName: process.env["HIVEMIND_DB_DYNAMODB"],
    },
    log: {
      level: process.env["HIVEMIND_LOGGING_LEVEL"],
      driver: process.env["HIVEMIND_LOGGING_DRIVER"],
    },
    RULES_RUNNER_PARALLELISM: process.env["RULES_RUNNER_PARALLELISM"],
    RULE_PARALLELISM: process.env["RULE_PARALLELISM"],
    rules: {
      ACC_CONTRACT_NUM_DAYS_OPEN: process.env["ACC_CONTRACT_NUM_DAYS_OPEN"],
      WORKITEM_NUM_DAYS_BEFORE_DUE: process.env["WORKITEM_NUM_DAYS_BEFORE_DUE"],
      REMIND_WORKITEM_HAS_STATUS_NEW:
        process.env["REMIND_WORKITEM_HAS_STATUS_NEW"],
      REMIND_WORKITEM_HAS_STATUS_ON_HOLD:
        process.env["REMIND_WORKITEM_HAS_STATUS_ON_HOLD"],
      REMIND_WORKITEM_DUE_TODAY:
        process.env["REMIND_WORKITEM_DUE_TODAY"],
      REMIND_WORKITEM_UNASSIGNED:
        process.env["REMIND_WORKITEM_UNASSIGNED"],
    },
  };
}
