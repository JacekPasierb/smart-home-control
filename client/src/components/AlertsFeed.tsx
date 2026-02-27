type Alert = {
  id: string;
  type: "TEMP_FRIDGE_HIGH" | "DOOR_OPEN_TOO_LONG";
  message: string;
  severity: "info" | "warning" | "critical";
  createdAt: number;
};

function icon(severity: Alert["severity"]) {
  if (severity === "critical") return "🚨";
  if (severity === "warning") return "⚠️";
  return "ℹ️";
}

export function AlertsFeed({alerts}: {alerts: Alert[]}) {
  return (
    <div style={{display: "grid", gap: 8}}>
      {alerts.length === 0 ? (
        <div style={{opacity: 0.7}}>Brak alertów ✅</div>
      ) : (
        alerts.map((a) => (
          <div
            key={a.id}
            style={{
              border: "1px solid #ddd",
              padding: 10,
              borderRadius: 8,
            }}
          >
            <div style={{fontWeight: 600}}>
              {icon(a.severity)} {a.message}
            </div>
            <div style={{fontSize: 12, opacity: 0.7}}>
              {new Date(a.createdAt).toLocaleTimeString()}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
