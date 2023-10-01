import routes from "@scheduler/routes";
import express from "express";

export class Server {
  private server: express.Express;

  constructor() {
    this.server = express();
    this.addMiddleware();
    this.addRoutes();
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

  startServer(port: number = (process.env.PORT as unknown as number) || 3001) {
    // start the Express server
    this.server.listen(port, () => {
      console.log(`server started at http://localhost:${port}`);
    });
  }
}

export default new Server();
