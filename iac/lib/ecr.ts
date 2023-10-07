import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

export class IacStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const repository = new cdk.aws_ecr.Repository(this, "developer-iq", {
      autoDeleteImages: true,
      repositoryName: "developer-iq",
      imageScanOnPush: true,
    });
  }
}
