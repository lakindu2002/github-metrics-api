import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

export class EksStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const cluster = new cdk.aws_eks.FargateCluster(this, "developer-iq", {
      version: cdk.aws_eks.KubernetesVersion.V1_26,
      endpointAccess: cdk.aws_eks.EndpointAccess.PUBLIC_AND_PRIVATE,
      albController: {
        version: cdk.aws_eks.AlbControllerVersion.V2_5_1,
      },
    });

    cluster.addFargateProfile("fargateProfile", {
      fargateProfileName: "developer-iq-fargate-profile",
      selectors: [{ namespace: "app" }],
    });
  }
}
