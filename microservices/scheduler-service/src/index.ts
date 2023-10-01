import cron from "node-cron";
import server from "@scheduler/server";
import axios from "axios";

require("dotenv").config();

const port = (process.env.PORT as unknown as number) || 3001;

cron.schedule("1 0 * * *", async () => {
  console.log("COMMENCING SCHEDULE");
  await axios.post(`http://127.0.0.1:${port}/schedule`);
});

console.log("SCHEDULE CREATED");

server.startServer(port);
