const dynamodbService = require("./dynamodb-service");
const cognitoService = require("./cognito-service");
const s3Service = require("./s3-service");

module.exports = {
  dynamodbService,
  cognitoService,
  s3Service,
};
