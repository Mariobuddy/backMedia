const express = require("express");
const app = express();
const cookieParser = require("cookie-parser");
const cloudinary = require("cloudinary");
const morgan = require('morgan');
const cors = require("cors");
const {
  PORT,
  SECURE,
  Cloud_Key,
  Cloud_Name,
  Cloud_Secret,
} = require("./config/secure");
const base_url = require("./config/base_url");
const connection = require("./database/connection");
const postroute = require("./router/postroute");
const userroute = require("./router/userroute");
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan("combined"));

cloudinary.config({
  cloud_name: Cloud_Name,
  api_key: Cloud_Key,
  api_secret: Cloud_Secret,
});

app.use(
  cors({
    credentials: true,
    methods: "GET,POST,PATCH,DELETE,OPTIONS",
    optionsSuccessStatus: 200,
    origin: base_url,
  })
);
app.use("/post", postroute);
app.use("/user", userroute);

app.use((error, req, res, next) => {
  error.statusCode = error.statusCode || 500;
  error.status = error.status || "error";
  res.status(error.statusCode).json({
    status: error.status,
    statusCode: error.statusCode,
    message: error.message,
  });
});
const Start = async () => {
  try {
    await connection(SECURE);
    app.listen(PORT, () => {
      console.log(`Server is started on PORT ${PORT}`);
    });
  } catch (error) {
    return error;
  }
};

Start();
