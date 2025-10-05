# IT Service Desk AWS Infrastructure

This directory contains the CloudFormation template and database schema for deploying the IT Service Desk application on AWS.

## Architecture

- **Frontend**: AWS Amplify (React + TypeScript)
- **Backend**: Lambda functions (Python 3.12) + API Gateway
- **Database**: RDS PostgreSQL
- **Authentication**: AWS Cognito
- **File Storage**: S3
- **Networking**: VPC with public/private subnets

## Deployment Steps

### ✅ 1. CloudFormation Stack Deployed Successfully

Infrastructure has been created with all AWS resources.

### ✅ 2. API Gateway Methods Deployed Successfully

All API endpoints are now configured and deployed to the `dev` stage.

### 🔧 3. Initialize Database Schema (Next Step)

After the stack is deployed, connect to the RDS instance and run:

```bash
psql -h <RDS_ENDPOINT> -U itservicedesk -d itservicedesk -f database-schema.sql
```

### 3. Configure Amplify

1. Update the repository URL in the CloudFormation template
2. Connect your GitHub repository to Amplify
3. Configure build settings and environment variables

### 4. Update Frontend Configuration

Create a `.env` file in the frontend with the CloudFormation outputs:

```env
VITE_API_URL=https://your-api-gateway-url/dev
VITE_USER_POOL_ID=your-user-pool-id
VITE_USER_POOL_CLIENT_ID=your-user-pool-client-id
VITE_IDENTITY_POOL_ID=your-identity-pool-id
VITE_S3_BUCKET=your-s3-bucket-name
VITE_AWS_REGION=us-east-1
```

## Resources Created

### Networking
- VPC with CIDR 10.0.0.0/16
- 2 Public subnets (10.0.101.0/24, 10.0.102.0/24)
- 2 Private subnets (10.0.1.0/24, 10.0.2.0/24)
- Internet Gateway and Route Tables
- Security Groups for Lambda and RDS

### Database
- RDS PostgreSQL 15.4 (db.t3.micro)
- Multi-AZ disabled for cost optimization
- Encrypted storage with 7-day backup retention

### Authentication
- Cognito User Pool with email verification
- Identity Pool for AWS resource access
- IAM roles for authenticated users

### Backend
- 3 Lambda functions (Python 3.12):
  - Get Tickets
  - Create Ticket
  - Get Categories
- API Gateway with CORS enabled
- VPC configuration for database access

### Storage
- S3 bucket with encryption and versioning
- Lifecycle policies for cleanup
- IAM policies for user-specific access

### Frontend
- Amplify app with automatic builds
- Environment variables configured
- Branch deployment (main)

## Post-Deployment Configuration

1. **Database**: Run the schema initialization script
2. **SES**: Verify sender email address for notifications
3. **API Gateway**: Configure CORS and method integrations
4. **Lambda**: Add psycopg2 layer for PostgreSQL connectivity
5. **Cognito**: Create initial admin users
6. **S3**: Configure CORS for file uploads
7. **Amplify**: Update callback URLs for production

## Email Notifications

The system sends automatic email notifications for:
- **New Ticket Created**: Notifies all IT team members
- **Ticket Assigned**: Notifies the ticket creator
- **Ticket Resolved**: Notifies the ticket creator with feedback survey link
- **New Chat Message**: Notifies the other party (IT team ↔ User)

### Chat Notification Flow
1. **User creates ticket** → IT team gets email notification
2. **IT assigns ticket** → User gets assignment notification + status changes to "In Progress"
3. **IT member sends message** → User gets chat notification email
4. **User replies** → Assigned IT member gets chat notification email
5. **Ticket resolved** → User gets resolution email with feedback survey link

### API Endpoints Added
- `POST /chat` - Send chat message
- `GET /chat/{ticketId}` - Get chat messages for ticket
- `POST /feedback` - Submit feedback survey
- `PUT /tickets/{id}` - Update ticket (assignment, status)

### SES Configuration

1. Verify the sender email address:
```bash
aws ses verify-email-identity --email-address noreply@yourcompany.com
```

2. Update the FROM_EMAIL environment variable in the NotificationFunction
3. For production, move SES out of sandbox mode

### Frontend Components Added
- `ChatComponent.tsx` - Real-time chat interface
- `FeedbackForm.tsx` - User satisfaction survey form

## Cost Optimization

- RDS: Single AZ deployment (db.t3.micro)
- Lambda: Pay-per-use with VPC configuration
- S3: Lifecycle policies for old file cleanup
- API Gateway: Regional endpoint for lower latency

## Security Features

- VPC isolation for database
- Encrypted RDS storage
- S3 bucket with blocked public access
- IAM least-privilege policies
- Cognito authentication with strong password policy

## Deployment Status

- [x] CloudFormation template created
- [x] Infrastructure deployed (PostgreSQL 17.6, fixed IAM policies)
- [x] API Gateway methods configured and deployed
- [x] Database schema applied
- [x] SES email verified
- [x] Frontend updated with AWS endpoints

## ✅ DEPLOYMENT COMPLETE

Your IT Service Desk application is now fully deployed and ready to use!

## Important Notes

- **PostgreSQL Version**: Updated to 17.6-R2 (latest supported)
- **IAM Policies**: Fixed S3 resource ARN format issues
- **API Gateway**: Methods must be configured manually using api-gateway-methods.yaml
- **Email Notifications**: Requires SES email verification before testing