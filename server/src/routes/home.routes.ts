import {Router} from "express";
import {getHomeState} from "../store/homeStore";

export const homeRouter = Router();

homeRouter.get("/:homeId/state", (req, res) => {
  const {homeId} = req.params;
  res.json(getHomeState(homeId));
});
