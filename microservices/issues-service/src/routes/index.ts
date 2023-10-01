import { Router } from "express";
import {
  getHome,
  health,
  createNumberOfIssuesAssignedPerUserInRepo,
  getIssuesSummaryPerUsername,
} from "./functions";

const routes = Router();

routes.get("/", getHome);
routes.get("/health", health);
routes.post(
  "/issues/:organizationName/:repoName",
  createNumberOfIssuesAssignedPerUserInRepo
);
routes.get("/issues/:organizationName/:username", getIssuesSummaryPerUsername);
export default routes;
