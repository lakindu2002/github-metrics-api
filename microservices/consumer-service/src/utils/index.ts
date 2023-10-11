import server from "@consumer/server";
import { Channel } from "amqplib";

export const consumeCommitsMetrics = async () => {
  const metrics = await server.getChannels().connection.createChannel();
  metrics.assertQueue("COMMITS_METRICS");
  const promise = new Promise((resolve) => {
    metrics.consume("COMMITS_METRICS", (message) => {
      const content = JSON.parse(message.content.toString());
      if (content.type === "METRICS") {
        metrics.ack(message);
        metrics.close();
        resolve(content);
      }
    });
  });
  return promise;
};

export const consumeIssuesMetrics = async () => {
  const metrics = await server.getChannels().connection.createChannel();
  metrics.assertQueue("ISSUES_METRICS");
  const promise = new Promise((resolve) => {
    metrics.consume("ISSUES_METRICS", (message) => {
      const content = JSON.parse(message.content.toString());
      if (content.type === "METRICS") {
        metrics.ack(message);
        metrics.close();
        resolve(content);
      }
    });
  });
  return promise;
};

export const consumePullsMetrics = async () => {
  const metrics = await server.getChannels().connection.createChannel();
  metrics.assertQueue("PULLS_METRICS");
  const promise = new Promise((resolve) => {
    metrics.consume("PULLS_METRICS", (message) => {
      const content = JSON.parse(message.content.toString());
      if (content.type === "METRICS") {
        metrics.ack(message);
        metrics.close();
        resolve(content);
      }
    });
  });
  return promise;
};

export const sendMessage = (
  channel: Channel,
  queueName: string,
  body: { username: string; orgName: string }
) => {
  channel.sendToQueue(
    queueName,
    Buffer.from(
      JSON.stringify({
        type: "GET_METRICS",
        ...body,
      })
    )
  );
};

export const processResponse = (
  organizationName: string,
  username: string,
  commits: any,
  pulls: any,
  issues: any
) => {
  let resultObject: any = {
    username,
    organization: organizationName,
  };
  const { commitCount = 0 } = commits;
  const { closedPrs = 0 } = pulls;
  const { openedIssues = 0, closedIssues = 0 } = issues;
  resultObject = {
    ...resultObject,
    commitCount,
    closedPrs,
    openedIssues,
    closedIssues,
  };
  return resultObject;
};
