#!/usr/bin/env node

const cdk = require('@aws-cdk/core');
const { LambdaStack } = require('../lib/lambda-stack');

const config = require('../config.json');

const app = new cdk.App();
new LambdaStack(app, `fixpdq-workitems-${config.ENVIRONMENT}`, {
  config,
  env: {
    region: config.AWS_REGION,
    account: config.AWS_ACCOUNT
  },
});
