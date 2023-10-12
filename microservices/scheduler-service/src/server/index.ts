import routes from "@scheduler/routes";
import express from "express";
import amqp from "amqplib";

export class Server {
  private server: express.Express;
  private reposChannel: amqp.Channel;
  private pullsChannel: amqp.Channel;
  private commitsChannel: amqp.Channel;
  private issuesChannel: amqp.Channel;

  constructor() {
    this.server = express();
    this.addMiddleware();
    this.addRoutes();
  }

  getChannels() {
    return {
      repos: this.reposChannel,
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
    console.log("CONNECTION URL: " + amqpServer);
    const connection = await amqp.connect(amqpServer);
    this.reposChannel = await connection.createChannel();
    this.pullsChannel = await connection.createChannel();
    this.commitsChannel = await connection.createChannel();
    this.issuesChannel = await connection.createChannel();

    await this.reposChannel.assertQueue("REPOS");
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
