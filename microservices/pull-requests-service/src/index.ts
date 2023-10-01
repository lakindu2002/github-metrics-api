import server from "@pulls/server";

require("dotenv").config();

const port = (process.env.PORT as unknown as number) || 3003;

server.startServer(port);
