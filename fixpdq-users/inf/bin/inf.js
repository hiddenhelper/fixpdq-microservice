#!/usr/bin/env node

const cdk = require('@aws-cdk/core');
const config = require('../config.json');
const { UserInfStack } = require('../lib/inf-stack');
const prefix = 'fixpdq';

const app = new cdk.App();

new UserInfStack(app, `${prefix}-users-stk`, {
  env: {
    region: config.AWS_REGION,
    account: config.AWS_ACCOUNT
  },
});
