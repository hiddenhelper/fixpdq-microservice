export function getConfig() {
  return {
    env: process.env['ENVIRONMENT'],
    dynamodb: {
      tableName: process.env['DYNAMODB_TABLE_NAME']
    },
    log: {
      level: process.env['LOGGING_LEVEL'],
      driver: process.env['LOGGING_DRIVER']
    },
  };
}
