const express = require('express')
const cors = require('cors')
const app = express()
const http = require('http')
const path = require('path')

app.use(cors())
app.use(express.static(path.resolve(__dirname, "../client/build")));

app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../client', 'build', 'index.html'));
});


const server = http.createServer(app)

const io = require("socket.io")(server, {
	cors: {
		origin: "*",
		methods: ["GET", "POST"]
	}
});

var room_data = {}
const PORT = process.env.PORT || 5000

io.on('connection', (socket) => {

	// Checks if room exists or not
	socket.on('check_room', (joinData) => {
		console.log({joinData});
		console.log(io.sockets.adapter.rooms.has(joinData.room_code));

		// If room exists, set success to true. False otherwise.
		if (io.sockets.adapter.rooms.has(joinData.room_code))
			joinData.success = true;
		else
			joinData.success = false;

		// Send response back to client
		io.to(socket.id).emit('join', joinData);
	})

	// Create a new room
	socket.on('create_room', (room_info) => {
		try {
			let room_code = room_info.room_code
			console.log(`Creating room ${room_code}`)
			room_data[room_code] = {
				room_code: room_code,
				room_name: room_info.room_name,
				room_password: room_info.room_password,
				categories: room_info.categories,
				
				psychicRolled: false,
				rollNum: '--',

				playerGuesses: [],
				disabledGuesses: [],
				allPlayersGuessed: false,
				pointReceiverNames: [],

				player_list: [
					{
						id: socket.id,
						username: room_info.creator,
						score: 0,
						isPsychic: true
					}
				]
			}
			socket.join(room_code)
		} 
		catch(error) {
			console.log(error)
		}
	})

	// Player joins a room
	socket.on('join', (join_data) => {
		try {
			let room_code = join_data.room_code
			let username = join_data.username

			// If the room exists, add new player to it
			if (room_data[room_code] !== undefined) {
				// Add new player to the player list
				room_data[room_code].player_list.push(
					{
						id: socket.id,
						username: username,
						score: 0,
						isPsychic: false
					}
				)

				socket.join(room_code)
				io.to(socket.id).emit('you_joined', room_data[room_code])
				io.to(room_code).emit('new_player_joined', room_data[room_code].player_list)
			}
		}
		catch(error) {
			console.log(error)
		}
	})

	// Player disconnects, remove them from the room
	socket.on('disconnecting', () => {
		try {
			socket.rooms.forEach((room_code) => {
				if (room_data[room_code] !== undefined) {
					let player_index = -1
					let psychicInfo = null

					// Find index of the disconnecting player
					let player_list = room_data[room_code].player_list
					for (let i = 0; i <  player_list.length; i++)
						if (player_list[i].id === socket.id) {
							player_index = i
							break
						}
					
					// If disconnecting player was psychic, give psychic to the next player in line
					if (player_list[player_index].isPsychic === true) {
						psychicInfo = switchPsychic(player_list)
						resetTurn(room_data[room_code], psychicInfo)

						player_list = psychicInfo.player_list
					}
					
					// Remove player from the player list
					player_list.splice(player_index, 1)

					io.to(room_code).emit('player_disconnected', { updated_player_list: player_list, psychicInfo: psychicInfo })
				}
			})
		}
		catch(error) {
			console.log(error)
		}
	})

	// Player guessed a number
	socket.on('guess', (guessInfo) => {
		try {
			let room_info = room_data[guessInfo.room_code]

			// If a player has already guessed this number, discard guess (Prevents race condition upon multiple players guessing a number at the same time)
			if (checkIfGuessExists(room_info.playerGuesses, guessInfo.guess))
				return

			room_info.playerGuesses.push({ id: guessInfo.id, username: guessInfo.username, guess: guessInfo.guess })
			room_info.disabledGuesses.push(guessInfo.guess)

			io.to(guessInfo.room_code).emit('guess', { info: guessInfo, playerGuesses: room_info.playerGuesses, disabledGuesses: room_info.disabledGuesses })

			// Checks if all players have now guessed
			if (room_info.playerGuesses.length >= room_info.player_list.length - 1) {
				room_info.allPlayersGuessed = true

				// Find closest guess to the actual roll
				let pointReceivers = findPointReceivers(room_info.rollNum, room_info.playerGuesses, getPsychicId(room_info.player_list))
				let pointReceiverNames = room_info.pointReceiverNames

				pointReceivers.forEach((pointReceiverId) => {
					room_info.player_list.forEach((player) => {
						if (player.id === pointReceiverId) {
							player.score += 1
							pointReceiverNames.push(player.username)
						}
					})
				})

				io.to(guessInfo.room_code).emit('all_players_guessed', { pointReceiverNames: pointReceiverNames, updatedPlayerList: room_info.player_list })
			}
		}
		catch(error) {
			console.log(error)
		}
	})

	// New turn, reset guesses, transfer psychic to next player, etc.
	socket.on('new_turn', (gameInfo) => {
		try {
			let psychicInfo = switchPsychic(gameInfo.player_list)
			resetTurn(room_data[gameInfo.room_code], psychicInfo)

			io.to(gameInfo.room_code).emit('new_turn', { psychicId: psychicInfo.psychic_id, player_list: psychicInfo.player_list } )
		}
		catch(error) {
			console.log(error)
		}
	}) 

	// Psychic rolled
	socket.on('roll', (gameInfo) => {
		try {
			room_data[gameInfo.room_code].psychicRolled = true
			room_data[gameInfo.room_code].rollNum = gameInfo.roll_num
			io.to(gameInfo.room_code).emit('roll', { roll_num: gameInfo.roll_num } )
		}
		catch(error) {
			console.log(error)
		}
	})
})

