import { Repository } from "@repositories/types";
import axios from "axios";

export const getReposPerOrg = async (
  orgName: string
): Promise<Repository[]> => {
  const apiRoute = `https://api.github.com/orgs/${orgName}/repos?type=all&sort=updated&per_page=100`;
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
    return [];
  }
};
