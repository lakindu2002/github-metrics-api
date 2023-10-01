export type CommitStat = {
  pk: string;
  commitCount: number;
  organizationName: string;
  repoName: string;
  username: string;
};

export type IssueStat = {
  pk: string;
  closedIssues: number;
  openedIssues: number;
  organizationName: string;
  repoName: string;
  username: string;
};

export type PullStat = {
  pk: string;
  closedPrs: number;
  organizationName: string;
  repoName: string;
  username: string;
};
