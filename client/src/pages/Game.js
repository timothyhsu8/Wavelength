import { Box, Heading, Center, VStack, Button, Stack, Grid, Text, HStack, useColorMode, useColorModeValue, Icon, Image, Flex, Input,
    AlertDialog, AlertDialogBody, AlertDialogFooter, AlertDialogHeader, AlertDialogContent, AlertDialogOverlay, Spacer } from '@chakra-ui/react';
import { SunIcon } from '@chakra-ui/icons'
import { useLocation, useNavigate } from 'react-router-dom'
import { BsDice6Fill, BsFillBookmarkStarFill, BsFillCaretRightFill, BsFillPatchQuestionFill, BsFillPersonFill, BsFillVinylFill, BsFilter, BsHurricane, BsKeyFill } from 'react-icons/bs';
import { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
// import crownIcon from '../images/crown_icon.svg'

export default function Game() {
    let navigate = useNavigate()
    const location = useLocation()
    const cancelRef = useRef()
    const { toggleColorMode } = useColorMode()
 
    const [showUsernameInput, setShowUsernameInput] = useState(false)
    const [showPasswordInput, setShowPasswordInput] = useState(false)
    const [incorrectPassword, setIncorrectPassword] = useState(false)
    const [showExitConfirmation, setShowExitConfirmation] = useState(false)
    const [socket, setSocket] = useState(null)

    const [roomName, setRoomName] = useState('')
    const [roomCode, setRoomCode] = useState('NONE')
    const [roomPassword, setRoomPassword] = useState('')
    const [playerList, setPlayerList] = useState([])
   
    const [psychicRolled, setPsychicRolled] = useState(false)
    const [rollNum, setRollNum] = useState('--')

    const [disabledGuesses, setDisabledGuesses] = useState([])
    const [playerGuess, setPlayerGuess] = useState(-1)
    const [playerGuessed, setPlayerGuessed] = useState(false)
    const [playerGuesses, setPlayerGuesses] = useState([])
    const [allPlayersGuessed, setAllPlayersGuessed] = useState(false)
    const [pointReceiverNames, setPointReceiverNames] = useState([])

    const [isPsychic, setIsPsychic] = useState(false)
    
    const [username, setUsername] = useState('')
    // console.log(location.state.categories)

    // Dark Mode Colors
    const sidebarBgColor = useColorModeValue('gray.50', 'gray.700')
    const borderColor = useColorModeValue('gray.200', 'gray.600')
    const blueTextColor = useColorModeValue('blue.500', 'blue.300')
    
    const greenTextColor = useColorModeValue('green.600', 'green.300')
    const greenBgColor = useColorModeValue('green.500', 'green.200')
    const blueBgColor = useColorModeValue('blue.500', 'blue.200')
    const buttonTextColor = useColorModeValue('white', 'gray.800')

    const blueIconColor = useColorModeValue('blue.500', 'blue.300')
    const yellowIconColor = useColorModeValue('yellow.500', 'yellow.300')
    const purpleIconColor = useColorModeValue('purple.500', 'purple.300')

    useEffect(() => {
        const newSocket = io.connect(`http://${window.location.hostname}:5000`) // For local testing 
        // const newSocket = io.connect(`ws://${window.location.hostname}`) // For deploying to Heroku //
        setSocket(newSocket)
        let room_code = 'NONE'

        // Joining a room through a link, prompt for a username
        if (location.state === null) {
            setShowUsernameInput(true)
        }

        // Joining a room, use inputted room code
        else if (location.state.action === 'join') {
            setUsername(location.state.username)
            setRoomCode(location.state.room_code)
            room_code = location.state.room_code
            newSocket.emit('join', { room_code: room_code, username: location.state.username })
        }

        // Creating a room, generate a random room code
        else {
            // Waits for socket to connect (so it can set playerlist with the creators socket id)
            newSocket.on('connect', () => {
                room_code = location.state.room_code
                setUsername(location.state.username)
                setRoomCode(room_code)
                setRoomName(location.state.room_name)
                setRoomPassword(location.state.room_password)
                setPlayerList(oldArray => [...oldArray, { id: newSocket.id, username: location.state.username, score: 0, isPsychic: true }])
                setIsPsychic(true)

                let room_info = {
                    room_code: room_code,
                    room_name: location.state.room_name,
                    room_password: location.state.room_password,
                    // categories: location.state.categories,
                    creator: location.state.username
                }
                newSocket.emit('create_room', room_info)
            })
        }

        /* Sets client's state as the current state of the game */
        newSocket.on('you_joined', (room_data) => {
            setRoomName(room_data.room_name)
            setPsychicRolled(room_data.psychicRolled)
            setPlayerGuesses(room_data.playerGuesses)
            setDisabledGuesses(room_data.disabledGuesses)
            setAllPlayersGuessed(room_data.allPlayersGuessed)
            setPointReceiverNames(room_data.pointReceiverNames)
            setRollNum(room_data.rollNum)
            setRoomPassword(room_data.room_password)
            
            if (room_data.room_password !== '')
                setShowPasswordInput(true)

            // setPlayerList(room_data.player_list)
        })

        newSocket.on('new_player_joined', (updated_player_list) => {
            setPlayerList(updated_player_list)
        })

        // A player disconnected, remove them from the player list and switch to next psychic if they had that role
        newSocket.on('player_disconnected', (gameInfo) => {
            let psychicInfo = gameInfo.psychicInfo
            setPlayerList(gameInfo.updated_player_list)
    
            // Disconnected player was Psychic, give role to the next player in line
            if (psychicInfo !== null) {
                setNextTurn(gameInfo.updated_player_list, newSocket.id, gameInfo.psychicInfo.psychic_id)
            }
        })

        // A player guesses a number, grey it out and add it to the guesses list
        newSocket.on('guess', (guessInfo) => {
            // Incoming guess is this client's guess, make the proper UI adjustments
            if (guessInfo.info.id === newSocket.id) {
                setPlayerGuessed(true)
                setPlayerGuess(guessInfo.info.guessNum)
            }

            setPlayerGuesses(guessInfo.playerGuesses)
            setDisabledGuesses(guessInfo.disabledGuesses)
        })

         // Sets the game to the next turn, resetting guesses and moving to the next psychic
         newSocket.on('new_turn', (gameInfo) => {
            setNextTurn(gameInfo.player_list, newSocket.id, gameInfo.psychicId)
        })

        // Sets the game to the next turn, resetting guesses and moving to the next psychic
        newSocket.on('roll', (gameInfo) => {
            setRollNum(gameInfo.roll_num)
            setPsychicRolled(true)
        })

        // All players have guessed, display who received points
        newSocket.on('all_players_guessed', (gameInfo) => {
            setAllPlayersGuessed(true)
            setPlayerList(gameInfo.updatedPlayerList)
            setPointReceiverNames(gameInfo.pointReceiverNames)
        })
    }, [])


    // If player joined through a direct link, only display username prompt
    if (showUsernameInput) {
        return (
            renderUsernamePrompt()
        )
    }

    return (
        <Box>
            <Grid templateColumns='1fr 3.3fr 1fr'>
                {/* Left Column (Player List) */}
                <Box minW={200} minH='100vh' borderRight='1px' bgColor={sidebarBgColor} borderColor={borderColor}>
                    {/* Return Home Button */}
                    <Button w='full' h={14} fontSize={20} borderBottom='1px' borderColor={borderColor} borderRadius={0} bgColor={sidebarBgColor} 
                        leftIcon={<Icon as={BsFilter} color={blueIconColor} />} 
                        onClick={() => setShowExitConfirmation(true)}
                        _focus={{}}>
                        Wavelength
                    </Button>
                    
                    <Box px={7} py={5}>
                        <Center>
                            <Heading size='lg'>
                                {roomName}
                            </Heading>
                        </Center>

                        <Stack mt={6}>
                            <Text fontSize={22} fontWeight='bold'>
                                Players
                                <Icon as={BsFillPersonFill} pos='relative' color={blueIconColor} top={1} right={-2} />
                            </Text>
                            { renderPlayerList() }
                        </Stack>
                        <Stack mt={40} spacing={1}>
                            <Text fontSize={22} fontWeight='bold'> 
                                Room Code 
                                <Icon as={BsKeyFill} pos='relative' color={yellowIconColor} top={1} right={-2} />
                            </Text>
                            <Text fontSize={20} fontWeight='medium'> {roomCode} </Text>
                        </Stack>
                    </Box>
                </Box>

                {/* Main Game (Players's Turn, Roll Number, Roll Button) */}
                <Box>
                    {/* Dark Mode Button */}
                    <Button float="right" variant="ghost" onClick={toggleColorMode} _focus={{}}>
                        <SunIcon />
                    </Button>

                    <VStack mt={8} spacing={170}>
                        <VStack spacing={30}>
                            {/* <Heading size='lg'>
                                Freeplay
                            </Heading> */}
                            { renderTurn() }
                            { 
                                allPlayersGuessed ? 
                                    <Center px={2} pos='relative' left={6}>
                                        { renderGraph() }
                                    </Center>
                                    : '' 
                            }
                        </VStack>
                        { renderMiddleText() }
                        
                        <VStack spacing={12}>
                            { renderControls() }
                        </VStack>
                    </VStack>
                </Box>

                {/* Right Column (Guesses) */}
                <Box minW={200} p={5} borderLeft='1px' bgColor={sidebarBgColor} borderColor={borderColor}>
                    <Stack>
                        <Text mt={2} fontSize={22} fontWeight='bold'>
                            Guesses
                            <Icon as={BsFillPatchQuestionFill} pos='relative' color={purpleIconColor} top={1} right={-2} />
                        </Text>
                        {
                            playerGuesses.map((guess, index) => {
                                return (
                                    <HStack spacing={3} key={index}>
                                        <Button w={45} h={45} borderRadius={100} colorScheme='blue' _hover={{cursor:"auto"}} _active={{}} _focus={{}}> {guess.guess} </Button>
                                        <Text fontSize={18} fontWeight='medium'> {guess.username} </Text>
                                    </HStack>
                                )
                            })
                        }
                    </Stack>
                </Box>
            </Grid>
            { renderReturnHomeModal() }
            { renderPasswordInputModal() }
        </Box>
    )

    /* Generates a random number and displays it to the user */
    function roll() {
        let randomInt = getRandomInt(1, 21)
        // setRollNum(randomInt)
        socket.emit('roll', { room_code: roomCode, roll_num: randomInt });
    }

    /* Renders the buttons 1-20 that players can use to guess */
    function renderGuessButtons() {
        let guessButtons = []
        for (let i = 1; i <= 20; i++)
            guessButtons.push(
                <Button w={75} h={75} m={2.5} colorScheme={getGuessButtonColor(i)} fontSize={25} borderRadius={100} 
                    onClick={() => handleGuess(i)} 
                    isDisabled={disabledGuesses.includes(i) || playerGuessed || !psychicRolled || allPlayersGuessed} _focus={{}} key={i}>
                    {i}
                </Button>
            )
        return guessButtons
    }

    function renderControls() {
        // Render Roll Button (If Psychic)
        if (isPsychic) {
            if (allPlayersGuessed) {
                return (
                    <Button w={250} h={75} fontSize={30} borderRadius={100} boxShadow='md' colorScheme='pink' leftIcon={<BsFillCaretRightFill />} onClick={nextTurn} _focus={{}}>
                        Next Turn
                    </Button>
                )
            }

            else {
                return (
                    <Button w={200} h={90} fontSize={40} borderRadius={100} boxShadow='md' colorScheme='linkedin' leftIcon={<BsDice6Fill />} onClick={roll} isDisabled={psychicRolled} _focus={{}}>
                        Roll
                    </Button>
                )
            }
        }

        // Render Guess Buttons (If Not Psychic)
        else {
            return (
                <Grid templateColumns="repeat(10, 1fr)" p={4} borderRadius={5}>
                    { renderGuessButtons() }
                </Grid>
            )
        }
        
    }

    /* Handles when a player guesses a number from 1-20 */
    function handleGuess(guessNum) {    
        socket.emit('guess', { room_code: roomCode, username: username, id: socket.id, guess: guessNum })
    } 

    /* Sends socket event to switch to the next turn */
    function nextTurn() {
        socket.emit('new_turn', { room_code: roomCode, player_list: playerList })
    }

    /* Resets guesses and moves to the next players turn */
    function setNextTurn(updated_player_list, socketId, psychicId) {
        setPlayerList(updated_player_list)
        setPlayerGuess(-1)
        setPlayerGuessed(false)
        setPlayerGuesses([])
        setDisabledGuesses([])
        setPsychicRolled(false)
        setAllPlayersGuessed(false)
        setPointReceiverNames([])

        // If you are now the psychic
        if (psychicId === socketId) {
            setIsPsychic(true)
            setRollNum('--')
        }

        // If you are not the psychic
        else {
            setIsPsychic(false)
        }
    }

    /* Renders the player list */
    function renderPlayerList() {
        // Finds the highest score in the lobby
        let highest_score = 0
        playerList.forEach((player_info) => {
            if (player_info.score > highest_score)
                highest_score = player_info.score
        })

        // Renders player names and scores
        return (
            playerList.map((player_info, index) => {
                return (
                    <Flex>
                        {/* <HStack> */}
                            <Text fontWeight='medium'> { player_info.username } 
                            { player_info.isPsychic ? <Icon pos='relative' ml='8px' top='2.5px' color={purpleIconColor} as={BsFillVinylFill} /> : '' }
                            { player_info.score === highest_score  ? <Icon  pos='relative' ml='8px' top='2.5px' color={yellowIconColor} as={BsFillBookmarkStarFill} /> : '' }
                            </Text>
                        {/* </HStack> */}
                        <Spacer />
                        <Text fontWeight='medium'> { player_info.score } </Text>
                    </Flex>
                )
            })
        )
    }

    /* Renders the current player's turn (X's Turn OR Your Turn) */
    function renderTurn() {
        // Your Turn
        if (isPsychic)
            return (
                <Box px={6} py={2} borderRadius='40px' bgColor={greenBgColor}>
                    <Heading size='lg' textColor={buttonTextColor} fontWeight='medium'> Your Turn </Heading>
                </Box>
            )
        
        // Different player's turn
        return (
            <Box px={6} py={2} borderRadius='40px' bgColor={blueBgColor}>
                <Heading size='lg' textColor={buttonTextColor} fontWeight='medium'> { getPsychic() }'s Turn </Heading>
            </Box>
        )
    }

    /* Renders the text in the middle of the game board (Roll number, Waiting for x, point receivers) */
    function renderMiddleText() {
        // If all players have guessed, display the players who received points
        if (allPlayersGuessed) {
            return (
                <Box>
                    <VStack spacing={5}> 
                        <Heading size='lg' textColor={greenTextColor}> Points Awarded To </Heading>
                        {
                            pointReceiverNames.map((name, index) => {
                                return <Heading size='lg' key={index} > { name } </Heading>
                            })
                        }
                    </VStack>
                </Box>
            )
        }

        // If psychic, display roll number
        if (isPsychic)
            return <Button w={120} h={120} fontSize={40} borderRadius={100} colorScheme='teal' _hover={{cursor:"auto"}} _active={{}} _focus={{}}> {rollNum} </Button>
        
        // If guesser and psychic has rolled, display roll text
        if (psychicRolled)
            return <Heading size='xl'> Take your guess! </Heading>

        // If guesser and psychic hasn't rolled, display waiting text
        return <Heading size='xl'> Waiting for { getPsychic() } to roll... </Heading>
    }

    /* Returns the name of the current psychic */
    function getPsychic() {
        for (let i = 0; i < playerList.length; i++)
            if (playerList[i].isPsychic)
                return playerList[i].username
    }

    /* Returns the correct color for each guess button */
    function getGuessButtonColor(i) {
        // If this button is this client's guess, color button green
        if (playerGuess === i)
            return 'green'
        // If this button is a different client's guess, color button black
        if (disabledGuesses.includes(i))
            return 'blue'
        // If this button is unclicked, color button blue
        return 'facebook'
    }

    /* Renders the graph that displays how close each player was to the actual roll */
    function renderGraph() {
        let graphNumbers = []
        for (let i = 1; i <= 20; i++)
            graphNumbers.push(
                renderGraphNumbers(i)
            )

        return  (
            <Flex>
                { graphNumbers }
            </Flex>
        )
    }

    /* Renders a single number for the graph (including #, Actual, Guesser Names) */
    function renderGraphNumbers(i) {
        // Determines if a player has guessed this number, and stores their information if so
        let guesserInfo = null
        playerGuesses.forEach((guessInfo) => {
            if (guessInfo.guess === i) 
                guesserInfo = guessInfo
        })

        // Determines correct text color
        let textColor = ''
        if (rollNum === i)
            textColor = greenTextColor
        else if (guesserInfo !== null)
            textColor = blueTextColor

        return (
            <VStack maxW={guesserInfo !== null ? '100' : ''} mx={4} spacing={2}>
                {/* <Text> Closest </Text> */}
                <Text fontSize={22} key={i} fontWeight={ rollNum === i || guesserInfo !== null ? 'semibold' : 'normal' }  
                    textColor={textColor} >
                    {i}
                </Text>
                { rollNum === i ? 
                    <Text textColor={greenTextColor}> Actual </Text> : ''
                }
                { guesserInfo !== null ? 
                    <Text textColor={blueTextColor}> {guesserInfo.username} </Text> : ''
                }
            </VStack>
        )
    }

    /* Returns player to the homepage and disconnects them from the lobby */
    function leaveGame() {
        socket.disconnect()
        navigate('/')
    }

    /* Enters the game from a direct link (After a username is inputted) */
    function enterGame(event) {
        event.preventDefault()
        let room_code = window.location.pathname.slice(-5)
        setUsername(event.target.username_input.value)
        setRoomCode(room_code)
        socket.emit('join', { room_code: room_code, username: event.target.username_input.value })
        setShowUsernameInput(false)
    }

    /* Checks if the inputted password is correct or incorrect */
    function submitPassword(event) {
        event.preventDefault()
        if (event.target.password_input.value === roomPassword)
            setShowPasswordInput(false)
        
        // If password is incorrect, display an error message
        else
            setIncorrectPassword(true)

    }

    /* Renders confirmation modal for returning to the homepage (Are you sure you want to exit this game?) */
    function renderReturnHomeModal() {
        return (
            <AlertDialog
                isOpen={showExitConfirmation}
                leastDestructiveRef={cancelRef}
                onClose={() => setShowExitConfirmation(false)}
            >
                <AlertDialogOverlay>
                    <AlertDialogContent>
                        <AlertDialogHeader fontSize='lg' fontWeight='bold'>
                            Leave Game
                        </AlertDialogHeader>

                        <AlertDialogBody>
                            Are you sure you want to leave this game?
                        </AlertDialogBody>

                        <AlertDialogFooter>
                        <Button ref={cancelRef} onClick={() => setShowExitConfirmation(false)} _focus={{}} >
                            Cancel
                        </Button>
                        <Button ml={3} colorScheme='red' onClick={leaveGame} _focus={{}} >
                            Leave
                        </Button>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialogOverlay>
            </AlertDialog>
        )
    }

    /* Renders confirmation modal for returning to the homepage (Are you sure you want to exit this game?) */
    function renderPasswordInputModal() {
        return (
                <AlertDialog
                    isOpen={showPasswordInput}
                    leastDestructiveRef={cancelRef}
                >
                    <AlertDialogOverlay>
                        <AlertDialogContent>
                            <form onSubmit={submitPassword}>
                                <AlertDialogHeader fontSize='lg' fontWeight='bold'>
                                    Enter Room Password
                                </AlertDialogHeader>

                                <AlertDialogBody>
                                    <Input name='password_input' />
                                    { incorrectPassword ? <Text fontSize={14} textColor='red.500'> Incorrect Password </Text> : ''  } 
                                </AlertDialogBody>

                                <AlertDialogFooter>
                                    <Button ref={cancelRef} onClick={() => navigate('/')} _focus={{}} >
                                        Cancel
                                    </Button>
                                    <Button type='submit' ml={3} colorScheme='green' _focus={{}} >
                                        Join
                                    </Button>
                                </AlertDialogFooter>
                            </form>
                        </AlertDialogContent>
                    </AlertDialogOverlay>
                </AlertDialog>
        )
    }

    /* Renders modal for inputting a username (if the user joined through a direct link rather than through the homepage) */
    function renderUsernamePrompt() {
        return (
            <AlertDialog
                isOpen={showUsernameInput}
                leastDestructiveRef={cancelRef}
            >
                <AlertDialogOverlay>
                    <AlertDialogContent>
                        <form onSubmit={enterGame}>
                            <AlertDialogHeader fontSize='lg' fontWeight='bold'>
                                Enter A Username
                            </AlertDialogHeader>

                            <AlertDialogBody>
                                <Input name='username_input' />
                                {/* { incorrectPassword ? <Text fontSize={14} textColor='red.500'> Incorrect Password </Text> : ''  }  */}
                            </AlertDialogBody>

                            <AlertDialogFooter>
                                <Button ref={cancelRef} onClick={() => navigate('/')} _focus={{}} >
                                    Cancel
                                </Button>
                                <Button type='submit' ml={3} colorScheme='green' _focus={{}} >
                                    Join
                                </Button>
                            </AlertDialogFooter>
                        </form>
                    </AlertDialogContent>
                </AlertDialogOverlay>
            </AlertDialog>
        )
    }

    /* Generates a random 5 letter room code */
    function generateRandomCode() {
        const randomChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
        let code = ''
        for (let i = 0; i < 5; i++)
            code += randomChars.charAt(getRandomInt(0, 26))
        return code
    }

    /* Gets a random integer between min and max */
    function getRandomInt(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
    }
}