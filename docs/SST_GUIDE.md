# SST (Serverless Stack) Guide for Team

## What is SST?

SST is a framework for building modern full-stack applications on AWS. It handles infrastructure-as-code, deployment, and local development with real AWS resources.

## Key Concepts

- **App**: Your application (defined in `sst.config.ts`)
- **Stage**: Environment (dev, staging, production)
- **Resources**: AWS services (containers, databases, buckets, etc.)
- **Components**: Pre-built infrastructure patterns

## Essential Commands

### 🚀 Initial Setup
```bash
# Initialize SST in existing project
npx sst@latest init

# Install SST globally (optional)
npm install -g sst@latest
```

### 🏗️ Development
```bash
# Start development mode (connects to real AWS resources)
npx sst dev

# Run your app locally with live AWS resources
npx sst dev npm run dev
```

### 🚀 Deployment
```bash
# Deploy to your personal stage
npx sst deploy

# Deploy to specific stage
npx sst deploy --stage production

# Check what will be deployed
npx sst diff

# Deploy with debug info
npx sst deploy --verbose
```

### 🗑️ Cleanup
```bash
# Remove your stage (DESTRUCTIVE - deletes all resources)
npx sst remove

# Remove specific stage
npx sst remove --stage staging

# Remove and skip confirmation (BE CAREFUL!)
npx sst remove --stage dev --yes
```

### 📊 Management
```bash
# List all stages
npx sst list

# View current state
npx sst state list

# Unlock stuck deployments
npx sst unlock

# View logs
npx sst logs

# Connect to deployed resources
npx sst shell
```

## 🤖 Prompting AI Agents (Cursor/Claude/ChatGPT)

### For Initial Setup
```
"Set up SST for containerized deployment of my Next.js app. I want to deploy containers to ECS with a load balancer, VPC, and S3 bucket. Create the sst.config.ts file with proper infrastructure."
```

### For Adding Features
```
"Add a PostgreSQL RDS database to my SST configuration. Make sure it's connected to the VPC and linked to my service so the app can access it."
```

### For Debugging Deployments
```
"My SST deployment is failing with [error message]. Help me debug the sst.config.ts and suggest fixes. Here's my current configuration: [paste config]"
```

### For Environment Management
```
"Help me set up different SST stages for development, staging, and production. I want different resource sizes and configurations for each environment."
```

### For Migration
```
"I want to migrate from [current setup] to SST containers. Help me create the infrastructure configuration and deployment strategy."
```

## 📁 Project Structure

```
your-app/
├── sst.config.ts          # Infrastructure configuration
├── .sst/                  # SST internal files (gitignore this)
├── Dockerfile             # Container definition
├── .dockerignore          # Docker ignore rules
└── src/                   # Your application code
```

## 🔧 Configuration Examples

### Basic Container Setup
```typescript
export default $config({
  app(input) {
    return {
      name: "my-app",
      removal: input?.stage === "production" ? "retain" : "remove",
      home: "aws",
    };
  },
  async run() {
    const vpc = new sst.aws.Vpc("MyVpc");
    const cluster = new sst.aws.Cluster("MyCluster", { vpc });
    
    const service = new sst.aws.Service("MyService", {
      cluster,
      loadBalancer: {
        ports: [{ listen: "80/http", forward: "3000/http" }],
      },
    });

    return { url: service.url };
  },
});
```

### With Database
```typescript
const database = new sst.aws.Postgres("MyDatabase", { vpc });
const service = new sst.aws.Service("MyService", {
  cluster,
  link: [database],
  // ... other config
});
```

## 🚨 Important Safety Tips

### 1. Stage Management
- Each developer gets their own stage (usually your name)
- Production stage should be protected
- Always specify stage for production: `--stage production`

### 2. Resource Cleanup
- `sst remove` deletes ALL resources in that stage
- Use `sst diff` before deploying to see changes
- Set `removal: "retain"` for production databases

### 3. Cost Management
- Remove dev stages when not needed: `sst remove`
- Use smaller instance sizes for development
- Monitor AWS costs regularly

## 🔄 Common Workflows

### Daily Development
```bash
# Start working
npx sst dev

# Deploy changes
npx sst deploy

# End of day cleanup
npx sst remove
```

### Production Deployment
```bash
# Review changes
npx sst diff --stage production

# Deploy
npx sst deploy --stage production

# Monitor
npx sst logs --stage production
```

### Debugging Issues
```bash
# Check current state
npx sst state list

# View detailed logs
npx sst logs --tail

# Unlock if stuck
npx sst unlock

# Start fresh (removes everything!)
npx sst remove && npx sst deploy
```

## 🤝 Team Collaboration

### Branch Strategy
- Each developer uses their own stage
- Shared staging environment: `--stage staging`
- Protected production: `--stage production`

### Environment Variables
```typescript
// In sst.config.ts
const service = new sst.aws.Service("MyService", {
  environment: {
    DATABASE_URL: database.connectionString,
    API_KEY: $stage === "production" ? prodKey : devKey,
  },
});
```

### Sharing Resources
```typescript
// Reference existing resources
const existingVpc = sst.aws.Vpc.get("SharedVpc", "vpc-12345");
```

## 🎯 AI Agent Prompting Best Practices

### 1. Be Specific About Infrastructure
```
❌ "Deploy my app with SST"
✅ "Deploy my Next.js app using SST containers with ECS, including a load balancer, PostgreSQL database, and Redis cache"
```

### 2. Include Context
```
✅ "I have a Next.js app that needs to connect to a database. Here's my current sst.config.ts: [paste config]. Help me add RDS PostgreSQL and update the service to connect to it."
```

### 3. Specify Environment
```
✅ "Set up SST configuration for three environments: development (smaller instances), staging (medium instances), and production (large instances with backup enabled)"
```

### 4. Ask for Explanations
```
✅ "Explain each resource in this SST configuration and why it's needed: [paste config]"
```

### 5. Request Safety Checks
```
✅ "Review my SST config for production deployment. Check for security issues, cost optimization, and backup strategies."
```

## 📚 Resources

- [SST Documentation](https://sst.dev/docs/)
- [SST Examples](https://github.com/sst/examples)
- [AWS Components](https://sst.dev/docs/aws/)
- [SST Discord](https://discord.gg/sst)

## 🆘 Troubleshooting

### Common Issues

1. **Deployment Stuck**: Run `sst unlock`
2. **Permission Errors**: Check AWS credentials
3. **Resource Conflicts**: Use unique names or different stages
4. **Build Failures**: Check Dockerfile and ensure local build works
5. **Network Issues**: Verify VPC and security group configuration

### Getting Help
1. Check SST docs first
2. Use AI agents with specific error messages
3. Ask team members
4. SST Discord community
5. GitHub issues

## 💡 Pro Tips

1. **Use TypeScript**: SST configs are TypeScript - leverage autocomplete
2. **Resource Naming**: Use consistent naming conventions
3. **Environment Parity**: Keep dev/staging/prod configs similar
4. **Monitoring**: Set up CloudWatch alarms for production
5. **Backup Strategy**: Use RDS automated backups for databases
6. **Security**: Use VPCs and security groups properly
7. **Cost Control**: Set up AWS billing alerts

Remember: SST gives you real AWS infrastructure, so treat it with the same care as production systems!
