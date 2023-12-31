import server from "@consumer/server";

require("dotenv").config();

const port = (process.env.PORT as unknown as number) || 3006;

setTimeout(() => {
  server
    .startRabbitMq()
    .then(() => {
      console.log("STARTED RABBIT MQ IN CONSUMER");
    })
    .catch(() => {
      console.log("FAILED TO START RABBIT MQ IN CONSUMER");
    });
}, (process.env.MQ_TIMER as unknown as number) || 10000);

server.startServer(port);
