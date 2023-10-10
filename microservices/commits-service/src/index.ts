import server from "./server";
import { handleCreateCommits, getCommitSummary } from "./service";

require("dotenv").config();

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
        const {
          properties: { replyTo },
        } = message;
        getCommitSummary(username, orgName, replyTo)
          .then(() => {
            console.log("COMMITS METRICS SNT");
          })
          .catch(() => {
            console.log("COMMITS METRICS FAILED");
          });
      }
    });
  })
  .catch((err) => {
    console.log("FAILED TO START RABBIT MQ FOR COMMITS SERVIE", err);
  });

server.startServer();
