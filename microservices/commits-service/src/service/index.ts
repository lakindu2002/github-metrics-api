import { Commit } from "@commits/types";
import axios from "axios";

export const getCommitsInRepoInOrg = async (
  repoName: string,
  organizationName: string
): Promise<Commit[]> => {
  const commitsUrl = `https://api.github.com/repos/${organizationName}/${repoName}/commits`;
  const allCommits: Commit[] = [];
  let page = 1;

  while (true) {
    try {
      const response = await axios.get<Commit[]>(commitsUrl, {
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
      break;
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
