import {useEffect, useRef, useState} from "react";
import {io} from "socket.io-client";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";

import {fetchHomeState, setAlarm} from "./api/homeApi";
import type {Alert, HomeState} from "./types";

import {SensorCard} from "./components/SensorCard";
import {SecurityCard} from "./components/SecurityCard";
import {AlertsFeed} from "./components/AlertsFeed";
import {LiveChart} from "./components/LiveChart";

const API_URL = import.meta.env.VITE_API_URL as string;
const WS_URL = (import.meta.env.VITE_WS_URL as string) || API_URL;

const HOMES = [
  {id: "123", label: "Home A (123)"},
  {id: "456", label: "Home B (456)"},
] as const;

type HomeId = (typeof HOMES)[number]["id"];
type WsStatus = "connecting" | "online" | "offline";
type ChartSensorId = "temp_fridge" | "temp_balcony" | "temp_room";

export default function App() {
  const queryClient = useQueryClient();

  const [homeId, setHomeId] = useState<HomeId>("123");
  const [chartSensorId, setChartSensorId] =
    useState<ChartSensorId>("temp_room");
  const [wsStatus, setWsStatus] = useState<WsStatus>("connecting");

  // sound
  const [soundEnabled, setSoundEnabled] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const prevTriggeredRef = useRef(false);

  // socket
  const socketRef = useRef<ReturnType<typeof io> | null>(null);
  const prevHomeIdRef = useRef<HomeId>(homeId);

  const {
    data: home,
    isLoading,
    isError,
  } = useQuery<HomeState>({
    queryKey: ["homeState", homeId],
    queryFn: () => fetchHomeState(homeId),
  });

  // init audio once
  useEffect(() => {
    audioRef.current = new Audio("/alarm.wav");
    audioRef.current.loop = false;
    audioRef.current.volume = 0.6;
  }, []);

  // play sound only on false -> true
  useEffect(() => {
    if (!home) return;

    const triggered = home.security.alarm.triggered;
    const wasTriggered = prevTriggeredRef.current;

    if (soundEnabled && !wasTriggered && triggered) {
      audioRef.current?.play().catch(() => {});
    }

    prevTriggeredRef.current = triggered;
  }, [home, soundEnabled]);

  // alarm mutation
  const alarmMutation = useMutation({
    mutationFn: (armed: boolean) => setAlarm(homeId, armed),

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

  // socket created once
  useEffect(() => {
    const socket = io(WS_URL, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 700,
    });

    socketRef.current = socket;

    const subscribe = (id: HomeId) => socket.emit("subscribe:home", id);
    const unsubscribe = (id: HomeId) => socket.emit("unsubscribe:home", id);

    const onConnect = () => {
      setWsStatus("online");
      // po połączeniu subskrybuj aktualny dom
      subscribe(prevHomeIdRef.current);
    };

    const onDisconnect = () => setWsStatus("offline");
    const onConnectError = () => setWsStatus("offline");

    const onHomeUpdate = (data: HomeState) => {
      console.log(
        "[WS home:update]",
        "active=",
        prevHomeIdRef.current,
        "payload=",
        data.homeId
      );
      // ważne: klucz po data.homeId, żeby nie mieszać domów
      queryClient.setQueryData<HomeState>(["homeState", data.homeId], data);
    };

    const onAlert = (payload: {homeId: string; alert: Alert}) => {
      queryClient.setQueryData<HomeState>(
        ["homeState", payload.homeId],
        (prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            alerts: [payload.alert, ...prev.alerts].slice(0, 20),
          };
        }
      );
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);
    socket.on("home:update", onHomeUpdate);
    socket.on("alert:new", onAlert);

    socket.io.on("reconnect_attempt", () => setWsStatus("connecting"));
    socket.io.on("reconnect", () => {
      setWsStatus("online");
      subscribe(prevHomeIdRef.current);
    });

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
      socket.off("home:update", onHomeUpdate);
      socket.off("alert:new", onAlert);
      socket.disconnect();
      socketRef.current = null;
    };
    // socket tworzymy raz
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryClient]);

  // switching home: unsubscribe previous, subscribe new, refresh REST snapshot
  useEffect(() => {
    queryClient.invalidateQueries({queryKey: ["homeState", homeId]});

    const socket = socketRef.current;
    const prevHomeId = prevHomeIdRef.current;

    if (socket?.connected) {
      if (prevHomeId !== homeId) {
        socket.emit("unsubscribe:home", prevHomeId);
      }
      socket.emit("subscribe:home", homeId);
    }

    prevHomeIdRef.current = homeId;
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
            {HOMES.map((h) => (
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
            onClick={() => audioRef.current?.play()}
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
