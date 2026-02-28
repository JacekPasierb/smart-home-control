type Sensor = {
  name: string;
  value: number;
  unit: string;
  online: boolean;
  lastSeen: number;
};

type Door = {
  name: string;
  state: "open" | "closed";
  online: boolean;
  lastSeen: number;
};

type Alarm = {
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

export type Alert = {
  id: string;
  type: "TEMP_FRIDGE_HIGH" | "DOOR_OPEN_TOO_LONG";
  message: string;
  severity: "info" | "warning" | "critical";
  createdAt: number;
};

const now = () => Date.now();

function createHomeState(homeId: string): HomeState {
  const ts = now();
  return {
    homeId,
    updatedAt: ts,
    sensors: {
      temp_fridge: {
        name: "Lodówka",
        value: 4.2,
        unit: "°C",
        online: true,
        lastSeen: ts,
      },
      temp_balcony: {
        name: "Balkon",
        value: -1.3,
        unit: "°C",
        online: true,
        lastSeen: ts,
      },
      temp_room: {
        name: "Pokój",
        value: 21.5,
        unit: "°C",
        online: true,
        lastSeen: ts,
      },
      humidity_room: {
        name: "Wilgotność",
        value: 45,
        unit: "%",
        online: true,
        lastSeen: ts,
      },
      power_total: {
        name: "Pobór mocy",
        value: 320,
        unit: "W",
        online: true,
        lastSeen: ts,
      },
    },
    security: {
      door_main: {
        name: "Drzwi wejściowe",
        state: "closed",
        online: true,
        lastSeen: ts,
      },
      alarm: {armed: false, triggered: false},
    },
    alerts: [],
  };
}

// 2 domy na start (łatwo potem dodać więcej)
const homes: Record<string, HomeState> = {
  "123": createHomeState("123"),
  "456": createHomeState("456"),
};

export function getHomeState(homeId: string): HomeState {
  return homes[homeId] ?? homes["123"];
}

export function setAlarmArmed(homeId: string, armed: boolean) {
  const home = homes[homeId] ?? homes["123"];

  home.security.alarm.armed = armed;
  if (!armed) home.security.alarm.triggered = false;

  home.updatedAt = now();
  return home;
}

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

function pushAlert(home: HomeState, alert: Alert) {
  home.alerts.unshift(alert);
  home.alerts = home.alerts.slice(0, 20);
}

function updated(home: HomeState, onUpdate?: (homeId: string) => void) {
  home.updatedAt = now();
  onUpdate?.(home.homeId);
}
const doorOpenedAt: Record<string, number | null> = {};

export function startSimulator(
  onUpdate?: (homeId: string) => void,
  onAlert?: (homeId: string, alert: Alert) => void
) {
  setInterval(() => {
    Object.values(homes).forEach((home) => {
      const t = home.sensors;

      t.temp_fridge.value = Number(rand(2, 10).toFixed(1));
      t.temp_fridge.lastSeen = now();

      t.temp_balcony.value = Number(rand(-10, 10).toFixed(1));
      t.temp_balcony.lastSeen = now();

      t.temp_room.value = Number(rand(18, 26).toFixed(1));
      t.temp_room.lastSeen = now();

      t.humidity_room.value = Math.round(rand(35, 60));
      t.humidity_room.lastSeen = now();

      t.power_total.value = Math.round(rand(200, 2500));
      t.power_total.lastSeen = now();

      updated(home, onUpdate);

      // ALERT: lodówka za ciepła
      if (home.sensors.temp_fridge.value > 8) {
        const alert: Alert = {
          id: uid(),
          type: "TEMP_FRIDGE_HIGH",
          message: `Lodówka za ciepła: ${home.sensors.temp_fridge.value}°C`,
          severity: "warning",
          createdAt: now(),
        };

        pushAlert(home, alert);
        onAlert?.(home.homeId, alert);
      }
    });
  }, 3000);

  // drzwi czasem się otwierają/zamykają
  setInterval(() => {
    Object.values(homes).forEach((home) => {
      const door = home.security.door_main;
      if (Math.random() < 0.3) {
        door.state = door.state === "open" ? "closed" : "open";
        door.lastSeen = now();
        updated(home,onUpdate);
        if (door.state === "open") {
          doorOpenedAt[home.homeId] = now();
        } else {
          doorOpenedAt[home.homeId] = null;
        }
      }
    });
  }, 5000);

  // alarm czasem uzbrojenie/rozbrojenie (symulacja)
  setInterval(() => {
    Object.values(homes).forEach((home) => {
      const alarm = home.security.alarm;
      const door = home.security.door_main;

      // losowo uzbroj/rozbrój
      if (Math.random() < 0.35) {
        alarm.armed = !alarm.armed;
        if (!alarm.armed) alarm.triggered = false;
      }

      // jeśli alarm uzbrojony i drzwi open -> czasem trigger
      if (alarm.armed && door.state === "open" && Math.random() < 0.6) {
        alarm.triggered = true;
      }

      home.updatedAt = now();
      onUpdate?.(home.homeId);
    });
  }, 8000);

  setInterval(() => {
    Object.values(homes).forEach((home) => {
      const door = home.security.door_main;

      if (door.state === "open") {
        const openedAt = doorOpenedAt[home.homeId];

        if (!openedAt) {
          doorOpenedAt[home.homeId] = now();
          return;
        }

        const secondsOpen = (now() - openedAt) / 1000;

        if (secondsOpen > 10) {
          const alert: Alert = {
            id: uid(),
            type: "DOOR_OPEN_TOO_LONG",
            message: `Drzwi otwarte zbyt długo: ${Math.floor(secondsOpen)}s`,
            severity: "critical",
            createdAt: now(),
          };

          pushAlert(home, alert);
          onAlert?.(home.homeId, alert);

          // reset, żeby nie spamować co sekundę
          doorOpenedAt[home.homeId] = now();
        }
      } else {
        doorOpenedAt[home.homeId] = null;
      }
    });
  }, 1000);
}
