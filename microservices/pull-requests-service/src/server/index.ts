import routes from "@pulls/routes";
import express from "express";
import amqp from "amqplib";

export class Server {
  private server: express.Express;
  private pullsChannel: amqp.Channel;
  private consumerChannel: amqp.Channel;

  constructor() {
    this.server = express();
    this.addMiddleware();
    this.addRoutes();
  }

  getChannels() {
    return {
      pulls: this.pullsChannel,
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
    this.pullsChannel = await connection.createChannel();
    this.consumerChannel = await connection.createChannel();

    await this.pullsChannel.assertQueue("PULLS");
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
