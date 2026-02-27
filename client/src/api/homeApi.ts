import type {HomeState} from "../types";

const API_URL = import.meta.env.VITE_API_URL as string;

export async function fetchHomeState(homeId: string): Promise<HomeState> {
  const res = await fetch(`${API_URL}/api/home/${homeId}/state`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
