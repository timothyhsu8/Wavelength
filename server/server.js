const express = require('express')
const app = express()
const http = require('http')
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const cors = require('cors')

app.use(cors())
const PORT = process.env.PORT || 5000

server.listen(PORT, () => {
    console.log(`Server running on port: ${PORT}`);
  });