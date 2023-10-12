import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

interface EksStackProps extends cdk.StackProps {
  cluster: cdk.aws_eks.FargateCluster;
}

export class EksStack extends cdk.Stack {
  public readonly alb: cdk.aws_eks.AlbController;
  constructor(scope: Construct, id: string, props: EksStackProps) {
    super(scope, id, props);

    const { cluster } = props;

    this.alb = new cdk.aws_eks.AlbController(this, "DeveloperIQALB", {
      cluster,
      repository:
        "602401143452.dkr.ecr.us-west-2.amazonaws.com/amazon/aws-load-balancer-controller",
      version: cdk.aws_eks.AlbControllerVersion.V2_5_1,
    });
  }
}
