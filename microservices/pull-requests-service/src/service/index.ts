import { Pull } from "@pulls/types";
import axios from "axios";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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
    } catch (err) {
      console.error(`Error: ${err.message}`);

      if (err.response && err.response.status === 403) {
        // GitHub API rate limit exceeded, implement exponential backoff
        const resetTime = err.response.headers["x-ratelimit-reset"];
        if (!resetTime || resetTime === null) {
          console.log("Unknown rate limit error. Waiting for 60 seconds...");
          await wait(60000); // Wait for 60 seconds
        } else {
          const resetTimestamp = parseInt(resetTime, 10) * 1000; // Convert to milliseconds
          const currentTime = new Date().getTime();
          const waitTime = Math.max(0, resetTimestamp - currentTime);
          console.log(
            `Rate limit exceeded. Waiting for ${waitTime / 1000} seconds...`
          );
          await wait(waitTime);
        }
      } else {
        break; // Break for other errors
      }
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
