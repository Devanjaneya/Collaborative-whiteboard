let express = require("express");
let app = express();
let httpServer = require("http").createServer(app);
let io = require("socket.io")(httpServer);
let connections = [];

io.on("connection", (socket) => {
  connections.push(socket);
  console.log(`${socket.id} has connected`);

  socket.on("draw", (data) => {
    // This code is unchanged. It just passes the new data object (with color/width)
    connections.forEach((con) => {
      if (con.id !== socket.id) {
        con.emit("ondraw", data); // 'data' now contains {x, y, color, width, tool}
      }
    });
  });

  socket.on("down", (data) => {
    // This code is also unchanged.
    connections.forEach((con) => {
      if (con.id !== socket.id) {
        con.emit("ondown", data); // 'data' now contains {x, y, color, width, tool}
      }
    });
  });

  // NEW: Listen for the "clear" event
  socket.on("clear", () => {
    // Emit "onclear" to ALL connected clients (including the sender)
    io.emit("onclear");
  });

  socket.on("disconnect", (reason) => {
    console.log(`${socket.id} has disconnected`);
    connections = connections.filter((con) => con.id !== socket.id);
  });
});

app.use(express.static("public"));
let PORT = process.env.PORT || 8080;
httpServer.listen(PORT, () => console.log(`Server started on port ${PORT}`));
