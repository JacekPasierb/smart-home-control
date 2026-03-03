import type {HomeState} from "../types";

const API_URL = import.meta.env.VITE_API_URL as string;

function logout() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("user");
  window.location.reload();
}

export async function fetchHomeState(homeId: string): Promise<HomeState> {
  const token = localStorage.getItem("accessToken");

  const res = await fetch(`${API_URL}/api/home/${homeId}/state`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (res.status === 401) {
    logout();
    throw new Error("Unauthorized");
  }

  if (res.status === 403) {
    throw new Error("Forbidden");
  }

  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  return res.json();
}

export async function setAlarm(
  homeId: string,
  armed: boolean
): Promise<HomeState> {
  const token = localStorage.getItem("accessToken");

  const res = await fetch(`${API_URL}/api/home/${homeId}/security/alarm`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({armed}),
  });

  if (res.status === 401) {
    logout();
    throw new Error("Unauthorized");
  }

  if (res.status === 403) {
    throw new Error("Forbidden");
  }

  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  return res.json();
}
