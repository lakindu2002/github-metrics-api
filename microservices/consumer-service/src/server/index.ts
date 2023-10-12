import routes from "@consumer/routes";
import express from "express";
import amqp from "amqplib";

export class Server {
  private server: express.Express;
  private connection: amqp.Connection;

  constructor() {
    this.server = express();
    this.addMiddleware();
    this.addRoutes();
  }

  getChannels() {
    return {
      connection: this.connection,
    };
  }

  addMiddleware() {
    this.server.use(express.json());
  }

  addRoutes() {
    this.server.use(routes);
  }

  getServer() {
    return this.server;
  }

  async startRabbitMq() {
    const amqpServer = process.env.RABBITMQ_URL;
    console.log("CONNECTION URL: " + amqpServer);
    this.connection = await amqp.connect(amqpServer);
  }

  startServer(port: number = (process.env.PORT as unknown as number) || 3001) {
    // start the Express server
    this.server.listen(port, () => {
      console.log(`server started at http://localhost:${port}`);
    });
  }
}

export default new Server();
