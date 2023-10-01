import { Router } from "express";
import { getHome, health, createCommitsPerUserInRepoInOrg } from "./functions";

const routes = Router();

routes.get("/", getHome);
routes.get("/health", health);
routes.post(
  "/commits/:organizationName/:repoName",
  createCommitsPerUserInRepoInOrg
);

export default routes;
