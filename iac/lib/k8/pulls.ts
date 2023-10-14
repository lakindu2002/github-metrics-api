import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

interface PullsStackProps extends cdk.StackProps {
  cluster: cdk.aws_eks.FargateCluster;
  pullsTable: string;
  accessKey: string;
  secretAccessKey: string;
}

export class PullsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: PullsStackProps) {
    super(scope, id, props);

    const { cluster, pullsTable, secretAccessKey, accessKey } = props;

    cluster.addManifest("PullsDeployment", {
      apiVersion: "apps/v1",
      kind: "Deployment",
      metadata: {
        name: "pulls-deployment",
      },
      spec: {
        selector: {
          matchLabels: {
            app: "pulls-service",
          },
        },
        template: {
          metadata: {
            labels: {
              app: "pulls-service",
              name: "pulls-service",
            },
          },
          spec: {
            containers: [
              {
                name: "pulls",
                image:
                  "932055394976.dkr.ecr.ap-southeast-1.amazonaws.com/developer_iq_pulls:latest",
                env: [
                  { name: "PORT", value: "3003" },
                  { name: "AWS_REGION", value: "ap-southeast-1" },
                  {
                    name: "PULLS_TABLE",
                    value: pullsTable,
                  },
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
                    value: 100,
                  },
                  {
                    name: "MQ_TIMER",
                    value: 30000,
                  },
                ],
              },
            ],
          },
        },
      },
    });

    cluster.addManifest("PullsService", {
      apiVersion: "v1",
      kind: "Service",
      metadata: {
        name: "pulls-service",
      },
      spec: {
        selector: {
          app: "pulls-service",
        },
        ports: [
          {
            port: 3003,
            targetPort: 3003,
            protocol: "TCP",
          },
        ],
        type: "NodePort",
      },
    });

    cluster.addManifest("PullsAutoscaler", {
      apiVersion: "autoscaling/v2",
      kind: "HorizontalPodAutoscaler",
      metadata: {
        name: "pulls-deployment-autoscale",
      },
      spec: {
        scaleTargetRef: {
          apiVersion: "apps/v1",
          kind: "Deployment",
          name: "pulls-deployment",
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
