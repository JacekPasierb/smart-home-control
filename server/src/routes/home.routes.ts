import {Router, Response, NextFunction} from "express";
import {getHomeState, setAlarmArmed} from "../store/homeStore";
import {authRequired, AuthRequest} from "../auth/auth.middleware";
import {canAccessHome} from "../auth/homeAccess";

export const homeRouter = Router();

const homeAccessGuard = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const homeId = req.params.homeId as string;

  if (!req.user || !canAccessHome(req.user, homeId)) {
    return res.status(403).json({error: "Forbidden"});
  }

  return next();
};

homeRouter.get(
  "/:homeId/state",
  authRequired,
  homeAccessGuard,
  (req: AuthRequest, res: Response) => {
    const homeId = req.params.homeId as string;
    res.json(getHomeState(homeId));
  }
);

homeRouter.patch(
  "/:homeId/security/alarm",
  authRequired,
  homeAccessGuard,
  (req: AuthRequest, res: Response) => {
    const homeId = req.params.homeId as string;
    const {armed} = req.body as {armed?: boolean};

    if (typeof armed !== "boolean") {
      return res.status(400).json({error: "armed must be boolean"});
    }

    const nextState = setAlarmArmed(homeId, armed);
    res.json(nextState);
  }
);
