import { Router } from "express";
import {
  getHome,
  health,
  createNumberOfIssuesAssignedPerUserInRepo,
} from "./functions";

const routes = Router();

routes.get("/", getHome);
routes.get("/health", health);
routes.post(
  "/issues/:organizationName/:repoName",
  createNumberOfIssuesAssignedPerUserInRepo
);

export default routes;
