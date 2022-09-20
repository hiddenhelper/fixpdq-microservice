# Introduction 
This is a repository for any devops related activities and features.  For examples, infrastructure as code not related to any modules or components, scripts, and helpers.

# Getting Started
Requirements:
- AWS Toolkit
- AWS Vault

# Build
```bash
cd lambda
npm run build && cp -f .aws-sam/build/PostConfirmationFunction/*.* ../inf/assets/PostConfirmationFunction && cp -f .aws-sam/build/PreSignupFunction/*.* ../inf/assets/PreSignupFunction
```