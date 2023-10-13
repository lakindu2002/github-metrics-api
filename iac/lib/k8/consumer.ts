import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

interface ConsumerStackProps extends cdk.StackProps {
  cluster: cdk.aws_eks.FargateCluster;
  accessKey: string;
  secretAccessKey: string;
}

export class ConsumerStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ConsumerStackProps) {
    super(scope, id, props);

    const { cluster, secretAccessKey, accessKey } = props;

    cluster.addManifest("ConsumerDeployment", {
      apiVersion: "apps/v1",
      kind: "Deployment",
      metadata: {
        name: "consumer-deployment",
      },
      spec: {
        selector: {
          matchLabels: {
            app: "consumer-service",
          },
        },
        template: {
          metadata: {
            labels: {
              app: "consumer-service",
              name: "consumer-service",
            },
          },
          spec: {
            containers: [
              {
                name: "consumer",
                image:
                  "932055394976.dkr.ecr.ap-southeast-1.amazonaws.com/developer_iq_consumer:latest",
                env: [
                  { name: "PORT", value: "3006" },
                  {
                    name: "RABBITMQ_URL",
                    value: "amqp://guest:guest@rabbitmq-service.default:5672",
                  },
                  {
                    name: "AWS_ACCESS_KEY",
                    value: accessKey,
                  },
                  {
                    name: "AWS_SECRET_ACCESS",
                    value: secretAccessKey,
                  },
                ],
              },
            ],
          },
        },
      },
    });

    cluster.addManifest("ConsumerService", {
      apiVersion: "v1",
      kind: "Service",
      metadata: {
        name: "consumer-service",
      },
      spec: {
        selector: {
          app: "consumer-service",
        },
        ports: [
          {
            port: 3006,
            targetPort: 3006,
            protocol: "TCP",
          },
        ],
        type: "NodePort",
      },
    });

    cluster.addManifest("ConsumerAutoscaler", {
      apiVersion: "autoscaling/v2",
      kind: "HorizontalPodAutoscaler",
      metadata: {
        name: "consumer-deployment-autoscale",
      },
      spec: {
        scaleTargetRef: {
          apiVersion: "apps/v1",
          kind: "Deployment",
          name: "consumer-deployment",
        },
        minReplicas: 1,
        maxReplicas: 10,
        metrics: [
          {
            type: "Resource",
            resource: {
              name: "cpu",
              target: {
                type: "Utilization",
                averageUtilization: 60,
              },
            },
          },
        ],
      },
    });
  }
}
