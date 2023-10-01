import aws from "aws-sdk";
import { getOpenClosedIssuesInRepo } from "@issues/service";
import { Request, Response } from "express";
import { groupBy } from "lodash";

export const getHome = (_req: Request, resp: Response) => {
  return resp.json({ message: "hello world!" });
};

export const health = (_req: Request, res: Response) => {
  res.json({ status: "HEALTHY" });
};

export const createNumberOfIssuesAssignedPerUserInRepo = async (
  req: Request,
  res: Response
) => {
  const documentClient = new aws.DynamoDB.DocumentClient({
    region: process.env.AWS_REGION,
  });

  const { organizationName, repoName } = req.params;
  const issues = await getOpenClosedIssuesInRepo(organizationName, repoName);

  const groupedIssuesByStatus = groupBy(issues, (issue) => issue.state);

  const opened = groupedIssuesByStatus.open;
  const closed = groupedIssuesByStatus.closed;

  const counts: { [userId: string]: { closed: number; open: number } } = {};

  opened.forEach((openedIssue) => {
    const { assignees = [] } = openedIssue;
    const assigneeUserNames = assignees.map((assignee) => assignee.login);
    assigneeUserNames.forEach((username) => {
      counts[username] = {
        ...counts?.[username],
        open: (counts[username]?.open || 0) + 1,
      };
    });
  });

  closed.forEach((closedIssue) => {
    const { assignees = [] } = closedIssue;
    const assigneeUserNames = assignees.map((assignee) => assignee.login);
    assigneeUserNames.forEach((username) => {
      counts[username] = {
        ...counts?.[username],
        closed: (counts[username]?.closed || 0) + 1,
      };
    });
  });

  const promises = Object.entries(counts).map(async ([userId, stats]) => {
    const { closed = 0, open = 0 } = stats;
    await documentClient
      .update({
        TableName: process.env.ISSUES_TABLE,
        Key: {
          pk: `${userId}#${organizationName.trim().toLowerCase()}#${repoName
            .trim()
            .toLowerCase()}`,
        },
        UpdateExpression:
          "SET #closedIssues = :closedIssues, #openedIssues = :openedIssues, #organizationName = :organizationName, #repoName = :repoName, #username = :username",
        ExpressionAttributeNames: {
          "#closedIssues": "closedIssues",
          "#openedIssues": "openedIssues",
          "#organizationName": "organizationName",
          "#repoName": "repoName",
          "#username": "username",
        },
        ExpressionAttributeValues: {
          ":closedIssues": closed,
          ":openedIssues": open,
          ":organizationName": organizationName,
          ":repoName": repoName,
          ":username": userId,
        },
      })
      .promise();
  });
  await Promise.all(promises);
  res.json({ message: "PROCESSED" });
};

export const getIssuesSummaryPerUsername = async (
  req: Request,
  res: Response
) => {
  const documentClient = new aws.DynamoDB.DocumentClient({
    region: process.env.AWS_REGION,
  });

  const { username, organizationName } = req.params;

  const { Items = [] } = await documentClient
    .query({
      TableName: process.env.ISSUES_TABLE,
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

  res.json({ issues: Items[0] });
};
