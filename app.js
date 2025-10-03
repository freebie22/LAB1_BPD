const express = require("express");
const bodyParser = require("body-parser");
const hammingRouter = require("./hammingRoute");

const app = express();

app.use(bodyParser.json());

app.use("/api/hammingParser", hammingRouter);

app.use((req, res) => {
  res.status(404),
    bodyParser.json({ status: false, message: "No route were found" });
});

app.listen(3000, () => {
  console.log("App is listenting on port 3000");
});
