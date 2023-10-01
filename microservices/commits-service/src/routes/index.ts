import { Router } from "express";
import {
  getHome,
  health,
  createCommitsPerUserInRepoInOrg,
  getCommitsSummaryPerUsername,
} from "./functions";

const routes = Router();

routes.get("/", getHome);
routes.get("/health", health);
routes.post(
  "/commits/:organizationName/:repoName",
  createCommitsPerUserInRepoInOrg
);
routes.get(
  "/commits/:organizationName/:username",
  getCommitsSummaryPerUsername
);

export default routes;
