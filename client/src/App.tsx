import "./styles.css";
import {useState} from "react";

import {HOMES, type HomeId} from "./config/home";

import {useHomeState} from "./hooks/useHomeState";
import {useHomeSocket} from "./hooks/useHomeSocket";
import {useAlarmMutation} from "./hooks/useAlarmMutation";
import {useAlarmSound} from "./hooks/useAlarmSound";

import {SensorCard} from "./components/SensorCard";
import {SecurityCard} from "./components/SecurityCard";
import {AlertsFeed} from "./components/AlertsFeed";
import {LiveChart} from "./components/LiveChart";
import {LoginPage} from "./components/LoginPage";

type ChartSensorId = "temp_fridge" | "temp_balcony" | "temp_room";

export default function App() {
  const token = localStorage.getItem("accessToken");
  const isAuthed = Boolean(token);

  // hooki zawsze wywołane
  const [homeId, setHomeId] = useState<HomeId>("123");
  const [chartSensorId, setChartSensorId] =
    useState<ChartSensorId>("temp_room");

  // hooki dostają enabled -> nie robią requestów/socketa bez tokenu
  const {
    data: home,
    isLoading,
    isError,
    error,
  } = useHomeState(homeId, isAuthed);
  const {wsStatus} = useHomeSocket(homeId, isAuthed);
  const alarmMutation = useAlarmMutation(homeId, isAuthed);
  const {soundEnabled, setSoundEnabled, testPlay} = useAlarmSound(home);

  // ✅ najpierw auth gate
  if (!isAuthed) return <LoginPage />;

  // ✅ potem stany query
  if (isLoading) return <div style={{padding: 24}}>Loading...</div>;

  if (isError) {
    const msg = (error as Error)?.message;
    return (
      <div style={{padding: 24}}>
        {msg === "Forbidden"
          ? "⛔ Forbidden: no access to this home"
          : "Error loading data"}
      </div>
    );
  }

  if (!home) return <div style={{padding: 24}}>Loading...</div>;


  const userRaw = localStorage.getItem("user");
  const user = userRaw ? (JSON.parse(userRaw) as {homes: string[]}) : null;

  const visibleHomes = user?.homes?.length
    ? HOMES.filter((h) => user.homes.includes(h.id))
    : HOMES;
  return (
    <div className="container">
      <div className="header">
        <div>
          <h1 className="h1">SmartHome Control Center</h1>
          <p className="sub">
            Realtime IoT Dashboard • WebSocket + React Query
          </p>
        </div>

        <button
          className="btn-small"
          onClick={() => {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("user");
            window.location.reload();
          }}
        >
          Logout
        </button>

        <div
          style={{
            display: "flex",
            gap: 10,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <select
            className="select"
            value={homeId}
            onChange={(e) => setHomeId(e.target.value as HomeId)}
            title="Choose home"
          >
            {visibleHomes.map((h) => (
              <option key={h.id} value={h.id}>
                {h.label}
              </option>
            ))}
          </select>

          <div className="badge">
            <span
              className={`dot ${
                wsStatus === "online"
                  ? "dot-online"
                  : wsStatus === "connecting"
                  ? "dot-connecting"
                  : "dot-offline"
              }`}
            />
            {wsStatus === "online"
              ? "Realtime: connected"
              : wsStatus === "connecting"
              ? "Realtime: connecting..."
              : "Realtime: disconnected"}
          </div>

          <button
            className="btn-small"
            onClick={() => setSoundEnabled((v) => !v)}
          >
            {soundEnabled ? "🔊 Sound ON" : "🔇 Sound OFF"}
          </button>

          <button
            className="btn-small"
            onClick={testPlay}
            disabled={!soundEnabled}
          >
            ▶ Test
          </button>
        </div>
      </div>

      {home.security.alarm.triggered && (
        <div className="alarm-banner">
          🚨 Alarm triggered! Check door sensors and security status.
        </div>
      )}

      <div className="grid">
        <div className="panel">
          <h2 className="panelTitle">Sensors</h2>
          <div className="cardsGrid">
            {Object.entries(home.sensors).map(([key, sensor]) => (
              <SensorCard key={key} sensor={sensor} />
            ))}
          </div>
        </div>

        <div style={{display: "grid", gap: 16}}>
          <div className="panel">
            <h2 className="panelTitle">Live chart</h2>

            <div
              style={{
                display: "flex",
                gap: 10,
                marginBottom: 12,
                flexWrap: "wrap",
              }}
            >
              <button
                className="btn"
                onClick={() => setChartSensorId("temp_fridge")}
              >
                Lodówka
              </button>
              <button
                className="btn"
                onClick={() => setChartSensorId("temp_balcony")}
              >
                Balkon
              </button>
              <button
                className="btn"
                onClick={() => setChartSensorId("temp_room")}
              >
                Pokój
              </button>
            </div>

            <LiveChart
              title={`Temperature • ${home.sensors[chartSensorId].name}`}
              value={home.sensors[chartSensorId].value}
            />
          </div>

          <div className="panel">
            <h2 className="panelTitle">Security</h2>

            <div
              style={{
                display: "flex",
                gap: 10,
                marginBottom: 12,
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <button
                className="btn"
                onClick={() => alarmMutation.mutate(true)}
                disabled={alarmMutation.isPending || home.security.alarm.armed}
              >
                🛡 Arm
              </button>

              <button
                className="btn"
                onClick={() => alarmMutation.mutate(false)}
                disabled={alarmMutation.isPending || !home.security.alarm.armed}
              >
                🛑 Disarm
              </button>

              {alarmMutation.isPending && (
                <span className="muted">Saving...</span>
              )}
            </div>

            <SecurityCard
              door={home.security.door_main}
              alarm={home.security.alarm}
            />
          </div>

          <div className="panel">
            <h2 className="panelTitle">Alerts</h2>
            <AlertsFeed alerts={home.alerts} />
          </div>
        </div>
      </div>
    </div>
  );
}
