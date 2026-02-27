export type Alert = {
  id: string;
  type: "TEMP_FRIDGE_HIGH" | "DOOR_OPEN_TOO_LONG";
  message: string;
  severity: "info" | "warning" | "critical";
  createdAt: number;
};

export type Sensor = {
  name: string;
  value: number;
  unit: string;
  online: boolean;
  lastSeen: number;
};

export type Door = {
  name: string;
  state: "open" | "closed";
  online: boolean;
  lastSeen: number;
};

export type Alarm = {
  armed: boolean;
  triggered: boolean;
};

export type HomeState = {
  homeId: string;
  updatedAt: number;
  sensors: Record<string, Sensor>;
  security: {
    door_main: Door;
    alarm: Alarm;
  };
  alerts: Alert[];
};
