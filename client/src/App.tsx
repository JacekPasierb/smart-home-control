import {useEffect, useRef, useState} from "react";
import {io} from "socket.io-client";
import {SensorCard} from "./components/SensorCard";
import {SecurityCard} from "./components/SecurityCard";
import {AlertsFeed} from "./components/AlertsFeed";
import {useQuery, useQueryClient} from "@tanstack/react-query";
import {fetchHomeState} from "./api/homeApi";
import type {Alert, HomeState} from "./types";
import {LiveChart} from "./components/LiveChart";
import {useMutation} from "@tanstack/react-query";
import {setAlarm} from "./api/homeApi";

const API_URL = import.meta.env.VITE_API_URL as string;
const WS_URL = (import.meta.env.VITE_WS_URL as string) || API_URL;

export default function App() {
  const [chartSensorId, setChartSensorId] = useState<
    "temp_fridge" | "temp_balcony" | "temp_room"
  >("temp_room");

  const [wsStatus, setWsStatus] = useState<"connecting" | "online" | "offline">(
    "connecting"
  );

  const [soundEnabled, setSoundEnabled] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const prevTriggeredRef = useRef<boolean>(false);
  const socketRef = useRef<ReturnType<typeof io> | null>(null);
  const homes = [
    {id: "123", label: "Home A (123)"},
    {id: "456", label: "Home B (456)"},
  ] as const;
  
  const [homeId, setHomeId] = useState<(typeof homes)[number]["id"]>("123");

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
    audioRef.current = new Audio("/alarm.wav");
    audioRef.current.loop = false;
    audioRef.current.volume = 0.6;
  }, []);

  useEffect(() => {
    if (!home) return;

    const triggered = home.security.alarm.triggered;
    const wasTriggered = prevTriggeredRef.current;

    // przejście false -> true
    if (soundEnabled && !wasTriggered && triggered) {
      audioRef.current?.play().catch(() => {
        // autoplay policy: trzeba włączyć dźwięk kliknięciem
        // zostawiamy cicho, bo i tak mamy przycisk "Test sound"
      });
    }

    prevTriggeredRef.current = triggered;
  }, [home, soundEnabled]);

  const alarmMutation = useMutation({
    mutationFn: (armed: boolean) => setAlarm(homeId, armed),

    // optimistic update
    onMutate: async (armed) => {
      await queryClient.cancelQueries({queryKey: ["homeState", homeId]});

      const prev = queryClient.getQueryData<HomeState>(["homeState", homeId]);

      if (prev) {
        queryClient.setQueryData<HomeState>(["homeState", homeId], {
          ...prev,
          security: {
            ...prev.security,
            alarm: {
              ...prev.security.alarm,
              armed,
              triggered: armed ? prev.security.alarm.triggered : false,
            },
          },
        });
      }

      return {prev};
    },

    onError: (_err, _armed, ctx) => {
      if (ctx?.prev) {
        queryClient.setQueryData<HomeState>(["homeState", homeId], ctx.prev);
      }
    },

    onSuccess: (data) => {
      queryClient.setQueryData<HomeState>(["homeState", homeId], data);
    },
  });

  useEffect(() => {
    const socket = io(WS_URL, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 700,
    });

    socketRef.current = socket;

    const onConnect = () => {
  setWsStatus("online");
  socket.emit("subscribe:home", homeId);
};
    const onDisconnect = () => setWsStatus("offline");
    const onConnectError = () => setWsStatus("offline");

    const onHomeUpdate = (data: HomeState) => {
      queryClient.setQueryData<HomeState>(["homeState", data.homeId], data);
    };

    const onAlert = (alert: Alert) => {
      // alert nie ma homeId, więc zostawiamy go w home cache przez "obecny homeId"
      // (docelowo dodamy homeId do alertów w backendzie)
      queryClient.setQueryData<HomeState>(["homeState", homeId], (prev) => {
        if (!prev) return prev;
        return {...prev, alerts: [alert, ...prev.alerts].slice(0, 20)};
      });
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);
    socket.on("home:update", onHomeUpdate);
    socket.on("alert:new", onAlert);

    socket.io.on("reconnect_attempt", () => setWsStatus("connecting"));

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
      socket.off("home:update", onHomeUpdate);
      socket.off("alert:new", onAlert);
      socket.disconnect();
      socketRef.current = null;
    };
    // UWAGA: homeId w deps nie chcemy tu, bo socket ma być tworzony raz
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryClient]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    // dociągnij snapshot REST
    queryClient.invalidateQueries({queryKey: ["homeState", homeId]});

    // jeśli socket już połączony — subskrybuj aktualny home
    if (socket.connected) {
      socket.emit("subscribe:home", homeId);
    }
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
        <select
          className="select"
          value={homeId}
          onChange={(e) => setHomeId(e.target.value as any)}
          title="Choose home"
        >
          {homes.map((h) => (
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

        <div style={{display: "flex", gap: 10, alignItems: "center"}}>
          <button
            className="btn-small"
            onClick={() => setSoundEnabled((v) => !v)}
            title="Enable sound alerts"
          >
            {soundEnabled ? "🔊 Sound ON" : "🔇 Sound OFF"}
          </button>

          <button
            className="btn-small"
            onClick={() => audioRef.current?.play()}
            disabled={!soundEnabled}
            title="Play test alarm sound"
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
              }}
            >
              <button
                className="btn"
                onClick={() => alarmMutation.mutate(true)}
                disabled={alarmMutation.isPending || home.security.alarm.armed}
                title={
                  home.security.alarm.armed
                    ? "Alarm already armed"
                    : "Arm alarm"
                }
              >
                🛡 Arm
              </button>

              <button
                className="btn"
                onClick={() => alarmMutation.mutate(false)}
                disabled={alarmMutation.isPending || !home.security.alarm.armed}
                title={
                  !home.security.alarm.armed
                    ? "Alarm already disarmed"
                    : "Disarm alarm"
                }
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
