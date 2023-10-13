import * as cdk from "aws-cdk-lib";
import {
  Policy,
  PolicyDocument,
  PolicyStatement,
  Effect,
  CfnAccessKey,
} from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";

interface IAMStackProps extends cdk.StackProps {
  tableArns: { commits: string; issues: string; pulls: string };
}

export class IAMStack extends cdk.Stack {
  public readonly iamUser: cdk.aws_iam.User;
  public readonly accessKey: cdk.aws_iam.CfnAccessKey;

  constructor(scope: Construct, id: string, props: IAMStackProps) {
    super(scope, id, props);

    const {
      tableArns: { commits, issues, pulls },
    } = props;

    this.iamUser = new cdk.aws_iam.User(this, "AppUser", {});
    this.iamUser.attachInlinePolicy(
      new Policy(this, "DynamoDBCrud", {
        document: new PolicyDocument({
          statements: [
            new PolicyStatement({
              actions: [
                "dynamodb:BatchGet*",
                "dynamodb:DescribeStream",
                "dynamodb:DescribeTable",
                "dynamodb:Get*",
                "dynamodb:Query",
                "dynamodb:Scan",
                "dynamodb:BatchWrite*",
                "dynamodb:CreateTable",
                "dynamodb:Delete*",
                "dynamodb:Update*",
                "dynamodb:PutItem",
              ],
              effect: Effect.ALLOW,
              resources: [
                commits,
                pulls,
                issues,
                `${commits}/index/*`,
                `${pulls}/index/*`,
                `${issues}/index/*`,
              ],
            }),
          ],
        }),
      })
    );

    this.accessKey = new CfnAccessKey(this, "AppUserAccessKey", {
      userName: this.iamUser.userName,
    });
  }
}
