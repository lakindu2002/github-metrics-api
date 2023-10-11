import routes from "../routes";
import express from "express";
import amqp from "amqplib";

export class Server {
  private server: express.Express;
  private commitsChannel: amqp.Channel;
  private commitsMetrics: amqp.Channel;

  constructor() {
    this.server = express();
    this.addMiddleware();
    this.addRoutes();
  }

  getChannels() {
    return {
      commits: this.commitsChannel,
      metrics: this.commitsMetrics,
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
    this.commitsChannel = await connection.createChannel();
    this.commitsMetrics = await connection.createChannel();

    await this.commitsChannel.assertQueue("COMMITS");
    await this.commitsMetrics.assertQueue("COMMITS_METRICS");
  }

  startServer(port: number = (process.env.PORT as unknown as number) || 3002) {
    // start the Express server
    this.server.listen(port, () => {
      console.log(`server started at http://localhost:${port}`);
    });
  }
}

export default new Server();
