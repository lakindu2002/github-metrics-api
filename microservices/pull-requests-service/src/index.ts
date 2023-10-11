import server from "@pulls/server";
import { handleCompilePulls, handleGetPrSummaryByUsername } from "./service";

require("dotenv").config();

const port = (process.env.PORT as unknown as number) || 3003;

setTimeout(() => {
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
          handleGetPrSummaryByUsername(username, orgName)
            .then(() => {
              console.log("PUSHED PULLS TO CONSUMER ");
            })
            .catch((err) => {
              console.log("FAILED TO PUSH PULLS TO CONSUMER", err);
            });
        }
        server.getChannels().pulls.ack(message);
      });
    })
    .catch(() => {
      console.log("FAILED TO START RABBIT MQ IN PR SERVICE");
    });
}, 10000);

server.startServer(port);
