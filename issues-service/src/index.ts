import server from "@issues/server";

const port = (process.env.PORT as unknown as number) || 3004;

server.startServer(port);
