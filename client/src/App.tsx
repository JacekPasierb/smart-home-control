import {useEffect, useState} from "react";
import {io} from "socket.io-client";
import {SensorCard} from "./components/SensorCard";
import {SecurityCard} from "./components/SecurityCard";
import {AlertsFeed} from "./components/AlertsFeed";
import {useQuery, useQueryClient} from "@tanstack/react-query";
import {fetchHomeState} from "./api/homeApi";
import type {Alert, HomeState} from "./types";
import { LiveChart } from "./components/LiveChart";

const API_URL = import.meta.env.VITE_API_URL as string;
const WS_URL = (import.meta.env.VITE_WS_URL as string) || API_URL;

export default function App() {
  const [chartSensorId, setChartSensorId] = useState<
    "temp_fridge" | "temp_balcony" | "temp_room"
    >("temp_room");
  
  const homeId = "123";
  const queryClient = useQueryClient();
  const {
    data: home,
    isLoading,
    isError,
  } = useQuery<HomeState>({
    queryKey: ["homeState", homeId],
    queryFn: () => fetchHomeState(homeId),
  });

  useEffect(() => {
    const socket = io(WS_URL);

    socket.emit("subscribe:home", homeId);

    socket.on("home:update", (data: HomeState) => {
      queryClient.setQueryData<HomeState>(["homeState", homeId], data);
    });

    socket.on("alert:new", (alert: Alert) => {
      queryClient.setQueryData<HomeState>(["homeState", homeId], (prev) => {
        if (!prev) return prev;

        return {
          ...prev,
          alerts: [alert, ...prev.alerts].slice(0, 20),
        };
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [homeId, queryClient]);

  if (isLoading) return <div style={{padding: 24}}>Loading...</div>;
  if (isError || !home)
    return <div style={{padding: 24}}>Error loading data</div>;

  return (
    <div className="container">
      <div className="header">
        <div>
          <h1 className="h1">SmartHome Control Center</h1>
          <p className="sub">
            Realtime IoT Dashboard • WebSocket + React Query
          </p>
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
