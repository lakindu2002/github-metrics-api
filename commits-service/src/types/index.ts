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
