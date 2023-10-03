import { Issue } from "@issues/types";
import axios from "axios";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const getOpenClosedIssuesInRepo = async (
  organizationName: string,
  repoName: string
): Promise<Issue[]> => {
  const issuesUrl = `https://api.github.com/repos/${organizationName}/${repoName}/issues`;

  const allIssues: Issue[] = [];
  let page = 1;

  while (true) {
    try {
      const response = await axios.get(issuesUrl, {
        params: {
          state: "all",
          page,
          per_page: 100,
        },
      });

      if (response.status !== 200) {
        console.error(`Error: ${response.status}`);
        break;
      }

      const issues = response.data;

      // If the response has issues, add them to the main list
      if (issues.length > 0) {
        allIssues.push(...issues);
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

  return allIssues.map((issue) => ({
    assignees: issue.assignees.map((assignee) => ({ login: assignee.login })),
    number: issue.number,
    repository_url: issue.repository_url,
    title: issue.title,
    url: issue.url,
    state: issue.state,
    user: {
      login: issue.user.login,
    },
  }));
};
