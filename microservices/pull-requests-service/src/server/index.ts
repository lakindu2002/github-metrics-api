import routes from "@pulls/routes";
import express from "express";
import amqp from "amqplib";

export class Server {
  private server: express.Express;
  private pullsChannel: amqp.Channel;
  private pullsMetricsChannel: amqp.Channel;

  constructor() {
    this.server = express();
    this.addMiddleware();
    this.addRoutes();
  }

  getChannels() {
    return {
      pulls: this.pullsChannel,
      metrics: this.pullsMetricsChannel,
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
    this.pullsChannel = await connection.createChannel();
    this.pullsMetricsChannel = await connection.createChannel();

    await this.pullsChannel.assertQueue("PULLS");
    await this.pullsMetricsChannel.assertQueue("PULLS_METRICS");
  }

  startServer(port: number = (process.env.PORT as unknown as number) || 3002) {
    // start the Express server
    this.server.listen(port, () => {
      console.log(`server started at http://localhost:${port}`);
    });
  }
}

export default new Server();
