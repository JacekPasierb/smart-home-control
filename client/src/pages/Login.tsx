import {useState} from "react";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

export default function Login() {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({login, password}),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.error || data?.message || "Login failed");
        return;
      }

      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("user", JSON.stringify(data.user)); // opcjonalnie (role/homes)

      window.location.href = "/";
    } catch {
      setError("Network error");
    } finally {
      setPending(false);
    }
  };

  return (
    <div style={{maxWidth: 420, margin: "80px auto", padding: 16}}>
      <h1 style={{marginBottom: 16}}>SmartHome Control Center</h1>

      <form onSubmit={onSubmit} style={{display: "grid", gap: 12}}>
        <input
          value={login}
          onChange={(e) => setLogin(e.target.value)}
          placeholder="login"
          autoComplete="username"
        />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="password"
          type="password"
          autoComplete="current-password"
        />

        <button disabled={pending || !login || !password} type="submit">
          {pending ? "Logging in..." : "Login"}
        </button>

        {error && <div style={{color: "crimson"}}>{error}</div>}
      </form>
    </div>
  );
}
