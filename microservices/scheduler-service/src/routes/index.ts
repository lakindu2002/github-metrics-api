import { Router } from "express";
import { getHome, health, ping } from "./functions";

const routes = Router();

routes.get("/", getHome);
routes.get("/health", health);
routes.get("/ping", ping);

export default routes;
