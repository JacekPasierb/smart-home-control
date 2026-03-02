import {useEffect, useRef, useState} from "react";
import {io} from "socket.io-client";
import {useQueryClient} from "@tanstack/react-query";

import {WS_URL} from "../config/env";
import type {Alert, HomeState} from "../types";
import type {HomeId} from "../config/home";

type WsStatus = "connecting" | "online" | "offline";

export function useHomeSocket(homeId: HomeId) {
  const queryClient = useQueryClient();

  const [wsStatus, setWsStatus] = useState<WsStatus>("connecting");
  const socketRef = useRef<ReturnType<typeof io> | null>(null);
  const prevHomeIdRef = useRef<HomeId>(homeId);

  // create socket once
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
      subscribe(prevHomeIdRef.current);
    };

    const onDisconnect = () => setWsStatus("offline");
    const onConnectError = () => setWsStatus("offline");

    const onHomeUpdate = (data: HomeState) => {
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
      if (socket.connected) {
        unsubscribe(prevHomeIdRef.current);
      }
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
      socket.off("home:update", onHomeUpdate);
      socket.off("alert:new", onAlert);

      socket.disconnect();
      socketRef.current = null;
    };
  }, [queryClient]);

  // switch home: unsubscribe/subscribe + refresh snapshot
  useEffect(() => {
    queryClient.invalidateQueries({queryKey: ["homeState", homeId]});

    const socket = socketRef.current;
    const prevHomeId = prevHomeIdRef.current;

    if (socket?.connected && prevHomeId !== homeId) {
      socket.emit("unsubscribe:home", prevHomeId);
      socket.emit("subscribe:home", homeId);
    }

    prevHomeIdRef.current = homeId;
  }, [homeId, queryClient]);

  return {wsStatus};
}
