import server from "@repositories/server";
import { Repository } from "@repositories/types";
import axios from "axios";

export const getReposPerOrg = async (
  orgName: string
): Promise<Repository[]> => {
  const apiRoute = `http://api.github.com/orgs/${orgName}/repos?type=all&sort=updated&per_page=100`;
  try {
    const resp = await axios.get<Repository[]>(apiRoute);
    return (resp.data as Repository[]).map((item) => ({
      full_name: item.full_name,
      id: item.id,
      name: item.name,
      node_id: item.node_id,
      private: item.private,
    }));
  } catch (err) {
    console.log("ERROR FETCHING REPOS", err);
    return [];
  }
};

export const handleGetReposPerOrg = (organizationName: string) => {
  getReposPerOrg(organizationName).then((repos) => {
    server
      .getChannels()
      .repos.sendToQueue(
        "REPOS",
        Buffer.from(JSON.stringify({ repos, type: "REPOS_PER_ORG" }))
      );

    console.log("PUSHED REPOS TO TOPIC");
  });
};
