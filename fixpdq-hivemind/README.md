# FixPDQ HiveMind Microservice

## Requirements

- [Node.JS 12.x](https://nodejs.org/en/download/)
- [VScode](https://code.visualstudio.com/)
- [AWS CLI](https://aws.amazon.com/cli/)
- [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html)
- [AWS Vault](https://github.com/99designs/aws-vault)

## Directory Structure

```

inf/
    infrastructure code
lambda/
    <lambda>
        services/     External services implementation (call 3rd party API)
        utils/        Utility libraries (formatting, validation,)

```

## Debugging in VSCode

The repo includes VSCode configuration for debugging the whole common libraries and also debugging individual test specs

## Build

Webpack and Babel is the main build/bundler tool for this project

- development - `npm run build`
- production  - `npm run build:production`

## Local Machine Deployment

- `npm run deploy:stack` - deploy or update the new stack to AWS
- `npm run destroy:stack` - destroy the whole stack from its current deployment environment

## Release

Follow [Semantic Versioning](https://semver.org/). Node.JS's npm has built in tool that be invoked locally or through CI

eg.

  `$> npm version patch` - patch and bugfixes

  `$> npm version minor` - new feature(s) + 0 or more bugfixes

  `$> npm version major` - breaking changes, new feature(s) and 0 or more bugfixes

## Infrastructure

### Local Machine Deployment

### Pre-requisite

Use `aws-vault` for all your local deployment: easy.
If you run into conflict, update environment variable, see config.json, esp. ENVIRONMENT_PREFIX

### Commands
- `aws-vault exec ${AWS_PROFILE} -- npm run deploy` - build and deploy the Lambda infrastructure
- `aws-vault exec ${AWS_PROFILE} -- npm run destroy` - destroy infrastructure and its dependencies

## Pipelines
### Build
Run in `lambda` folder
```
npm run build && cp -f .aws-sam/build/HivemindServiceFunction/*.* ../inf/assets/HivemindServiceFunction/ && npm run build && cp -f .aws-sam/build/HivemindFulfilmentServiceFunction/*.* ../inf/assets/HivemindFulfilmentServiceFunction/
```
### Deploy from local
Run in `inf` folder
```
aws-vault exec fixpdq-dev -- cdk deploy fixpdq-hivemind-stk --require-approval=never --output cdk.out --trace
```
### Test
Run in `inf` folder
```
npm run run:HivemindServiceFunction:process:dev
```
### Debug
Run in `inf` folder
```
npm run debug:HivemindServiceFunction:process:dev
```