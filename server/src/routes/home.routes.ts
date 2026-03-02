import {Router} from "express";
import {getHomeState, setAlarmArmed} from "../store/homeStore";
import { authRequired, AuthRequest } from "../auth/auth.middleware";

export const homeRouter = Router();

homeRouter.get(
  "/:homeId/state",
  authRequired,
  (req: AuthRequest & {params: {homeId: string}}, res) => {
    const {homeId} = req.params;
    res.json(getHomeState(homeId));
  }
);

homeRouter.patch(
  "/:homeId/security/alarm",
  authRequired,
  (req: AuthRequest & {params: {homeId: string}}, res) => {
    const {homeId} = req.params;
    const {armed} = req.body as {armed?: boolean};

    if (typeof armed !== "boolean") {
      return res.status(400).json({error: "armed must be boolean"});
    }

    const next = setAlarmArmed(homeId, armed);
    res.json(next);
  }
);