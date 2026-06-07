const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const passport = require("passport");

const authRoutes = require("./routes/auth.routes");
const taskRoutes = require("./routes/task.routes");

require("./config/passport");

const app = express();

app.use(helmet());
app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);

app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date() });
});

module.exports = app;
