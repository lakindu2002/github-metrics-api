import cron from "node-cron";
import server from "@scheduler/server";
import { Repository } from "./types";
import { onReposRecieved, pushScheduleJob } from "./utils";

require("dotenv").config();

const port = (process.env.PORT as unknown as number) || 3001;
const orgName = process.env.ORG_NAME;

cron.schedule("0/15 * * * * *", (): void => {
  console.log("COMMENCING SCHEDULE");
  pushScheduleJob(orgName);
});

server
  .startRabbitMq()
  .then(() => {
    console.log("MQ CONNECTED FOR SCHEDULER SERVICE");

    server.getChannels().repos.consume("REPOS", (message) => {
      const { repos, type } = JSON.parse(message.content.toString()) as {
        type: string;
        repos: Repository[];
      };
      console.log("RESPONSE RECIEVD FROM REPO SERVICE", { type });

      if (type === "REPOS_PER_ORG") {
        onReposRecieved(repos, orgName);
      }
    });
  })
  .catch(() => {
    console.log("FAILED TO START RABBIT MQ FOR SCHEDULER SERVICE");
  });

console.log("SCHEDULE CREATED");

server.startServer(port);
