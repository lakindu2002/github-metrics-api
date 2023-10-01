import { Router } from "express";
import { commenceSchedule, getHome, health } from "./functions";

const routes = Router();

routes.get("/", getHome);
routes.get("/health", health);
routes.post("/schedule", commenceSchedule);

export default routes;
