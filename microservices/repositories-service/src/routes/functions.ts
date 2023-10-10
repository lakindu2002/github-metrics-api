import axios from "axios";
import { Request, Response } from "express";

export const getHome = (_req: Request, resp: Response) => {
  return resp.json({ message: "hello from repos service!" });
};

export const health = (_req: Request, res: Response) => {
  res.json({ status: "HEALTHY" });
};

export const ping = async (_req: Request, res: Response) => {
  await axios.get("http://google.lk");
  res.json({ status: "HEALTHY" });
};
