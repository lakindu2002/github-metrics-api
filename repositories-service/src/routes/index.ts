import { Router } from "express";
import { getHome, health, getRepositoriesPerOrganization } from "./functions";

const routes = Router();

routes.get("/", getHome);
routes.get("/health", health);
routes.get("/repositories/:organizationName", getRepositoriesPerOrganization);

export default routes;
