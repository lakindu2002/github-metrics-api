import routes from "@issues/routes";
import express from "express";
import amqp from "amqplib";

export class Server {
  private server: express.Express;
  private issuesChannel: amqp.Channel;
  private consumerChannel: amqp.Channel;

  constructor() {
    this.server = express();
    this.addMiddleware();
    this.addRoutes();
  }

  getChannels() {
    return {
      issues: this.issuesChannel,
      consumer: this.consumerChannel,
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
    const connection = await amqp.connect(amqpServer);
    this.issuesChannel = await connection.createChannel();
    this.consumerChannel = await connection.createChannel();

    await this.issuesChannel.assertQueue("ISSUES");
    await this.consumerChannel.assertQueue("CONSUMER");
  }

  startServer(port: number = (process.env.PORT as unknown as number) || 3002) {
    // start the Express server
    this.server.listen(port, () => {
      console.log(`server started at http://localhost:${port}`);
    });
  }
}

export default new Server();
