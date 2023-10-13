import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

interface IngressStackProps extends cdk.StackProps {
  cluster: cdk.aws_eks.FargateCluster;
  ports: {
    consumer: number;
  };
  subnets: string[];
}

export class IngressStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: IngressStackProps) {
    super(scope, id, props);

    const {
      cluster,
      ports: { consumer },
      subnets,
    } = props;

    cluster.addManifest("IngressDeployment", {
      apiVersion: "networking.k8s.io/v1",
      kind: "Ingress",
      metadata: {
        name: "ingress",
        annotations: {
          "alb.ingress.kubernetes.io/scheme": "internet-facing",
          "alb.ingress.kubernetes.io/target-type": "ip",
          "alb.ingress.kubernetes.io/subnets": subnets.join(","),
          "alb.ingress.kubernetes.io/tags": `kubernetes.io/cluster/${cluster.clusterName}=shared,kubernetes.io/role/elb=1`,
        },
      },
      spec: {
        ingressClassName: "alb",
        rules: [
          {
            http: {
              paths: [
                {
                  path: "/",
                  pathType: "Prefix",
                  backend: {
                    service: {
                      name: "consumer-service",
                      port: {
                        number: consumer,
                      },
                    },
                  },
                },
              ],
            },
          },
        ],
      },
    });
  }
}
