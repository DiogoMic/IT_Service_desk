#!/bin/bash

# Update CloudFormation stack with API Gateway methods
aws cloudformation update-stack \
  --stack-name itservicedesk-dev \
  --template-body file://cloudformation-template.yaml \
  --parameters ParameterKey=Environment,ParameterValue=dev \
               ParameterKey=DBUsername,ParameterValue=itservicedesk \
               ParameterKey=DBPassword,ParameterValue=YourSecurePassword123! \
  --capabilities CAPABILITY_NAMED_IAM

echo "Stack update initiated. Check AWS Console for progress."