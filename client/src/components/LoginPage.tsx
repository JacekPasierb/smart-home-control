import {useState} from "react";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

type LoginResponse = {
  accessToken: string;
  user: {id: string; role: "user" | "admin"; homes: string[]};
};

export function LoginPage() {
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

      const data = (await res.json().catch(() => null)) as LoginResponse | null;

      if (!res.ok || !data?.accessToken) {
        setError(
          (data as any)?.error || (data as any)?.message || "Login failed"
        );
        return;
      }

      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("user", JSON.stringify(data.user)); // przyda się za chwilę (homes)

      window.location.reload();
    } catch {
      setError("Network error");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="loginWrap">
      <div className="loginCard">
        <h1 className="loginTitle">SmartHome Control Center</h1>
        <p className="sub">Login (MVP) • JWT in localStorage</p>
        <p className="sub">login: user, password: user12345</p>
        <p className="sub">login: admin, password: admin12345</p>
        <form onSubmit={onSubmit} className="loginForm">
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

          <button
            className="btn"
            disabled={pending || !login || !password}
            type="submit"
          >
            {pending ? "Logging in..." : "Login"}
          </button>

          {error && <p className="loginError">{error}</p>}
        </form>
      </div>
    </div>
  );
}
