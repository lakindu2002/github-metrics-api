import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

export class DynamoStack extends cdk.Stack {
  public readonly pullsTable: cdk.aws_dynamodb.Table;
  public readonly commitsTable: cdk.aws_dynamodb.Table;
  public readonly issuesTable: cdk.aws_dynamodb.Table;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.pullsTable = new cdk.aws_dynamodb.Table(this, "pulls", {
      partitionKey: {
        name: "pk",
        type: cdk.aws_dynamodb.AttributeType.STRING,
      },
      billingMode: cdk.aws_dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    this.pullsTable.addGlobalSecondaryIndex({
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

    this.commitsTable = new cdk.aws_dynamodb.Table(this, "commits", {
      partitionKey: {
        name: "pk",
        type: cdk.aws_dynamodb.AttributeType.STRING,
      },
      billingMode: cdk.aws_dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    this.commitsTable.addGlobalSecondaryIndex({
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

    this.issuesTable = new cdk.aws_dynamodb.Table(this, "issues", {
      partitionKey: {
        name: "pk",
        type: cdk.aws_dynamodb.AttributeType.STRING,
      },
      billingMode: cdk.aws_dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    this.issuesTable.addGlobalSecondaryIndex({
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
      value: this.pullsTable.tableName,
      exportName: "pullsTableName",
    });

    new cdk.CfnOutput(this, "commitsTableName", {
      value: this.commitsTable.tableName,
      exportName: "commitsTableName",
    });

    new cdk.CfnOutput(this, "issuesTableName", {
      value: this.issuesTable.tableName,
      exportName: "issuesTableName",
    });
  }
}
