import server from "./server";
import { handleCreateCommits, getCommitSummary } from "./service";

require("dotenv").config();
setTimeout(() => {
  server
    .startRabbitMq()
    .then(() => {
      console.log("STARTED RABBIT MQ FOR COMMITS SERVICE");
      server.getChannels().commits.consume("COMMITS", (message) => {
        const { type, name, orgName, username } = JSON.parse(
          message.content.toString()
        );

        if (type === "COMPILE_COMMITS") {
          handleCreateCommits(orgName, name)
            .then(() => {
              console.log("COMPILED COMMITS");
            })
            .catch(() => {
              console.log("FAILED TO COMPILE COMMITS");
            });
        } else if (type === "GET_METRICS") {
          getCommitSummary(username, orgName)
            .then(() => {
              console.log("COMMITS METRICS SENT");
            })
            .catch((err) => {
              console.log("COMMITS METRICS FAILED");
              console.log(err);
            });
        }

        server.getChannels().commits.ack(message);
      });
    })
    .catch((err) => {
      console.log("FAILED TO START RABBIT MQ FOR COMMITS SERVIE", err);
    });
}, (process.env.MQ_TIMER as unknown as number) || 10000);

server.startServer();
