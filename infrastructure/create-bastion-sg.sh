#!/bin/bash

# Get VPC ID from CloudFormation stack resources
VPC_ID=$(aws cloudformation describe-stack-resources \
  --stack-name itservicedesk-dev \
  --logical-resource-id VPC \
  --query 'StackResources[0].PhysicalResourceId' \
  --output text)

echo "VPC ID: $VPC_ID"

# Create security group for bastion host
BASTION_SG_ID=$(aws ec2 create-security-group \
  --group-name dev-itservicedesk-bastion-sg \
  --description "Bastion host for database access" \
  --vpc-id $VPC_ID \
  --query 'GroupId' \
  --output text)

# Allow SSH access (replace 0.0.0.0/0 with your IP for security)
aws ec2 authorize-security-group-ingress \
  --group-id $BASTION_SG_ID \
  --protocol tcp \
  --port 22 \
  --cidr 0.0.0.0/0

echo "Bastion Security Group ID: $BASTION_SG_ID"
echo "Use this SG when launching EC2 instance"