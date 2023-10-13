import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { DynamoStack } from "./dynamodb";
import { EksStack } from "./eks";
import { IAMStack } from "./iam";

export class IacStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const dynamoDbStack = new DynamoStack(this, "DynamoStack", props);

    const { pullsTable, commitsTable, issuesTable } = dynamoDbStack;

    const iam = new IAMStack(this, "IAMStack", {
      ...props,
      tableArns: {
        commits: commitsTable.tableArn,
        issues: issuesTable.tableArn,
        pulls: pullsTable.tableArn,
      },
    });

    const eksStack = new EksStack(this, "EksK8Stack", {
      ...props,
      tableNames: {
        commits: commitsTable.tableName,
        issues: issuesTable.tableName,
        pulls: pullsTable.tableName,
      },
      iam: {
        access: iam.accessKey.ref,
        secret: iam.accessKey.attrSecretAccessKey,
      },
    });
  }
}
