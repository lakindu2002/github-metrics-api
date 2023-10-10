import server from "@issues/server";
import { Issue } from "@issues/types";
import axios from "axios";
import { groupBy } from "lodash";
const aws = require("aws-sdk");

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const getOpenClosedIssuesInRepo = async (
  organizationName: string,
  repoName: string
): Promise<Issue[]> => {
  const issuesUrl = `http://api.github.com/repos/${organizationName}/${repoName}/issues`;

  const allIssues: Issue[] = [];
  let page = 1;

  while (true) {
    try {
      const response = await axios.get(issuesUrl, {
        params: {
          state: "all",
          page,
          per_page: 100,
        },
      });

      if (response.status !== 200) {
        console.error(`Error: ${response.status}`);
        break;
      }

      const issues = response.data;

      // If the response has issues, add them to the main list
      if (issues.length > 0) {
        allIssues.push(...issues);
        page++;
      } else {
        break; // No more pages, exit the loop
      }

      // Check for the Link header for pagination information
      const linkHeader = response.headers.link;
      if (!linkHeader || !linkHeader.includes('rel="next"')) {
        break; // No "next" link in the header, exit the loop
      }
    } catch (err) {
      console.error(`Error: ${err.message}`);

      if (err.response && err.response.status === 403) {
        // GitHub API rate limit exceeded, implement exponential backoff
        const resetTime = err.response.headers["x-ratelimit-reset"];
        if (!resetTime || resetTime === null) {
          console.log("Unknown rate limit error. Waiting for 60 seconds...");
          await wait(60000); // Wait for 60 seconds
        } else {
          const resetTimestamp = parseInt(resetTime, 10) * 1000; // Convert to milliseconds
          const currentTime = new Date().getTime();
          const waitTime = Math.max(0, resetTimestamp - currentTime);
          console.log(
            `Rate limit exceeded. Waiting for ${waitTime / 1000} seconds...`
          );
          await wait(waitTime);
        }
      } else {
        break; // Break for other errors
      }
      break;
    }
  }

  return allIssues.map((issue) => ({
    assignees: issue.assignees.map((assignee) => ({ login: assignee.login })),
    number: issue.number,
    repository_url: issue.repository_url,
    title: issue.title,
    url: issue.url,
    state: issue.state,
    user: {
      login: issue.user.login,
    },
  }));
};

export const handleCompileIssues = async (
  organizationName: string,
  repoName: string
) => {
  const documentClient = new aws.DynamoDB.DocumentClient({
    region: process.env.AWS_REGION || "ap-southeast-1",
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_ACCESS,
  });

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
};

export const handleGetIssuesSummary = async (
  orgName: string,
  username: string,
  responseQueue: string
) => {
  const documentClient = new aws.DynamoDB.DocumentClient({
    region: process.env.AWS_REGION || "ap-southeast-1",
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_ACCESS,
  });

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
        ":organizationName": orgName,
      },
      Limit: 1,
    })
    .promise();

  const metric = Items[0] || {};

  server
    .getChannels()
    .consumer.sendToQueue(
      responseQueue,
      Buffer.from(JSON.stringify({ issues: metric }))
    );
};
