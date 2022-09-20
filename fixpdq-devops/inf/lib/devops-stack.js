const cdk = require('@aws-cdk/core');
const iam = require('@aws-cdk/aws-iam');
const route53 = require('@aws-cdk/aws-route53');
const certificateManager = require('@aws-cdk/aws-certificatemanager');
const path = require('path');

const config = require('../config');

class DevOpsStack extends cdk.Stack {
  /**
   *
   * @param {cdk.Construct} scope
   * @param {string} id
   * @param {cdk.StackProps=} props
   */
  constructor(scope, id, props) {
    super(scope, id, props);

    const prefix = 'fixpdq';
    const environment = config.ENVIRONMENT;
  }
}

module.exports = { DevOpsStack }
