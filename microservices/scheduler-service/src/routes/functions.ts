import axios from "axios";
import { HOST_NAME, PORTS } from "@scheduler/utils";
import { Request, Response } from "express";
import { Repository } from "@scheduler/types";

export const getHome = (_req: Request, resp: Response) => {
  return resp.json({ message: "hello from schedule service!" });
};

export const health = (_req: Request, res: Response) => {
  res.json({ status: "HEALTHY" });
};

export const commenceSchedule = async (_req: Request, res: Response) => {
  console.log("COMMENCING SCHEDULE");
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

    const [issuesResp, pullsResp, commitsResp] = await Promise.all([
      axios.post(issuesUrl),
      axios.post(pullsUrl),
      axios.post(commitsUrl),
    ]);

    const issues = issuesResp.data;
    const pulls = pullsResp.data;
    const commits = commitsResp.data;

    console.log({ issues, pulls, commits, time: Date.now() });
  });
  await Promise.all(promises);

  res.json({ status: "COMPLETED" });
};
