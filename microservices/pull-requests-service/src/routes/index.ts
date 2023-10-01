import { Router } from "express";
import {
  getHome,
  health,
  createClosedPullRequestsPerUserInRepoInOrg,
  getPRSummaryPerUsername,
} from "./functions";

const routes = Router();

routes.get("/", getHome);
routes.get("/health", health);
routes.post(
  "/pulls/:organizationName/:repoName",
  createClosedPullRequestsPerUserInRepoInOrg
);
routes.get("/pulls/:organizationName/:username", getPRSummaryPerUsername);
export default routes;
