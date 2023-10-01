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
  const { organizationName, repoName } = req.params;
  const issues = await getOpenClosedIssuesInRepo(organizationName, repoName);

  const groupedIssuesByStatus = groupBy(issues, (issue) => issue.state);

  const opened = groupedIssuesByStatus.open;
  const closed = groupedIssuesByStatus.closed;

  // TODO: Add stats of the issues.
  res.json({ issues: groupedIssuesByStatus });
};
