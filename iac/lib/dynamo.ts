import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

export class DynamoStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const pullsTable = new cdk.aws_dynamodb.Table(this, "pulls", {
      partitionKey: {
        name: "pk",
        type: cdk.aws_dynamodb.AttributeType.STRING,
      },
      billingMode: cdk.aws_dynamodb.BillingMode.PAY_PER_REQUEST,
    });

    pullsTable.addGlobalSecondaryIndex({
      indexName: "by-username",
      partitionKey: {
        name: "username",
        type: cdk.aws_dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: "organizationName",
        type: cdk.aws_dynamodb.AttributeType.STRING,
      },
      projectionType: cdk.aws_dynamodb.ProjectionType.ALL,
    });

    const commitsTable = new cdk.aws_dynamodb.Table(this, "commits", {
      partitionKey: {
        name: "pk",
        type: cdk.aws_dynamodb.AttributeType.STRING,
      },
      billingMode: cdk.aws_dynamodb.BillingMode.PAY_PER_REQUEST,
    });

    commitsTable.addGlobalSecondaryIndex({
      indexName: "by-username",
      partitionKey: {
        name: "username",
        type: cdk.aws_dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: "organizationName",
        type: cdk.aws_dynamodb.AttributeType.STRING,
      },
      projectionType: cdk.aws_dynamodb.ProjectionType.ALL,
    });

    const issuesTable = new cdk.aws_dynamodb.Table(this, "issues", {
      partitionKey: {
        name: "pk",
        type: cdk.aws_dynamodb.AttributeType.STRING,
      },
      billingMode: cdk.aws_dynamodb.BillingMode.PAY_PER_REQUEST,
    });

    issuesTable.addGlobalSecondaryIndex({
      indexName: "by-username",
      partitionKey: {
        name: "username",
        type: cdk.aws_dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: "organizationName",
        type: cdk.aws_dynamodb.AttributeType.STRING,
      },
      projectionType: cdk.aws_dynamodb.ProjectionType.ALL,
    });

    new cdk.CfnOutput(this, "pullsTableName", {
      value: pullsTable.tableName,
      exportName: "pullsTableName",
    });

    new cdk.CfnOutput(this, "commitsTableName", {
      value: commitsTable.tableName,
      exportName: "commitsTableName",
    });

    new cdk.CfnOutput(this, "issuesTableName", {
      value: issuesTable.tableName,
      exportName: "issuesTableName",
    });
  }
}
