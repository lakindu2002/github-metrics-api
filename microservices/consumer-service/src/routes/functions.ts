import server from "@consumer/server";
import { Channel, ConsumeMessage } from "amqplib";
import axios from "axios";
import { Request, Response } from "express";

export const getHome = (_req: Request, resp: Response) => {
  return resp.json({ message: "hello from schedule service!" });
};

export const health = (_req: Request, res: Response) => {
  res.json({ status: "HEALTHY" });
};

export const ping = async (_req: Request, res: Response) => {
  await axios.get("http://google.lk");
  res.json({ status: "HEALTHY" });
};

export const getProductivityPerUsernameInOrg = async (
  req: Request,
  res: Response
) => {
  const { username, organizationName } = req.params;

  const numResponsesExpected = 3;
  let responsesReceived = 0;
  const allResponses: any = [];

  const handleResponse = (msg: ConsumeMessage) => {
    const response = JSON.parse(msg.content.toString());
    responsesReceived++;
    console.log("RESPONSE - ", response, responsesReceived);
    allResponses.push(response);

    if (responsesReceived === numResponsesExpected) {
      console.log("ALL RESPONSES RECEIVED", allResponses);
      res.json({ status: "HEALTHY", responses: allResponses });
    }
  };

  server.getChannels().consumer.consume("CONSUMER", handleResponse, {
    noAck: true,
  });

  const sendMessage = async (channel: Channel, queueName: string) => {
    channel.sendToQueue(
      queueName,
      Buffer.from(
        JSON.stringify({
          type: "GET_METRICS",
          username,
          orgName: organizationName,
        })
      ),
      {
        replyTo: "CONSUMER",
      }
    );
  };

  // Send messages to different queues
  const { commits, issues, pulls } = server.getChannels();
  await sendMessage(commits, "COMMITS");
  await sendMessage(issues, "ISSUES");
  await sendMessage(pulls, "PULLS");

  console.log("MESSAGES SENT AND AWAITING RESPONSES");
};
