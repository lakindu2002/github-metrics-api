import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { DynamoStack } from "./dynamo";
import { EksStack } from "./eks";

export class IacStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    new DynamoStack(this, "DynamoStack", props);
    new EksStack(this, "EksStack", props);
  }
}
