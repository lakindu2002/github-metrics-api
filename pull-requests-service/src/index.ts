import server from "@pulls/server";

const port = (process.env.PORT as unknown as number) || 3003;

server.startServer(port);
