import {useEffect, useState} from "react";

const API_URL = import.meta.env.VITE_API_URL as string;

export default function App() {
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    fetch(`${API_URL}/health`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setMessage(JSON.stringify(data));
        setStatus("ok");
      })
      .catch((err) => {
        setStatus("error");
        setMessage(err.message || "error");
      });
  }, []);

  return (
    <div style={{padding: 24, fontFamily: "system-ui"}}>
      <h1 style={{marginBottom: 8}}>SmartHome Control Center</h1>

      <div
        style={{
          marginTop: 16,
          border: "1px solid #ddd",
          borderRadius: 10,
          padding: 12,
          maxWidth: 520,
        }}
      >
        <h2 style={{margin: 0, marginBottom: 8}}>Backend health</h2>
        <p style={{margin: 0}}>
          Status:{" "}
          {status === "loading"
            ? "⏳ loading"
            : status === "ok"
            ? "✅ ok"
            : "❌ error"}
        </p>
        <pre style={{marginTop: 10, whiteSpace: "pre-wrap"}}>{message}</pre>
      </div>
    </div>
  );
}
