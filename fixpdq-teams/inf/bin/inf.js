#!/usr/bin/env node

const cdk = require('@aws-cdk/core');
const config = require('../config.json');
const { TeamInfStack } = require('../lib/inf-stack');
const prefix = 'fixpdq';

const app = new cdk.App();

new TeamInfStack(app, `${prefix}-teams-stk`, {
  env: {
    region: config.AWS_REGION,
    account: config.AWS_ACCOUNT
  },
});