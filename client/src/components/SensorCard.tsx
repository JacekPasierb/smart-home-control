type Sensor = {
  name: string;
  value: number;
  unit: string;
  online: boolean;
  lastSeen: number;
};

export function SensorCard({sensor}: {sensor: Sensor}) {
  return (
    <div className="card">
      <div style={{display: "flex", justifyContent: "space-between", gap: 12}}>
        <strong>{sensor.name}</strong>
        <span className="muted">
          {sensor.online ? "🟢 online" : "🔴 offline"}
        </span>
      </div>

      <div style={{fontSize: 26, fontWeight: 700, marginTop: 6}}>
        {sensor.value} {sensor.unit}
      </div>

      <div className="muted" style={{fontSize: 12, marginTop: 6}}>
        lastSeen: {new Date(sensor.lastSeen).toLocaleTimeString()}
      </div>
    </div>
  );
}
