# FixPDQ AWS CDK JavaScript project!

The `cdk.json` file tells the CDK Toolkit how to execute your app. The build step is not required when using JavaScript.

## Useful commands
 * `npm run test`                                      perform the jest unit tests
 * `aws-vault exec fixpdq-dev -- cdk deploy`           deploy this stack to your default AWS account/region
 * `aws-vault exec fixpdq-dev -- cdk diff`             compare deployed stack with current state
 * `aws-vault exec fixpdq-dev -- cdk synth`            emits the synthesized CloudFormation template
 * `aws-vault exec fixpdq-dev -- cdk destroy`          destroy

How to Deploy API Gateway
```bash
aws-vault exec fixpdq-dev -- cdk synth fixpdq-api-stk
aws-vault exec fixpdq-dev -- cdk deploy fixpdq-api-stk --require-approval=never --output cdk.out --trace
```

How to Deploy Auth - AWS Cognito
```bash
aws-vault exec fixpdq-dev -- cdk synth fixpdq-auth-stk
aws-vault exec fixpdq-dev -- cdk deploy fixpdq-auth-stk --require-approval=never --output cdk.out --trace
```

Appendix
To use CDK, the account needs to be initialised, run:
```Bash
cdk bootstrap aws://{account_number}/{region} --bootstrap-bucket-name fixpdq-cdk-staging-{environment}-s3
```

Example
```Bash
cdk bootstrap aws://538222035340/ap-southeast-2 --bootstrap-bucket-name fixpdq-cdk-staging-dev-s3
```