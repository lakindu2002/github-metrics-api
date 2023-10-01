import { Request, Response } from "express";
import { getReposPerOrg } from "@repositories/service";

export const getHome = (_req: Request, resp: Response) => {
  return resp.json({ message: "hello world!" });
};

export const health = (_req: Request, res: Response) => {
  res.json({ status: "HEALTHY" });
};

export const getRepositoriesPerOrganization = async (
  req: Request,
  res: Response
) => {
  const { organizationName } = req.params;
  const repos = await getReposPerOrg(organizationName);
  return res.json({ repos });
};
