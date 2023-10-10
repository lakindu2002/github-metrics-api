import server from "@consumer/server";

require("dotenv").config();

const port = (process.env.PORT as unknown as number) || 3006;

server
  .startRabbitMq()
  .then(() => {
    console.log("STARTED RABBIT MQ IN CONSUMER");
  })
  .catch(() => {
    console.log("FAILED TO START RABBIT MQ IN CONSUMER");
  });

server.startServer(port);
