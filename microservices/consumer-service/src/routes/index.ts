import { Router } from "express";
import {
  getHome,
  health,
  getDeveloperProductivityByGithubUsername,
} from "./functions";

const routes = Router();

routes.get("/", getHome);
routes.get("/health", health);
routes.get(
  "/productivity/:username",
  getDeveloperProductivityByGithubUsername
);

export default routes;
