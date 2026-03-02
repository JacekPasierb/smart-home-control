import bcrypt from "bcryptjs";

(async () => {
  const hash = await bcrypt.hash("user12345", 10);
  console.log(hash);
})();
