import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

interface SchedulerStackProps extends cdk.StackProps {
  cluster: cdk.aws_eks.FargateCluster;
  accessKey: string;
  secretAccessKey: string;
}

export class SchedulerStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: SchedulerStackProps) {
    super(scope, id, props);

    const { cluster, accessKey, secretAccessKey } = props;

    cluster.addManifest("ScheduleDeployment", {
      apiVersion: "apps/v1",
      kind: "Deployment",
      metadata: {
        name: "schedule-deployment",
      },
      spec: {
        replicas: 1,
        selector: {
          matchLabels: {
            app: "schedule-service",
          },
        },
        template: {
          metadata: {
            labels: {
              app: "schedule-service",
              name: "schedule-service",
            },
          },
          spec: {
            containers: [
              {
                name: "repos",
                image:
                  "932055394976.dkr.ecr.ap-southeast-1.amazonaws.com/developer_iq_schedule:latest",
                env: [
                  { name: "PORT", value: "3001" },
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
                ],
              },
            ],
          },
        },
      },
    });

    cluster.addManifest("ScheduleService", {
      apiVersion: "v1",
      kind: "Service",
      metadata: {
        name: "schedule-service",
      },
      spec: {
        selector: {
          app: "schedule-service",
        },
        ports: [
          {
            port: 3001,
            targetPort: 3001,
            protocol: "TCP",
          },
        ],
        type: "NodePort",
      },
    });
  }
}
