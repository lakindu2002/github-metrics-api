import * as aws from "aws-sdk";
import { getCommitsInRepoInOrg } from "@commits/service";
import { Request, Response } from "express";
import { groupBy } from "lodash";

export const getHome = (_req: Request, resp: Response) => {
  return resp.json({ message: "hello world!" });
};

export const health = (_req: Request, res: Response) => {
  res.json({ status: "HEALTHY" });
};

export const createCommitsPerUserInRepoInOrg = async (
  req: Request,
  res: Response
) => {
  const documentClient = new aws.DynamoDB.DocumentClient({
    region: process.env.AWS_REGION,
  });

  const { organizationName, repoName } = req.params;
  const commits = await getCommitsInRepoInOrg(repoName, organizationName);
  const groupedByAuthor = groupBy(commits, (commit) => commit.authorId);

  const promises = Object.entries(groupedByAuthor).map(
    async ([userId, commitsPerUser]) => {
      const commitCount = commitsPerUser.length;
      await documentClient
        .update({
          TableName: process.env.COMMITS_TABLE,
          Key: {
            pk: `${userId}#${organizationName.trim().toLowerCase()}#${repoName
              .trim()
              .toLowerCase()}`,
          },
          UpdateExpression:
            "SET #commitCount = :commitCount, #organizationName = :organizationName, #repoName = :repoName, #username = :username",
          ExpressionAttributeNames: {
            "#commitCount": "commitCount",
            "#organizationName": "organizationName",
            "#repoName": "repoName",
            "#username": "username",
          },
          ExpressionAttributeValues: {
            ":commitCount": commitCount,
            ":organizationName": organizationName,
            ":repoName": repoName,
            ":username": userId,
          },
        })
        .promise();
    }
  );

  await Promise.all(promises);

  return res.json({ message: "CREATED" });
};

export const getCommitsSummaryPerUsername = async (
  req: Request,
  res: Response
) => {
  const documentClient = new aws.DynamoDB.DocumentClient({
    region: process.env.AWS_REGION,
  });

  const { username, organizationName } = req.params;

  const { Items = [] } = await documentClient
    .query({
      TableName: process.env.COMMITS_TABLE,
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

  res.json({
    commits: Items[0] || { commitCount: 0, organizationName, username },
  });
};
