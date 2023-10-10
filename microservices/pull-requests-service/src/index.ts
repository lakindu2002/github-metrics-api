import server from "@pulls/server";
import { handleCompilePulls, handleGetPrSummaryByUsername } from "./service";

require("dotenv").config();

const port = (process.env.PORT as unknown as number) || 3003;

server
  .startRabbitMq()
  .then(() => {
    console.log("STARTED RABBIT MQ IN PR SERVICE");
    server.getChannels().pulls.consume("PULLS", (message) => {
      const { type, name, orgName, username } = JSON.parse(
        message.content.toString()
      );
      if (type === "COMPILE_PULLS") {
        handleCompilePulls(name, orgName);
      } else if (type === "GET_METRICS") {
        const {
          properties: { replyTo },
        } = message;

        handleGetPrSummaryByUsername(username, orgName, replyTo)
          .then(() => {
            console.log("PUSHED PULLS TO CONSUMER ");
          })
          .catch((err) => {
            console.log("FAILED TO PUSH PULLS TO CONSUMER", err);
          });
      }
    });
  })
  .catch(() => {
    console.log("FAILED TO START RABBIT MQ IN PR SERVICE");
  });

server.startServer(port);
