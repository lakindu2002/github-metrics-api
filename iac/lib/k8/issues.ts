import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

interface IssuesStackProps extends cdk.StackProps {
  cluster: cdk.aws_eks.FargateCluster;
  issuesTableName: string;
  accessKey: string;
  secretAccessKey: string;
}

export class IssuesStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: IssuesStackProps) {
    super(scope, id, props);

    const { cluster, issuesTableName, accessKey, secretAccessKey } = props;

    cluster.addManifest("IssuesDeployment", {
      apiVersion: "apps/v1",
      kind: "Deployment",
      metadata: {
        name: "issues-deployment",
      },
      spec: {
        selector: {
          matchLabels: {
            app: "issues-service",
          },
        },
        template: {
          metadata: {
            labels: {
              app: "issues-service",
              name: "issues-service",
            },
          },
          spec: {
            containers: [
              {
                name: "issues",
                image:
                  "932055394976.dkr.ecr.ap-southeast-1.amazonaws.com/developer_iq_issues:latest",
                env: [
                  { name: "PORT", value: "3004" },
                  { name: "AWS_REGION", value: "ap-southeast-1" },
                  {
                    name: "ISSUES_TABLE",
                    value: issuesTableName,
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

    cluster.addManifest("IssuesService", {
      apiVersion: "v1",
      kind: "Service",
      metadata: {
        name: "issues-service",
      },
      spec: {
        selector: {
          app: "issues-service",
        },
        ports: [
          {
            port: 3004,
            targetPort: 3004,
            protocol: "TCP",
          },
        ],
        type: "NodePort",
      },
    });

    cluster.addManifest("IssuesAutoscaler", {
      apiVersion: "autoscaling/v2",
      kind: "HorizontalPodAutoscaler",
      metadata: {
        name: "issues-deployment-autoscale",
      },
      spec: {
        scaleTargetRef: {
          apiVersion: "apps/v1",
          kind: "Deployment",
          name: "issues-deployment",
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
