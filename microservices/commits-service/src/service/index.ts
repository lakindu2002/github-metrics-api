import { Commit } from "../types";
import axios from "axios";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const getCommitsInRepoInOrg = async (
  repoName: string,
  organizationName: string
): Promise<Commit[]> => {
  const commitsUrl = `https://api.github.com/repos/${organizationName}/${repoName}/commits`;
  const allCommits: Commit[] = [];
  let page = 1;

  while (true) {
    try {
      const response = await axios.get(commitsUrl, {
        params: { page, per_page: 100 },
      });

      const commits = response.data;
      if (response.status !== 200) {
        console.log(`Error: ${response.status}`);
        break;
      }

      // If the response has commits, add them to the main list
      if (commits.length > 0) {
        allCommits.push(...commits);
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
    }
  }
  return allCommits
    .map((commit) => ({
      author: commit.author,
      commit: commit.commit,
      node_id: commit.node_id,
      sha: commit.sha,
      authorId: commit.author?.login,
    }))
    .filter((commit) => !!commit.authorId);
};
