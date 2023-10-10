import { Router } from "express";
import {
  getHome,
  getProductivityPerUsernameInOrg,
  health,
  ping,
} from "./functions";

const routes = Router();

routes.get("/", getHome);
routes.get("/health", health);
routes.get("/ping", ping);
routes.get(
  "/productivity/:organizationName/:username",
  getProductivityPerUsernameInOrg
);

export default routes;
