const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const authRoutes = require("../routes/auth");
const usersRoutes = require("../routes/users");
const itemsRoutes = require("../routes/items");
const messagesRoutes = require("../routes/messages");
const reviewsRoutes = require("../routes/reviews");
const { v4: uuidv4 } = require("uuid");
const app = express();
const port = +process.env.PORT || 8080;
const uuid = uuidv4();

const corsOptions = {
  origin: "*",
  optionsSuccessStatus: 200,
};

console.log("Deployment should start now!");

app.use(cors(corsOptions));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

app.get("/", (_, res) => {
  res.json(`Success! 😊 Today's lucky code is ${uuid}`);
});

app.use(authRoutes);
app.use(usersRoutes);
app.use(itemsRoutes);
app.use(messagesRoutes);
app.use(reviewsRoutes);

app.listen(port, () => {
  console.log(`App running on port ${port}`);
});
