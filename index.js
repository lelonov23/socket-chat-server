const app = require("express")();
const cors = require("cors");
app.use(cors());
const http = require("http").createServer(app);
const io = require("socket.io")(http, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});
const PORT = 8080;
const STATIC_CHANNELS = [
  {
    name: "Global chat",
    participants: 0,
    id: 1,
    sockets: [],
    messages: [],
  },
  {
    name: "Another chat",
    participants: 0,
    id: 2,
    sockets: [],
    messages: [],
  },
];

app.get("/getChannels", (req, res) => {
  res.json({
    channels: STATIC_CHANNELS,
  });
});

http.listen(PORT, () => {
  console.log(`listening on ${PORT}`);
});

io.on("connection", (socket) => {
  console.log("new client connected");
  socket.emit("connection", null);
  socket.on("channel-join", (id) => {
    console.log("channel-join", id);
    STATIC_CHANNELS.forEach((channel) => {
      if (channel.id === id) {
        if (!channel.sockets.includes(socket.id)) {
          channel.sockets.push(socket.id);
          channel.participants++;
          io.emit("channel", channel);
        }
      } else {
        if (!channel.sockets.includes(socket)) {
          const index = channel.sockets.indexOf(socket);
          channel.sockets.splice(index, 1);
          channel.participants--;
          io.emit("channel", channel);
        }
      }
    });
    return id;
  });

  socket.on("send-message", (message) => {
    console.log(message);
    io.emit("message", message);
  });

  socket.on("disconnect", () => {
    STATIC_CHANNELS.forEach((c) => {
      let index = c.sockets.indexOf(socket.id);
      if (index != -1) {
        c.sockets.splice(index, 1);
        c.participants--;
        io.emit("channel", c);
      }
    });
  });
});
