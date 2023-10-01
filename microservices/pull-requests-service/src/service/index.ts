import { Pull } from "@pulls/types";
import axios from "axios";

export const createClosedPullRequestsPerUserInRepo = async (
  orgName: string,
  repoName: string
): Promise<Pull[]> => {
  const pullRequestsUrl = `https://api.github.com/repos/${orgName}/${repoName}/pulls`;

  const allClosedPullRequests: Pull[] = [];
  let page = 1;

  while (true) {
    try {
      const response = await axios.get<Pull[]>(pullRequestsUrl, {
        params: { state: "closed", page, per_page: 100 },
      });

      if (response.status !== 200) {
        console.error(`Error: ${response.status}`);
        break;
      }

      const closedPullRequests = response.data;

      // If the response has closed pull requests, add them to the main list
      if (closedPullRequests.length > 0) {
        allClosedPullRequests.push(...closedPullRequests);
        page++;
      } else {
        break; // No more pages, exit the loop
      }

      // Check for the Link header for pagination information
      const linkHeader = response.headers.link;
      if (!linkHeader || !linkHeader.includes('rel="next"')) {
        break; // No "next" link in the header, exit the loop
      }
    } catch (error) {
      console.error(`Error: ${error.message}`);
      break;
    }
  }

  return allClosedPullRequests
    .map((pull) => ({
      id: pull.id,
      node_id: pull.node_id,
      state: pull.state,
      url: pull.url,
      user: pull.user,
      userId: pull.user?.login,
    }))
    .filter((pull) => !!pull.userId);
};