// Returns the player list and psychic id after the psychic role is changed to the next player in line
function switchPsychic(playerList) {
	let player_list = playerList
	let psychic_index = -1
	let psychic_id

	// Find current Psychic, get their index, remove them as psychic
	for (let i = 0; i < player_list.length; i++)
		if (player_list[i].isPsychic) {
			psychic_index = i
			player_list[i].isPsychic = false
			break
		}
	
	// Set psychic back to the first player
	if (psychic_index >= player_list.length - 1) {
		player_list[0].isPsychic = true
		psychic_id = player_list[0].id 
	}
	
	// Set psychic to the next player
	else {
		player_list[psychic_index + 1].isPsychic = true
		psychic_id = player_list[psychic_index + 1].id 
	}

	return { player_list: player_list, psychic_id: psychic_id }
}

// Resets the correct room variables to prepare for the next turn (Resets point receivers, psychic, etc.)
function resetTurn(room_data, psychicInfo) {
	room_data.player_list = psychicInfo.player_list
	room_data.psychicRolled = false
	room_data.playerGuesses = []
	room_data.disabledGuesses = []
	room_data.allPlayersGuessed = false
	room_data.pointReceiverNames = []
}

// Returns an array of all players who should receive points after a round
function findPointReceivers(rollNum, playerGuesses, psychicId) {
	let closestGuessers = []
	let lowestDiff = 100

	for (let i = 0; i < playerGuesses.length; i++) {
		// Player guessed the number exactly
		if (Math.abs(playerGuesses[i].guess - rollNum) === 0) {
			closestGuessers = [playerGuesses[i].id, psychicId]
			break
		}

		// Closer than current closest guess
		else if (Math.abs(playerGuesses[i].guess - rollNum) < lowestDiff) {
			lowestDiff = Math.abs(playerGuesses[i].guess - rollNum)
			closestGuessers = [playerGuesses[i].id]
		}

		// Equal to current closest guess
		else if (Math.abs(playerGuesses[i].guess - rollNum) === lowestDiff) {
			closestGuessers.push(playerGuesses[i].id)
		}
	}

	return closestGuessers
}

// Checks if a player has already guessed a certain number
function checkIfGuessExists(guesses, guessNum) {
	let guessExists = false

	guesses.forEach((guessInfo) => {
		if (guessInfo.guess === guessNum) {
			guessExists = true
		}
	})

	return guessExists
}

/* Returns the id of the current psychic */
function getPsychicId(playerList) {
	for (let i = 0; i < playerList.length; i++)
		if (playerList[i].isPsychic)
			return playerList[i].id
}

server.listen(PORT, () => {
    console.log(`Server running on port: ${PORT}`);
});