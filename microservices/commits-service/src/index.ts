import server from "./server";

process.setMaxListeners(0);

require("dotenv").config();

server.startServer();
