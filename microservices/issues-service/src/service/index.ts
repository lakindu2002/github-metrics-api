import { Issue } from "@issues/types";
import axios from "axios";

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
    } catch (error) {
      console.error(JSON.stringify(error));
      console.error(`Error: ${error.message}`);
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
