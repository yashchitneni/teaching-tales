# AWS Infrastructure for Teaching Tales

## Production Deployment Summary

**Production URL**: https://d2l4bx1capmcnz.cloudfront.net

**Deployment Method**: SST v3.17.10 with NextJS component

**Stage**: production

## Infrastructure Components

### 1. CloudFront Distribution
- **Domain**: d2l4bx1capmcnz.cloudfront.net
- **Purpose**: Global CDN for fast content delivery
- **Features**:
  - HTTPS enabled
  - Custom cache policies for server-side rendered content
  - CloudFront Functions for request handling
  - Key-Value Store for configuration

### 2. S3 Buckets

#### Application Assets Bucket
- **Name**: Managed by SST (TeachingTalesAppAssets)
- **Purpose**: Stores static Next.js assets (_next/static files)
- **Configuration**:
  - Public access blocked
  - CORS configured
  - Bucket policy for CloudFront access

#### Teaching Tales Bucket
- **Name**: teaching-tales-production-teachingtalesbucketbucket-ncvkkabz
- **Purpose**: General file storage for the application
- **Access**: Public

### 3. Lambda Functions

#### Server Function (Default)
- **Name**: TeachingTalesAppServerUseast1
- **Purpose**: Handles server-side rendering for Next.js pages
- **Runtime**: Node.js
- **Region**: us-east-1
- **Features**:
  - Function URL enabled
  - CloudWatch Logs integration
  - IAM role with necessary permissions

#### Image Optimization Function
- **Name**: TeachingTalesAppImageOptimizer
- **Purpose**: On-the-fly image optimization for Next.js Image component
- **Features**:
  - Function URL enabled
  - Handles image resizing and format conversion

#### Revalidation Function
- **Name**: TeachingTalesAppRevalidationEventsSubscriberEkeera
- **Purpose**: Handles ISR (Incremental Static Regeneration) revalidation
- **Trigger**: SQS Queue

### 4. DynamoDB Table
- **Name**: TeachingTalesAppRevalidationTable
- **Purpose**: Stores revalidation state for ISR
- **Configuration**: On-demand billing mode

### 5. SQS Queue
- **Name**: TeachingTalesAppRevalidationEventsQueue
- **Purpose**: Queue for ISR revalidation events
- **Integration**: Triggers Lambda function for processing

### 6. CloudWatch Log Groups
- **/aws/lambda/TeachingTalesAppServerUseast1**: Server function logs
- **/aws/lambda/TeachingTalesAppImageOptimizer**: Image optimization logs
- **/aws/lambda/TeachingTalesAppRevalidationEventsSubscriberEkeera**: Revalidation function logs

### 7. IAM Roles and Policies
- Server function execution role
- Image optimizer execution role
- Revalidation function execution role
- Each with least-privilege permissions for their specific tasks

### 8. CloudFront Functions
- **TeachingTalesAppCloudfrontFunctionRequest**: Handles request routing and modifications

### 9. Environment Variables
All functions have access to:
- AWS Cognito configuration via environment variables
- `SST_RESOURCE_TeachingTalesBucket`
- `SST_RESOURCE_App`

## Architecture Benefits

1. **Serverless**: No servers to manage, automatic scaling
2. **Global Performance**: CloudFront CDN serves content from edge locations worldwide
3. **Cost Effective**: Pay only for what you use
4. **Secure**: HTTPS by default, IAM roles for access control
5. **Maintainable**: Infrastructure as code with SST

## Removed Infrastructure

The following infrastructure from the previous ECS deployment was removed:
- VPC and all networking components (subnets, route tables, internet gateway)
- ECS Cluster and Service
- Application Load Balancer
- Container-based deployment infrastructure

## Management

To manage this infrastructure:
- Deploy updates: `npx sst deploy --stage production`
- View logs: Check CloudWatch Log Groups
- Monitor: Use AWS CloudWatch metrics
- Remove: `npx sst remove --stage production` (careful - this deletes everything)

## Cost Considerations

Primary cost drivers:
1. Lambda invocations (server-side rendering)
2. CloudFront data transfer
3. S3 storage (minimal for static assets)
4. DynamoDB (on-demand, very low for ISR)

The serverless architecture ensures you only pay for actual usage.
