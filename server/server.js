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

	// Create a new room
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
		socket.join(room_code)
	})

	// Player joins a room
	socket.on('join', (join_data) => {
		let room_code = join_data.room_code
		let username = join_data.username

		// If the room exists, add new player to it
		if (room_data[room_code] !== undefined) {
			// Add new player to the player list
			room_data[room_code].player_list.push(username)

			socket.join(room_code)
			io.to(socket.id).emit('you_joined', room_data[room_code])
			io.to(room_code).emit('new_player_joined', room_data[room_code].player_list)
		}
	})

	socket.on('roll', (state) => {
		console.log('rolled!!')
	})
})


server.listen(PORT, () => {
    console.log(`Server running on port: ${PORT}`);
});