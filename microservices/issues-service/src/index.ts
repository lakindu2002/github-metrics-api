import server from "@issues/server";

require("dotenv").config();

const port = (process.env.PORT as unknown as number) || 3004;

server.startServer(port);
