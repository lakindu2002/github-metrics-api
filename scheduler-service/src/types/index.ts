export type Repository = {
  id: string;
  node_id: string;
  /**
   * org/repoName
   */
  full_name: string;
  name: string;
  private: boolean;
};
