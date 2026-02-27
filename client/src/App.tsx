import {useEffect} from "react";
import {io} from "socket.io-client";
import {SensorCard} from "./components/SensorCard";
import {SecurityCard} from "./components/SecurityCard";
import {AlertsFeed} from "./components/AlertsFeed";
import {useQuery, useQueryClient} from "@tanstack/react-query";
import {fetchHomeState} from "./api/homeApi";
import type {Alert, HomeState} from "./types";

const API_URL = import.meta.env.VITE_API_URL as string;
const WS_URL = (import.meta.env.VITE_WS_URL as string) || API_URL;

export default function App() {
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
    <div style={{padding: 24, fontFamily: "system-ui"}}>
      <h1>SmartHome Control Center</h1>

      <h2 style={{marginTop: 24}}>Sensors</h2>

      <div style={{display: "grid", gap: 12}}>
        {Object.entries(home.sensors).map(([key, sensor]) => (
          <SensorCard key={key} sensor={sensor} />
        ))}
      </div>

      <h2 style={{marginTop: 32}}>Security</h2>

      <SecurityCard
        door={home.security.door_main}
        alarm={home.security.alarm}
      />

      <h2 style={{marginTop: 32}}>Alerts</h2>

      <AlertsFeed alerts={home.alerts} />
    </div>
  );
}
