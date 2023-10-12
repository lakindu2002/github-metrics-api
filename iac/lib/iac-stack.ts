import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { DynamoStack } from "./dynamodb";
import { EksStack } from "./eks";

export class IacStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const dynamoDbStack = new DynamoStack(this, "DynamoStack", props);

    const { pullsTable, commitsTable, issuesTable } = dynamoDbStack;

    new EksStack(this, "EksK8Stack", {
      ...props,
      tables: {
        commits: commitsTable.tableName,
        issues: issuesTable.tableName,
        pulls: pullsTable.tableName,
      },
    });
  }
}
