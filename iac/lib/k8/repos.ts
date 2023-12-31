import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

interface ReposStackProps extends cdk.StackProps {
  cluster: cdk.aws_eks.FargateCluster;
  accessKey: string;
  secretAccessKey: string;
}

export class ReposStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ReposStackProps) {
    super(scope, id, props);

    const { cluster, secretAccessKey, accessKey } = props;
    cluster.addManifest("ReposDeployment", {
      apiVersion: "apps/v1",
      kind: "Deployment",
      metadata: {
        name: "repos-deployment",
      },
      spec: {
        selector: {
          matchLabels: {
            app: "repos-service",
          },
        },
        template: {
          metadata: {
            labels: {
              app: "repos-service",
              name: "repos-service",
            },
          },
          spec: {
            containers: [
              {
                name: "repos",
                image:
                  "932055394976.dkr.ecr.ap-southeast-1.amazonaws.com/developer_iq_repos:latest",
                env: [
                  { name: "PORT", value: "3000" },
                  { name: "AWS_REGION", value: "ap-southeast-1" },
                  { name: "ORG_NAME", value: "lodash" },
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
                  {
                    name: "RATE_COUNT",
                    value: "100",
                  },
                  {
                    name: "MQ_TIMER",
                    value: "30000",
                  },
                ],
              },
            ],
          },
        },
      },
    });

    cluster.addManifest("ReposService", {
      apiVersion: "v1",
      kind: "Service",
      metadata: {
        name: "repos-service",
      },
      spec: {
        selector: {
          app: "repos-service",
        },
        ports: [
          {
            port: 3000,
            targetPort: 3000,
            protocol: "TCP",
          },
        ],
        type: "NodePort",
      },
    });

    cluster.addManifest("ReposAutoscaler", {
      apiVersion: "autoscaling/v2",
      kind: "HorizontalPodAutoscaler",
      metadata: {
        name: "repos-deployment-autoscale",
      },
      spec: {
        scaleTargetRef: {
          apiVersion: "apps/v1",
          kind: "Deployment",
          name: "repos-deployment",
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
