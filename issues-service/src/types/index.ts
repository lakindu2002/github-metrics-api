export type Issue = {
  url: string;
  repository_url: string;
  number: number;
  title: string;
  user: {
    login: string;
  };
  assignees: {
    login: string;
  }[];
  state: "open" | "closed";
};
