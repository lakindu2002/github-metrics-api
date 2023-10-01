import axios from "axios";
import { HOST_NAME, PORTS } from "@scheduler/utils";
import { Request, Response } from "express";
import { Repository } from "@scheduler/types";

export const getHome = (_req: Request, resp: Response) => {
  return resp.json({ message: "hello world!" });
};

export const health = (_req: Request, res: Response) => {
  res.json({ status: "HEALTHY" });
};

export const commenceSchedule = async (_req: Request, res: Response) => {
  const orgName = process.env.ORG_NAME;
  const repositoryUrl = `${HOST_NAME}:${PORTS.repository}/repositories/${orgName}`;

  // GET Repos Per Org
  const resp = await axios.get<{ repos: Repository[] }>(repositoryUrl);
  const { repos } = resp.data;

  const promises = repos.map(async (repo) => {
    const { name } = repo;

    const issuesUrl = `${HOST_NAME}:${PORTS.issues}/issues/${orgName}/${name}`;
    const pullsUrl = `${HOST_NAME}:${PORTS.pulls}/pulls/${orgName}/${name}`;
    const commitsUrl = `${HOST_NAME}:${PORTS.commits}/commits/${orgName}/${name}`;

    await Promise.all([
      axios.post(issuesUrl),
      axios.post(pullsUrl),
      axios.post(commitsUrl),
    ]);
  });
  await Promise.all(promises);

  res.json({ status: "COMMENCED" });
};
