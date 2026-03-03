// src/auth/authStorage.ts
const KEY = "shcc_token";
export const authStorage = {
  get: () => localStorage.getItem(KEY),
  set: (t: string) => localStorage.setItem(KEY, t),
  clear: () => localStorage.removeItem(KEY),
};
