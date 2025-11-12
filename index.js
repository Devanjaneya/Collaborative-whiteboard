let express = require("express");
let app = express();
let httpServer = require("http").createServer(app);
let io = require("socket.io")(httpServer);

// NEW: Import the 'path' module
let path = require("path");

let connections = [];

io.on("connection", (socket) => {
  connections.push(socket);
  console.log(`${socket.id} has connected`);

  socket.on("draw", (data) => {
    connections.forEach((con) => {
      if (con.id !== socket.id) {
        con.emit("ondraw", data);
      }
    });
  });

  socket.on("down", (data) => {
    connections.forEach((con) => {
      if (con.id !== socket.id) {
        con.emit("ondown", data);
      }
    });
  });

  socket.on("clear", () => {
    io.emit("onclear");
  });

  socket.on("disconnect", (reason) => {
    console.log(`${socket.id} has disconnected`);
    connections = connections.filter((con) => con.id !== socket.id);
  });
});

// UPDATED: Use path.join to serve static files from the main directory
app.use(express.static(path.join(__dirname)));

// UPDATED: Use path.join to send the index.html file
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

let PORT = process.env.PORT || 8080;
httpServer.listen(PORT, () => console.log(`Server started on port ${PORT}`));
