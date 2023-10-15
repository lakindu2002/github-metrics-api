import { groupBy } from "lodash";
import { Commit } from "../types";
import axios from "axios";
import server from "../server";
import aws from "aws-sdk";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const getCommitsInRepoInOrg = async (
  repoName: string,
  organizationName: string
): Promise<Commit[]> => {
  const commitsUrl = `http://api.github.com/repos/${organizationName}/${repoName}/commits`;
  const allCommits: Commit[] = [];
  let page = 1;

  console.log("STARTING TO COLLECT COMMITS", { organizationName, repoName });

  while (true) {
    try {
      // process to avoid rates
      if (page === ((process.env.RATE_COUNT as unknown as number) || 100)) {
        console.log("HITTING BREAK", { page });
        break;
      }

      const response = await axios.get(commitsUrl, {
        params: { page, per_page: 100 },
      });

      const commits = response.data;
      if (response.status !== 200) {
        console.log(`Error: ${response.status}`);
        break;
      }

      // If the response has commits, add them to the main list
      if (commits.length > 0) {
        allCommits.push(...commits);
        page++;

        console.log("GATHERED DATA FOR A PAGE");
      } else {
        break; // No more pages, exit the loop
      }

      // Check for the Link header for pagination information
      const linkHeader = response.headers.link;
      if (!linkHeader || !linkHeader.includes('rel="next"')) {
        console.log("NO PAGINATION, EXITING");
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
    }
  }
  return allCommits
    .map((commit) => ({
      author: commit.author,
      commit: commit.commit,
      node_id: commit.node_id,
      sha: commit.sha,
      authorId: commit.author?.login,
    }))
    .filter((commit) => !!commit.authorId);
};

export const handleCreateCommits = async (
  organizationName: string,
  repoName: string
) => {
  const documentClient = new aws.DynamoDB.DocumentClient({
    region: process.env.AWS_REGION || "ap-southeast-1",
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_ACCESS,
  });

  const commits = await getCommitsInRepoInOrg(repoName, organizationName);
  const groupedByAuthor = groupBy(commits, (commit) => commit.authorId);
  console.log({ name: process.env.COMMITS_TABLE });
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
      return { userId, commitCount };
    }
  );

  const responses = await Promise.all(promises);
  return responses;
};

export const getCommitSummary = async (
  username: string,
  organizationName: string
) => {
  const documentClient = new aws.DynamoDB.DocumentClient({
    region: process.env.AWS_REGION || "ap-southeast-1",
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_ACCESS,
  });

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

  server.getChannels().metrics.sendToQueue(
    "COMMITS_METRICS",
    Buffer.from(
      JSON.stringify({
        commits: Items[0] || { commitCount: 0, organizationName, username },
        type: "METRICS",
      })
    )
  );
};
