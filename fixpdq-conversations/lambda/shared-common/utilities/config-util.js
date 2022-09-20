export function getConfig() {
  return {
    env: process.env["ENVIRONMENT"],
    TWILIO_ACCOUNT_SID: process.env["TWILIO_ACCOUNT_SID"],
    TWILIO_AUTH_TOKEN: process.env["TWILIO_AUTH_TOKEN"],
    TWILIO_API_KEY: process.env["TWILIO_API_KEY"],
    TWILIO_API_SECRET: process.env["TWILIO_API_SECRET"],
    TWILIO_SERVICE_SID: process.env["TWILIO_SERVICE_SID"],
    dynamodb: {
      tableName: process.env["CONVERSATIONS_DB_DYNAMODB"],
    },
    log: {
      level: process.env["LOGGING_LEVEL"],
      driver: process.env["LOGGING_DRIVER"],
    },
  };
}
