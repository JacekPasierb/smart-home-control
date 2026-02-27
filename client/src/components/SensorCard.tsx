type Sensor = {
  name: string;
  value: number;
  unit: string;
  online: boolean;
  lastSeen: number;
};

export function SensorCard({sensor}: {sensor: Sensor}) {
  return (
    <div
      style={{
        border: "1px solid #ddd",
        padding: 12,
        borderRadius: 8,
      }}
    >
      <div style={{display: "flex", justifyContent: "space-between", gap: 12}}>
        <strong>{sensor.name}</strong>
        <span>{sensor.online ? "🟢 online" : "🔴 offline"}</span>
      </div>

      <div style={{fontSize: 26, fontWeight: 700, marginTop: 6}}>
        {sensor.value} {sensor.unit}
      </div>

      <div style={{fontSize: 12, opacity: 0.7, marginTop: 6}}>
        lastSeen: {new Date(sensor.lastSeen).toLocaleTimeString()}
      </div>
    </div>
  );
}
