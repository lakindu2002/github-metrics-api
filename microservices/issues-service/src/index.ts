import server from "@issues/server";
import { handleCompileIssues, handleGetIssuesSummary } from "./service";

require("dotenv").config();

const port = (process.env.PORT as unknown as number) || 3004;

setTimeout(() => {
  server
    .startRabbitMq()
    .then(() => {
      console.log("STARTED RABBIT MQ FOR ISSUES");

      server.getChannels().issues.consume("ISSUES", (message) => {
        const { type, orgName, name, username } = JSON.parse(
          message.content.toString()
        );

        if (type === "COMPILE_ISSUES") {
          handleCompileIssues(orgName, name)
            .then(() => {
              console.log("ISSUES COMPILED");
            })
            .catch((err) => {
              console.log("FAILED TO COMPILE ISSUES");
            });
        } else if (type === "GET_METRICS") {
          handleGetIssuesSummary(orgName, username)
            .then(() => {
              console.log("ISSUES SENT");
            })
            .catch(() => {
              console.log("ISSUES FAILED");
            });
        }
        server.getChannels().issues.ack(message);
      });
    })
    .catch(() => {
      console.log("FAILED TO STARTED RABBIT MQ FOR ISSUES");
    });
}, (process.env.MQ_TIMER as unknown as number) || 10000);

server.startServer(port);
