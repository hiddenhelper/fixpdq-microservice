export function getConfig() {
  return {
    env: process.env['ENVIRONMENT'],
    dynamodb: {
      tableName: process.env['ACTIONS_DB_DYNAMODB']
    },
    log: {
      level: process.env['ACTIONS_LOGGING_LEVEL'],
      driver: process.env['ACTIONS_LOGGING_DRIVER']
    },
  };
}
