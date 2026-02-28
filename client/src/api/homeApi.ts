import type {HomeState} from "../types";

const API_URL = import.meta.env.VITE_API_URL as string;

export async function fetchHomeState(homeId: string): Promise<HomeState> {
  const res = await fetch(`${API_URL}/api/home/${homeId}/state`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function setAlarm(
  homeId: string,
  armed: boolean
): Promise<HomeState> {
  const res = await fetch(`${API_URL}/api/home/${homeId}/security/alarm`, {
    method: "PATCH",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({armed}),
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}