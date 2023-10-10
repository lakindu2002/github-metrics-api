import routes from "@consumer/routes";
import express from "express";
import amqp from "amqplib";

export class Server {
  private server: express.Express;
  private pullsChannel: amqp.Channel;
  private commitsChannel: amqp.Channel;
  private issuesChannel: amqp.Channel;
  private consumerChannel: amqp.Channel;

  constructor() {
    this.server = express();
    this.addMiddleware();
    this.addRoutes();
  }

  getChannels() {
    return {
      consumer: this.consumerChannel,
      pulls: this.pullsChannel,
      commits: this.commitsChannel,
      issues: this.issuesChannel,
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
    this.consumerChannel = await connection.createChannel();
    this.pullsChannel = await connection.createChannel();
    this.commitsChannel = await connection.createChannel();
    this.issuesChannel = await connection.createChannel();

    await this.consumerChannel.assertQueue("CONSUMER");
    await this.pullsChannel.assertQueue("PULLS");
    await this.commitsChannel.assertQueue("COMMITS");
    await this.issuesChannel.assertQueue("ISSUES");
  }

  startServer(port: number = (process.env.PORT as unknown as number) || 3001) {
    // start the Express server
    this.server.listen(port, () => {
      console.log(`server started at http://localhost:${port}`);
    });
  }
}

export default new Server();
