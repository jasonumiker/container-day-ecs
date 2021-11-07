import ec2 = require('@aws-cdk/aws-ec2');
import ecs = require('@aws-cdk/aws-ecs');
import ecsPatterns = require('@aws-cdk/aws-ecs-patterns');
import certificateManager = require('@aws-cdk/aws-certificatemanager');
import route53 = require('@aws-cdk/aws-route53');
import cdk = require('@aws-cdk/core');
import { Certificate } from 'crypto';

export class CdkStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create VPC and Fargate Cluster
    // NOTE: Limit AZs to avoid reaching resource quotas
    const vpc = new ec2.Vpc(this, 'MyVpc', { maxAzs: 2 });
    const cluster = new ecs.Cluster(this, 'Cluster', { vpc });

    // Import the existing ACM certificate to use
    const cert = certificateManager.Certificate.fromCertificateArn(this, 'certificate', 
    this.node.tryGetContext('cert_arn'));

    // Import the existing Route 53 Hosted Zone to use
    const zone = route53.HostedZone.fromHostedZoneAttributes(this, 'zone', {
      hostedZoneId: this.node.tryGetContext('route53_zone_id'),
      zoneName: this.node.tryGetContext('route53_zone_name')
    });

    // Instantiate Fargate Service with just cluster and image
    const fargateService = new ecsPatterns.ApplicationLoadBalancedFargateService(this, 'nyan-service', {
      cluster,
      taskImageOptions: {
        image: ecs.ContainerImage.fromAsset('../nyan-cat'),
      },
      certificate: cert,
      domainName: this.node.tryGetContext('domain_name'),
      domainZone: zone
    });
  }
}
