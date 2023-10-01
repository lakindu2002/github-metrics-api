import { Router } from "express";
import { getHome, health, createClosedPullRequestsPerUserInRepoInOrg } from "./functions";

const routes = Router();

routes.get("/", getHome);
routes.get("/health", health);
routes.post(
  "/pulls/:organizationName/:repoName",
  createClosedPullRequestsPerUserInRepoInOrg
);

export default routes;
