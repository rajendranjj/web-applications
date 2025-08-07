# Jira Bug Analysis Dashboard - AWS Deployment Guide

## Prerequisites
- AWS Account with appropriate permissions
- Jira API credentials
- Git repository (GitHub, GitLab, or AWS CodeCommit)

## Option 1: AWS Amplify (Recommended for Teams)

### Advantages
- ✅ Automatic CI/CD from Git
- ✅ Built-in SSL certificates
- ✅ Global CDN distribution
- ✅ Zero server management
- ✅ Automatic scaling
- ✅ Preview environments for branches

### Steps
1. **Prepare Repository**
   ```bash
   git init
   git add .
   git commit -m "Initial Jira Bug Analysis Dashboard"
   git remote add origin https://github.com/your-company/jira-bug-analysis-dashboard.git
   git push -u origin main
   ```

2. **Deploy via Amplify Console**
   - Go to AWS Amplify Console
   - Click "New app" → "Host web app"
   - Connect your Git repository
   - Branch: main
   - Build settings: Auto-detected (uses amplify.yml)
   - Environment variables (see below)
   - Deploy!

3. **Environment Variables in Amplify**
   ```
   JIRA_BASE_URL = https://your-company.atlassian.net
   JIRA_EMAIL = your-service-account@company.com
   JIRA_API_TOKEN = your-api-token
   NODE_ENV = production
   ```

4. **Custom Domain (Optional)**
   - Add your company domain in Amplify console
   - Configure DNS records as instructed

## Option 2: Docker on EC2

### Advantages
- ✅ Full control over infrastructure
- ✅ Cost-effective for single environment
- ✅ Can customize server configuration
- ✅ Direct SSH access

### Steps
1. **Launch EC2 Instance**
   - Amazon Linux 2
   - t3.small or larger
   - Security group: Allow HTTP (80), HTTPS (443), SSH (22)

2. **Setup EC2**
   ```bash
   ssh -i your-key.pem ec2-user@your-ec2-ip
   
   # Install Docker
   sudo yum update -y
   sudo yum install -y docker git
   sudo service docker start
   sudo usermod -a -G docker ec2-user
   
   # Logout and login again for docker permissions
   ```

3. **Deploy Application**
   ```bash
   # Clone your repository
   git clone https://github.com/your-company/jira-bug-analysis-dashboard.git
   cd jira-bug-analysis-dashboard
   
   # Create production environment file
   cp env.production.template .env.production
   # Edit .env.production with your actual values
   
   # Build and run
   docker build -t jira-bug-analysis-dashboard .
   docker run -d -p 80:3001 --name jira-bug-analysis-dashboard \
     --env-file .env.production \
     jira-bug-analysis-dashboard
   ```

4. **Setup Load Balancer (Optional)**
   - Create Application Load Balancer
   - Add SSL certificate
   - Configure health checks

## Option 3: ECS with Fargate (Production Scale)

### Advantages
- ✅ Managed container orchestration
- ✅ Auto-scaling
- ✅ High availability
- ✅ Integrated with other AWS services
- ✅ No server management

### Steps
1. **Create ECR Repository**
   ```bash
   aws ecr create-repository --repository-name jira-bug-analysis-dashboard
   ```

2. **Build and Push Image**
   ```bash
   # Get login token
   aws ecr get-login-password --region us-east-1 | \
     docker login --username AWS --password-stdin \
     YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com
   
   # Build and push
   docker build -t jira-bug-analysis-dashboard .
   docker tag jira-bug-analysis-dashboard:latest \
     YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/jira-bug-analysis-dashboard:latest
   docker push YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/jira-bug-analysis-dashboard:latest
   ```

3. **Create ECS Resources**
   - Update ecs-task-definition.json with your account details
   - Create ECS cluster (Fargate)
   - Create task definition
   - Create service with load balancer

## Security Considerations

### Environment Variables
- Never commit API tokens to Git
- Use AWS Systems Manager Parameter Store for sensitive data
- Use IAM roles instead of API keys where possible

### Network Security
- Use VPC with private subnets for production
- Configure security groups properly
- Enable WAF for public-facing applications

### Monitoring
- Enable CloudWatch logging
- Set up CloudWatch alarms
- Use AWS X-Ray for distributed tracing (optional)

## Cost Optimization

### Amplify
- ~$1-5/month for small team usage
- Pay per build minute and data transfer

### EC2
- t3.small: ~$15/month
- Add EBS storage and data transfer costs

### ECS Fargate
- ~$10-30/month depending on usage
- More cost-effective at scale

## Team Access

### Amplify
- Use AWS Console access
- Set up branch-based previews for testing

### EC2/ECS
- Use bastion hosts for secure access
- Configure IAM roles for team access
- Set up CloudWatch dashboards

## Maintenance

### Updates
- Amplify: Automatic on Git push
- EC2: Manual or use CodeDeploy
- ECS: Blue/green deployments available

### Backups
- Git repository is your source of truth
- Consider backing up environment configurations
- Database backups (if you add a database later)

## Troubleshooting

### Common Issues
1. **Build Failures**: Check build logs in Amplify console
2. **API Connectivity**: Verify JIRA credentials and network access
3. **Performance**: Monitor CloudWatch metrics
4. **CORS Issues**: Update JIRA CORS settings if needed

### Support Resources
- AWS Documentation
- AWS Support (if you have a support plan)
- Community forums (Stack Overflow, AWS forums)