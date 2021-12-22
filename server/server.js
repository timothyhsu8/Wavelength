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

var room_data = {}

// app.use(cors())
const PORT = process.env.PORT || 5000

io.on('connection', (socket) => {
	console.log('a user connected')

	socket.on('create_room', (room_info) => {
		let room_code = room_info.room_code
		console.log(`Creating room ${room_code}`)
		room_data[room_code] = {
			room_code: room_code,
			room_name: room_info.room_name,
			room_password: room_info.room_password,
			categories: room_info.categories,
			player_list: [room_info.creator]
		}
		console.log(room_data)
		socket.join(room_code)
	})

	socket.on('join', (room_code) => {
		socket.join(room_code)
	})

	socket.on('roll', (state) => {
		console.log('rolled!!')
	})
})


server.listen(PORT, () => {
    console.log(`Server running on port: ${PORT}`);
});