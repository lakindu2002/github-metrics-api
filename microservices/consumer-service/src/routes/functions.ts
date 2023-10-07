import { CommitStat, IssueStat, PullStat } from "@consumer/types";
import { HOST_NAME, PORTS } from "@consumer/utils";
import axios from "axios";
import { Request, Response } from "express";

export const getHome = (_req: Request, resp: Response) => {
  return resp.json({ message: "hello world!" });
};

export const health = (_req: Request, res: Response) => {
  res.json({ status: "HEALTHY" });
};

export const getDeveloperProductivityByGithubUsername = async (
  req: Request,
  res: Response
) => {
  const { username } = req.params;
  const orgName = process.env.ORG_NAME;

  const [commitResp, issueResp, pullResp] = await Promise.all([
    axios.get<{ commits: CommitStat }>(
      `${HOST_NAME}:${PORTS.commits}/commits/${orgName}/${username}`
    ),
    axios.get<{ issues: IssueStat }>(
      `${HOST_NAME}:${PORTS.issues}/issues/${orgName}/${username}`
    ),
    axios.get<{ pulls: PullStat }>(
      `${HOST_NAME}:${PORTS.pulls}/pulls/${orgName}/${username}`
    ),
  ]);

  const { commitCount = 0 } = commitResp.data?.commits || {};
  const { closedIssues = 0, openedIssues = 0 } = issueResp.data?.issues || {};
  const { closedPrs = 0 } = pullResp.data?.pulls || {};

  const productivity = {
    username,
    commitCount,
    closedIssues,
    openedIssues,
    closedPrs,
    orgName,
  };

  res.json({ productivity });
};
