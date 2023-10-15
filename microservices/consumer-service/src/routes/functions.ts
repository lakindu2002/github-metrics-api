import server from "@consumer/server";
import axios from "axios";
import { Request, Response, response } from "express";
import {
  consumeCommitsMetrics,
  consumeIssuesMetrics,
  consumePullsMetrics,
  processResponse,
  sendMessage,
} from "@consumer/utils";

export const getHome = (_req: Request, resp: Response) => {
  return resp.json({ message: "hello from consumer service!" });
};

export const health = (_req: Request, res: Response) => {
  res.json({ status: "HEALTHY" });
};

export const ping = async (_req: Request, res: Response) => {
  await axios.get("http://google.lk");
  res.json({ status: "HEALTHY" });
};

export const getProductivityPerUsernameInOrg = async (
  req: Request,
  res: Response
) => {
  const { username, organizationName } = req.params;

  const { connection } = server.getChannels();

  const commits = await connection.createChannel();
  await commits.assertQueue("COMMITS");

  const issues = await connection.createChannel();
  await issues.assertQueue("ISSUES");

  const pulls = await connection.createChannel();
  await pulls.assertQueue("PULLS");

  sendMessage(commits, "COMMITS", {
    username,
    orgName: organizationName,
  });
  sendMessage(issues, "ISSUES", {
    username,
    orgName: organizationName,
  });
  sendMessage(pulls, "PULLS", {
    username,
    orgName: organizationName,
  });

  const [commitsMetrics, issuesMetrics, pullMetrics] = await Promise.all([
    consumeCommitsMetrics(),
    consumeIssuesMetrics(),
    consumePullsMetrics(),
  ]);
  await commits.close();
  await issues.close();
  await pulls.close();

  const response = processResponse(
    organizationName,
    username,
    (commitsMetrics as any).commits,
    (pullMetrics as any).pulls,
    (issuesMetrics as any).issues
  );

  res.json({ productivity: response });
};
