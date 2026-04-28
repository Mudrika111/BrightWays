const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/activity", require("./routes/activity"));
app.use("/api/caregiver", require("./routes/caregiver"));
app.use("/api/dashboard", require("./routes/dashboard"));
app.use("/api/login", require("./routes/login"));
app.use("/api/register", require("./routes/register"));

const caregiverRoute = require("./routes/caregiver");
app.use("/api/caregiver", caregiverRoute);

app.listen(5000, () => console.log("Server running on port 5000"));