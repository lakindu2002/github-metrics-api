import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

interface CommitsStackProps extends cdk.StackProps {
  cluster: cdk.aws_eks.FargateCluster;
  commitTable: string;
}

export class CommitsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: CommitsStackProps) {
    super(scope, id, props);

    const { cluster, commitTable } = props;

    cluster.addManifest("CommitsDeployment", {
      apiVersion: "apps/v1",
      kind: "Deployment",
      metadata: {
        name: "commits-deployment",
      },
      spec: {
        selector: {
          matchLabels: {
            app: "commits-service",
          },
        },
        template: {
          metadata: {
            labels: {
              app: "commits-service",
              name: "commits-service",
            },
          },
          spec: {
            containers: [
              {
                name: "commits",
                image:
                  "932055394976.dkr.ecr.ap-southeast-1.amazonaws.com/developer_iq_commits:latest",
                env: [
                  { name: "PORT", value: "3002" },
                  { name: "AWS_REGION", value: "ap-southeast-1" },
                  {
                    name: "COMMITS_TABLE",
                    value: commitTable,
                  },
                  {
                    name: "RABBITMQ_URL",
                    value: "amqp://guest:guest@rabbitmq-service.default:5672",
                  },
                ],
              },
            ],
          },
        },
      },
    });

    cluster.addManifest("CommitsService", {
      apiVersion: "v1",
      kind: "Service",
      metadata: {
        name: "commits-service",
      },
      spec: {
        selector: {
          app: "commits-service",
        },
        ports: [
          {
            port: 3002,
            targetPort: 3002,
            protocol: "TCP",
          },
        ],
        type: "NodePort",
      },
    });

    cluster.addManifest("CommitsDeploymentAutoscale", {
      apiVersion: "autoscaling/v2",
      kind: "HorizontalPodAutoscaler",
      metadata: {
        name: "commits-deployment-autoscale",
      },
      spec: {
        scaleTargetRef: {
          apiVersion: "apps/v1",
          kind: "Deployment",
          name: "commits-deployment",
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
