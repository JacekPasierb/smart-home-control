import {Router} from "express";

export const homeRouter = Router();

homeRouter.get("/:homeId/state", (req, res) => {
  const {homeId} = req.params;

  res.json({
    homeId,
    updatedAt: Date.now(),
    sensors: {
      temp_fridge: {
        name: "Lodówka",
        value: 4.2,
        unit: "°C",
        online: true,
        lastSeen: Date.now(),
      },
      temp_balcony: {
        name: "Balkon",
        value: -1.3,
        unit: "°C",
        online: true,
        lastSeen: Date.now(),
      },
      temp_room: {
        name: "Pokój",
        value: 21.5,
        unit: "°C",
        online: true,
        lastSeen: Date.now(),
      },
      humidity_room: {
        name: "Wilgotność",
        value: 45,
        unit: "%",
        online: true,
        lastSeen: Date.now(),
      },
      power_total: {
        name: "Pobór mocy",
        value: 320,
        unit: "W",
        online: true,
        lastSeen: Date.now(),
      },
    },
    security: {
      door_main: {
        name: "Drzwi wejściowe",
        state: "closed",
        online: true,
        lastSeen: Date.now(),
      },
      alarm: {armed: false, triggered: false},
    },
    alerts: [],
  });
});
