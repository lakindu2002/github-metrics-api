export type Pull = {
  url: string;
  id: string;
  node_id: string;
  state: "closed";
  user: {
    login: string;
    id: string;
    node_id: string;
  };
  userId: string;
};

export type PullStat = {
  pk: string;
  closedPrs: number;
  organizationName: string;
  repoName: string;
  username: string;
};
