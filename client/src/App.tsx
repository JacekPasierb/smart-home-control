import {useEffect, useState} from "react";
import {io} from "socket.io-client";

const API_URL = import.meta.env.VITE_API_URL as string;
const WS_URL = (import.meta.env.VITE_WS_URL as string) || API_URL;

interface Sensor {
  name: string;
  value: number;
  unit: string;
  online: boolean;
  lastSeen: number;
}

interface Door {
  name: string;
  state: "open" | "closed";
  online: boolean;
  lastSeen: number;
}

interface Alarm {
  armed: boolean;
  triggered: boolean;
}

interface HomeState {
  homeId: string;
  updatedAt: number;
  sensors: Record<string, Sensor>;
  security: {
    door_main: Door;
    alarm: Alarm;
  };
  alerts: any[];
}

type Alert = {
  id: string;
  type: "TEMP_FRIDGE_HIGH" | "DOOR_OPEN_TOO_LONG";
  message: string;
  severity: "info" | "warning" | "critical";
  createdAt: number;
};

export default function App() {
  const [home, setHome] = useState<HomeState | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    fetch(`${API_URL}/api/home/123/state`)
      .then((res) => res.json())
      .then((data) => setHome(data))
      .catch(console.error);
  }, []);

  useEffect(() => {
    const socket = io(WS_URL);

    socket.emit("subscribe:home", "123");

    socket.on("home:update", (data: HomeState) => {
      setHome(data);
      setAlerts(data.alerts ?? []);
    });

    socket.on("alert:new", (alert: Alert) => {
      setAlerts((prev) => [alert, ...prev].slice(0, 20));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  if (!home) return <div style={{padding: 24}}>Loading...</div>;

  return (
    <div style={{padding: 24, fontFamily: "system-ui"}}>
      <h1>SmartHome Control Center</h1>

      <h2 style={{marginTop: 24}}>Sensors</h2>

      <div style={{display: "grid", gap: 12}}>
        {Object.entries(home.sensors).map(([key, sensor]) => (
          <div
            key={key}
            style={{
              border: "1px solid #ddd",
              padding: 12,
              borderRadius: 8,
            }}
          >
            <strong>{sensor.name}</strong>
            <div>
              {sensor.value} {sensor.unit}
            </div>
            <div>{sensor.online ? "🟢 online" : "🔴 offline"}</div>
          </div>
        ))}
      </div>

      <h2 style={{marginTop: 32}}>Security</h2>

      <div style={{border: "1px solid #ddd", padding: 12, borderRadius: 8}}>
        <div>
          <strong>{home.security.door_main.name}</strong>
        </div>
        <div>
          {home.security.door_main.state === "open" ? "🚪 Open" : "🔒 Closed"}
        </div>
      </div>

      <div
        style={{
          marginTop: 12,
          border: "1px solid #ddd",
          padding: 12,
          borderRadius: 8,
        }}
      >
        <strong>Alarm</strong>
        <div>{home.security.alarm.armed ? "🛡 Armed" : "🛑 Disarmed"}</div>
        {home.security.alarm.triggered && (
          <div style={{color: "red"}}>🚨 ALERT TRIGGERED</div>
        )}
      </div>

      <h2 style={{marginTop: 32}}>Alerts</h2>

      <div style={{display: "grid", gap: 8}}>
        {alerts.length === 0 ? (
          <div style={{opacity: 0.7}}>Brak alertów ✅</div>
        ) : (
          alerts.map((a) => (
            <div
              key={a.id}
              style={{
                border: "1px solid #ddd",
                padding: 10,
                borderRadius: 8,
              }}
            >
              <div style={{fontWeight: 600}}>
                {a.severity === "critical"
                  ? "🚨"
                  : a.severity === "warning"
                  ? "⚠️"
                  : "ℹ️"}{" "}
                {a.message}
              </div>
              <div style={{fontSize: 12, opacity: 0.7}}>
                {new Date(a.createdAt).toLocaleTimeString()}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
