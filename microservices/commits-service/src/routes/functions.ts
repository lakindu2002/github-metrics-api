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
  const { organizationName, repoName } = req.params;
  const commits = await getCommitsInRepoInOrg(repoName, organizationName);
  const groupedByAuthor = groupBy(commits, (commit) => commit.authorId);

  // TODO: Save per each author for the repo
  return res.json({ message: "CREATED", commits: groupedByAuthor });
};
