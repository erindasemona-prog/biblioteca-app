import "dotenv/config";
import express from "express";
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";
import bookRoutes from "./routes/bookRoutes";
import loanRoutes from "./routes/loanRoutes";

const app = express();

app.use(express.json());

app.get("/", (_req, res) => {
  res.send("Server biblioteca attivo");
});

app.use(authRoutes);
app.use(userRoutes);
app.use(bookRoutes);
app.use(loanRoutes);

app.listen(3000, () => {
  console.log("Server partito su http://localhost:3000");
});
