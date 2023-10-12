import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

interface RabbitMqStackProps extends cdk.StackProps {
  cluster: cdk.aws_eks.FargateCluster;
}

export class RabbitMqK8Stack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: RabbitMqStackProps) {
    super(scope, id, props);

    const { cluster } = props;

    cluster.addManifest("RabbitMQDeployment", {
      apiVersion: "apps/v1",
      kind: "Deployment",
      metadata: { name: "rabbitmq-deployment" },
      spec: {
        replicas: 1,
        selector: { matchLabels: { app: "rabbitmq" } },
        template: {
          metadata: { labels: { app: "rabbitmq" } },
          spec: {
            containers: [
              {
                name: "rabbitmq",
                image: "rabbitmq:3.10-rc-management-alpine",
              },
            ],
          },
        },
      },
    });

    cluster.addManifest("RabbitMQService", {
      apiVersion: "v1",
      kind: "Service",
      metadata: { name: "rabbitmq-service" },
      spec: {
        selector: { app: "rabbitmq" },
        type: "ClusterIP",
        ports: [
          { protocol: "TCP", port: 5672, targetPort: 5672, name: "rabbitmq" },
          {
            protocol: "TCP",
            port: 15672,
            targetPort: 15672,
            name: "rabbitmq-admin",
          },
        ],
      },
    });
  }
}
