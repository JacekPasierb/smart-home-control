import type {Alert} from "../types";

interface Props {
  alerts: Alert[];
}

export function AlertsFeed({alerts}: Props) {
  if (!alerts.length) {
    return (
      <div className="card">
        <div style={{opacity: 0.6}}>No alerts yet</div>
      </div>
    );
  }

  return (
    <div style={{display: "grid", gap: 10}}>
      {alerts.map((alert) => {
        const borderColor =
          alert.severity === "critical"
            ? "rgba(239, 68, 68, 0.7)"
            : alert.severity === "warning"
            ? "rgba(245, 158, 11, 0.7)"
            : "rgba(59, 130, 246, 0.7)";

        const icon =
          alert.severity === "critical"
            ? "🚨"
            : alert.severity === "warning"
            ? "⚠️"
            : "ℹ️";

        return (
          <div
            key={alert.id}
            className="card"
            style={{
              borderLeft: `4px solid ${borderColor}`,
              animation: "fadeIn 0.25s ease",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 10,
              }}
            >
              <strong>
                {icon} {alert.type}
              </strong>

              <span
                style={{
                  fontSize: 12,
                  opacity: 0.6,
                }}
              >
                {new Date(alert.createdAt).toLocaleTimeString()}
              </span>
            </div>

            <div style={{marginTop: 6, fontSize: 14}}>{alert.message}</div>
          </div>
        );
      })}
    </div>
  );
}
