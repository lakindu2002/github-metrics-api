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
