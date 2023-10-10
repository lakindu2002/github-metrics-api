import server from "@scheduler/server";
import { Repository } from "@scheduler/types";

export const pushScheduleJob = (orgName: string) => {
  server.getChannels().repos.sendToQueue(
    "REPOS",
    Buffer.from(
      JSON.stringify({
        organization: orgName,
        type: "GET_REPOS_PER_ORG",
      })
    )
  );
  console.log("SENDING SCHEDULE TO REPOS QUEUE");
};

export const onReposRecieved = (
  repositories: Repository[],
  orgName: string
) => {
  console.log("ABOUT TO PUSH TO TOPICS");
  console.log(`REPOS - ${repositories.length}`);
  console.log(`ORG - ${orgName}`);
  repositories.forEach((repo) => {
    const { name } = repo;
    server.getChannels().issues.sendToQueue(
      "ISSUES",
      Buffer.from(
        JSON.stringify({
          name,
          orgName,
          type: "COMPILE_ISSUES",
        })
      )
    );

    console.log("SENDING TO ISSUES QUEUE");

    server.getChannels().issues.sendToQueue(
      "PULLS",
      Buffer.from(
        JSON.stringify({
          name,
          orgName,
          type: "COMPILE_PULLS",
        })
      )
    );

    console.log("SENDING TO PULLS QUEUE");

    server.getChannels().issues.sendToQueue(
      "COMMITS",
      Buffer.from(
        JSON.stringify({
          name,
          orgName,
          type: "COMPILE_COMMITS",
        })
      )
    );

    console.log("SENDING TO COMMITS QUEUE");
  });
};
