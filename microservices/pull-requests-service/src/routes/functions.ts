import { createClosedPullRequestsPerUserInRepo } from "@pulls/service";
import { Request, Response } from "express";
import { groupBy } from "lodash";
import aws from "aws-sdk";

export const getHome = (_req: Request, resp: Response) => {
  return resp.json({ message: "hello from pulls service!" });
};

export const health = (_req: Request, res: Response) => {
  res.json({ status: "HEALTHY" });
};

export const createClosedPullRequestsPerUserInRepoInOrg = async (
  req: Request,
  res: Response
) => {
  const documentClient = new aws.DynamoDB.DocumentClient({
    region: process.env.AWS_REGION,
  });

  const { organizationName, repoName } = req.params;

  const pulls = await createClosedPullRequestsPerUserInRepo(
    organizationName,
    repoName
  );

  const groupedPulls = groupBy(pulls, (pull) => pull.userId);

  const promises = Object.entries(groupedPulls).map(
    async ([userId, pullRequests]) => {
      const closedPullRequestCounts = pullRequests.length;

      await documentClient
        .update({
          TableName: process.env.PULLS_TABLE,
          Key: {
            pk: `${userId}#${organizationName.trim().toLowerCase()}#${repoName
              .trim()
              .toLowerCase()}`,
          },
          UpdateExpression:
            "SET #closedPrs = :closedPrs,  #organizationName = :organizationName, #repoName = :repoName, #username = :username",
          ExpressionAttributeNames: {
            "#closedPrs": "closedPrs",
            "#organizationName": "organizationName",
            "#repoName": "repoName",
            "#username": "username",
          },
          ExpressionAttributeValues: {
            ":closedPrs": closedPullRequestCounts,
            ":organizationName": organizationName,
            ":repoName": repoName,
            ":username": userId,
          },
        })
        .promise();
    }
  );

  await Promise.all(promises);

  return res.json({ message: "EXECUTED" });
};

export const getPRSummaryPerUsername = async (req: Request, res: Response) => {
  const documentClient = new aws.DynamoDB.DocumentClient({
    region: process.env.AWS_REGION,
  });

  const { username, organizationName } = req.params;

  const { Items = [] } = await documentClient
    .query({
      TableName: process.env.PULLS_TABLE,
      IndexName: "by-username",
      KeyConditionExpression:
        "#username = :username AND #organizationName = :organizationName",
      ExpressionAttributeNames: {
        "#username": "username",
        "#organizationName": "organizationName",
      },
      ExpressionAttributeValues: {
        ":username": username,
        ":organizationName": organizationName,
      },
      Limit: 1,
    })
    .promise();

  res.json({ pulls: Items[0] });
};
