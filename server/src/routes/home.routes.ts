import {Router} from "express";
import {getHomeState, setAlarmArmed} from "../store/homeStore";

export const homeRouter = Router();

homeRouter.get("/:homeId/state", (req, res) => {
  const {homeId} = req.params;
  res.json(getHomeState(homeId));
});

homeRouter.patch("/:homeId/security/alarm", (req, res) => {
  const {homeId} = req.params;
  const {armed} = req.body as {armed?: boolean};

  if (typeof armed !== "boolean") {
    return res.status(400).json({error: "armed must be boolean"});
  }

  const next = setAlarmArmed(homeId, armed);
  res.json(next);
});