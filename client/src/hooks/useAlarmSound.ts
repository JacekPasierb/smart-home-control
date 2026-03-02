import {useEffect, useRef, useState} from "react";
import type {HomeState} from "../types";

export function useAlarmSound(home?: HomeState) {
  const [soundEnabled, setSoundEnabled] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const prevTriggeredRef = useRef(false);

  useEffect(() => {
    audioRef.current = new Audio("/alarm.wav");
    audioRef.current.loop = false;
    audioRef.current.volume = 0.6;
  }, []);

  useEffect(() => {
    if (!home) return;

    const triggered = home.security.alarm.triggered;
    const wasTriggered = prevTriggeredRef.current;

    if (soundEnabled && !wasTriggered && triggered) {
      audioRef.current?.play().catch(() => {});
    }

    prevTriggeredRef.current = triggered;
  }, [home, soundEnabled]);

  const testPlay = () => audioRef.current?.play();

  return {soundEnabled, setSoundEnabled, testPlay};
}
