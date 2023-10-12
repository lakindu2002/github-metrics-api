import routes from "@repositories/routes";
import express from "express";
import amqp from "amqplib";

export class Server {
  private server: express.Express;
  private reposChannel: amqp.Channel;

  constructor() {
    this.server = express();
    this.addMiddleware();
    this.addRoutes();
  }

  getChannels() {
    return {
      repos: this.reposChannel,
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
    const connection = await amqp.connect(amqpServer);
    this.reposChannel = await connection.createChannel();

    await this.reposChannel.assertQueue("REPOS");
  }

  startServer(port: number = (process.env.PORT as unknown as number) || 3000) {
    // start the Express server
    this.server.listen(port, () => {
      console.log(`server started at http://localhost:${port}`);
    });
  }
}

export default new Server();
