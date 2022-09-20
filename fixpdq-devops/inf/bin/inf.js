#!/usr/bin/env node
const cdk = require('@aws-cdk/core');

const { ApiStack } = require('../lib/api-stack');
const { AuthStack } = require('../lib/auth-stack');
const { WebAppStack } = require('../lib/webapp-stack');
const { StorageStack } = require('../lib/storage-stack');
const { WebhookStack } = require('../lib/webhook-stack');

const config = require('../config');
const prefix = 'fixpdq';

const app = new cdk.App();

new ApiStack(app, `${prefix}-api-stk`, {
    env: {
        region: config.AWS_REGION,
        account: config.AWS_ACCOUNT
    },
});

new AuthStack(app, `${prefix}-auth-stk`, {
    env: {
        region: config.AWS_REGION,
        account: config.AWS_ACCOUNT
    },
});

new WebAppStack(app, `${prefix}-webapp-stk`, {
    env: {
        region: config.AWS_REGION,
        account: config.AWS_ACCOUNT
    },
});

new StorageStack(app, `${prefix}-storage-stk`, {
    env: {
        region: config.AWS_REGION,
        account: config.AWS_ACCOUNT
    }
})

new WebhookStack(app, `${prefix}-webhook-stk`, {
    env: {
        region: config.AWS_REGION,
        account: config.AWS_ACCOUNT
    },
});