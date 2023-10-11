import server from "@repositories/server";
import { handleGetReposPerOrg } from "./service";

require("dotenv").config();

setTimeout(() => {
  server
    .startRabbitMq()
    .then(() => {
      console.log("STARTED RABBIT MQ FOR REPO SERVICE");

      server.getChannels().repos.consume("REPOS", (message) => {
        const { organization, type } = JSON.parse(message.content.toString());
        if (type === "GET_REPOS_PER_ORG") {
          console.log("GETTING REPOSITORIES PER ORG", { type });
          handleGetReposPerOrg(organization);
        }
        server.getChannels().repos.ack(message);
      });
    })
    .catch(() => {
      console.log("FAILED TO START RABBIT MQ FOR REPO SERVICE");
    });
}, 10000);

server.startServer();
