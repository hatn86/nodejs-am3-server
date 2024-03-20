require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const multer = require("multer");
const path = require("path");

const authRoutes = require("./routes/auth");
const productRoutes = require("./routes/product");
const orderRoutes = require("./routes/order");
const adminRoutes = require("./routes/admin");
const sessionRoutes = require("./routes/session");

const { sendMessage, closeSession } = require("./utils/chat");

const app = express();

// cau hinh folder luu image va ten image tren server
const imgFileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images");
  },
  filename: (req, file, cb) => {
    const date = new Date()
      .toISOString()
      .replaceAll("-", "")
      .replaceAll(":", "")
      .replaceAll(".", "");
    cb(null, date + "-" + file.originalname);
  },
});

// cau hinh loai image type duoc pheps upload
const imgFileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

// khai bao ket noi toi mongodb
const mongoDb_URI = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@nodejs.t7hxuej.mongodb.net/${process.env.MONGO_DEFAULT_DB}?retryWrites=true&w=majority`;

// accept type of data from request
app.use(bodyParser.json());
// Fix cors error: transfer data between two domain
app.use(
  cors({
    origin: process.env.CORS_ORIGIN.split(","),
    credentials: true,
    methods: "GET, POST, PUT, DELETE, PATCH",
    allowedHeaders: "Content-Type",
  })
);

// // middleware multer
app.use(
  multer({
    storage: imgFileStorage,
    fileFilter: imgFileFilter,
  }).array("images")
);

// cau hinh static folder: truy cap duoc cac file co trong folder
app.use("/images", express.static(path.join(__dirname, "images")));

// read cookie from request
app.use(cookieParser());

// middleware for authentication
app.use("/auth", authRoutes);

// middleware for product
app.use("/product", productRoutes);

// middleware for order
app.use("/order", orderRoutes);

// middleware for admin
app.use("/admin", adminRoutes);

// middleware for session
app.use("/session", sessionRoutes);

// global middleware process error
app.use((error, req, res, next) => {
  const statusCode = error.statusCode || 500;
  const message = error.message;
  const data = error.data || [];
  return res.status(statusCode).json({ message, data });
});

// connect to db
mongoose
  .connect(mongoDb_URI)
  .then((result) => {
    const server = app.listen(process.env.PORT || 5000, () => {
      console.log(`Server is running on port: ${process.env.PORT || 5000}`);
    });

    // set up socket.io on server
    const io = require("./socket").init(server, {
      cors: {
        origin: process.env.CORS_ORIGIN.split(","),
      },
    });

    // listener connection from client
    io.on("connection", (socket) => {
      console.log("Client connected: " + socket.id);

      // Lắng nghe khi client tham gia một phòng
      socket.on("joinRoom", (roomId) => {
        socket.join(roomId);

        console.log(`Client ${socket.id} joined room ${roomId}`);
      });

      // Lắng nghe khi client gửi tin nhắn
      socket.on("message", async (data) => {
        const { roomId, sessionId, content, action } = data;

        console.log(data);

        let result;

        if (action === "send") {
          // xu ly luu noi dung chat xuong db
          result = await sendMessage(sessionId, content);
        } else if (action === "close") {
          // xu ly cap nhat trang thai cua session chat
          result = await closeSession(sessionId);
        }

        // Gửi tin nhắn đến tất cả client trong phòng
        io.to(sessionId).emit("message", {
          action,
          payload: {
            ...result,
          },
        });

        // Gửi tin nhắn ve lai phòng admin chat
        io.to("admin chat").emit("message", {
          action,
          payload: {
            ...result,
          },
        });
      });

      socket.on("disconnect", () => {
        console.log("Client disconnected: " + socket.id);
      });
    });
  })
  .catch((err) => console.log(err));

// Show message when connected to DB
mongoose.connection.on("connected", () => {
  console.log(`Connected to DB ${process.env.MONGO_DEFAULT_DB}`);
});

// Show error message when connect to DB failed
mongoose.connection.on("error", (err) => {
  console.log(
    `Error occured when connect to DB ${process.env.MONGO_DEFAULT_DB}`,
    err
  );
});

// Show message when disconnected to DB
mongoose.connection.on("disconnected", () => {
  console.log(`Disconnected to DB ${process.env.MONGO_DEFAULT_DB}`);
});
