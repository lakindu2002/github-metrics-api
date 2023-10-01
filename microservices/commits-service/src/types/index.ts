export type Commit = {
  sha: string;
  node_id: string;
  commit: {
    author: {
      name: string;
      email: string;
      date: string;
    };
  };
  author: {
    login: string;
    id: string;
    avatar_url: string;
  };
  authorId: string;
};

export type CommitStat = {
  pk: string;
  commitCount: number;
  organizationName: string;
  repoName: string;
  username: string;
};
