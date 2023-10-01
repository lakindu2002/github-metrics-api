import { createClosedPullRequestsPerUserInRepo } from "@pulls/service";
import { Request, Response } from "express";
import { groupBy } from "lodash";

export const getHome = (_req: Request, resp: Response) => {
  return resp.json({ message: "hello world!" });
};

export const health = (_req: Request, res: Response) => {
  res.json({ status: "HEALTHY" });
};

export const createClosedPullRequestsPerUserInRepoInOrg = async (
  req: Request,
  res: Response
) => {
  const { organizationName, repoName } = req.params;

  const pulls = await createClosedPullRequestsPerUserInRepo(
    organizationName,
    repoName
  );

  const groupedPulls = groupBy(pulls, (pull) => pull.userId);
  // TODO: Save per each author for the repo
  return res.json({ message: "CREATED", pulls: groupedPulls });
};
