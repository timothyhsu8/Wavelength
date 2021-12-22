const express = require('express')
const cors = require('cors')
const app = express()
const http = require('http')
const server = http.createServer(app)

const io = require("socket.io")(server, {
	cors: {
		origin: "http://localhost:3000",
		methods: ["GET", "POST"]
	}
});

// app.use(cors())
const PORT = process.env.PORT || 5000

io.on('connection', (socket) => {
	console.log('a user connected')

	socket.on('join', (room_code) => {
		console.log(room_code)
	})

	socket.on('roll', (state) => {
		console.log('rolled!!')
	})
})


server.listen(PORT, () => {
    console.log(`Server running on port: ${PORT}`);
});