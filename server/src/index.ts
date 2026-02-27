import app from "./app";
import { startSimulator } from "./store/homeStore";

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;

startSimulator();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
