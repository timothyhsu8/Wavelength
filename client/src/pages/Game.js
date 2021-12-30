import { Box, Heading, Center, VStack, Button, Stack, Grid, Text, HStack, useColorMode, useColorModeValue, Icon, Image, 
    AlertDialog, AlertDialogBody, AlertDialogFooter, AlertDialogHeader, AlertDialogContent, AlertDialogOverlay } from '@chakra-ui/react';
import { SunIcon } from '@chakra-ui/icons'
import { useLocation, useNavigate } from 'react-router-dom'
import { BsDice6Fill, BsFillCaretRightFill, BsFillPatchQuestionFill, BsFillPersonFill, BsFilter, BsHurricane, BsKeyFill } from 'react-icons/bs';
import { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import crownIcon from '../images/crown_icon.svg'

export default function Game() {
    let navigate = useNavigate()
    const location = useLocation()
    const cancelRef = useRef()
    const { toggleColorMode } = useColorMode()
    const [showExitConfirmation, setShowExitConfirmation] = useState(false)
    const [socket, setSocket] = useState(null)

    const [roomName, setRoomName] = useState('')
    const [roomCode, setRoomCode] = useState('NONE')
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
    
    const username = location.state.username
    // console.log(location.state.categories)

    // Dark Mode Colors
    const sidebarBgColor = useColorModeValue('gray.50', 'gray.700')
    const borderColor = useColorModeValue('gray.200', 'gray.600')
    const greenTextColor = useColorModeValue('green.600', 'green.300')
    const greenBgColor = useColorModeValue('green.500', 'green.200')
    const blueBgColor = useColorModeValue('blue.500', 'blue.200')
    const buttonTextColor = useColorModeValue('white', 'gray.800')

    const blueIconColor = useColorModeValue('blue.500', 'blue.300')
    const yellowIconColor = useColorModeValue('yellow.500', 'yellow.300')
    const purpleIconColor = useColorModeValue('purple.500', 'purple.300')

    useEffect(() => {
        const newSocket = io.connect(`http://${window.location.hostname}:5000`) // For local testing
        // const newSocket = io.connect(`ws://${window.location.hostname}`) // For deploying to Heroku
        setSocket(newSocket)
        let room_code = 'NONE'

        // Joining a room, use inputted room code
        if (location.state.room_code !== undefined) {
            setRoomCode(location.state.room_code)
            room_code = location.state.room_code
            newSocket.emit('join', { room_code: room_code, username: username })
        }

        // Creating a room, generate a random room code
        else {
            // Waits for socket to connect (so it can set playerlist with the creators socket id)
            newSocket.on('connect', () => {
                room_code = generateRandomCode()
                setRoomCode(room_code)
                setRoomName(location.state.room_name)
                setPlayerList(oldArray => [...oldArray, { id: newSocket.id, username: username, score: 0, isPsychic: true }])
                setIsPsychic(true)

                let room_info = {
                    room_code: room_code,
                    room_name: location.state.room_name,
                    room_password: location.state.room_password,
                    categories: location.state.categories,
                    creator: username
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

    return (
        <Box>
            <Grid templateColumns='0.18fr 0.64fr 0.18fr'>
                {/* Left Column (Player List) */}
                <Box minH='100vh' borderRight='1px' bgColor={sidebarBgColor} borderColor={borderColor}>
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
                        <Stack mt={8} spacing={1}>
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
                                    <VStack>
                                        <Heading size='xl' > Roll was: { rollNum } </Heading> 
                                    </VStack> : '' 
                            }
                        </VStack>
                        { renderMiddleText() }
                        
                        <VStack spacing={12}>
                            { renderControls() }
                        </VStack>
                    </VStack>
                </Box>

                {/* Right Column (Guesses) */}
                <Box p={5} borderLeft='1px' bgColor={sidebarBgColor} borderColor={borderColor}>
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
                    onClick={() => handleGuess(i, username, true)} 
                    isDisabled={disabledGuesses.includes(i) || playerGuessed || !psychicRolled || allPlayersGuessed} _focus={{}} key={i}>
                    {i}
                </Button>
            )
        return guessButtons
    }

    function renderControls() {
        // Render Roll Button (If Psychic)
        if (isPsychic) {
            let buttons = []
            buttons.push(
                <Button w={200} h={90} fontSize={40} borderRadius={100} boxShadow='md' colorScheme='linkedin' leftIcon={<BsDice6Fill />} onClick={roll} isDisabled={psychicRolled} _focus={{}}>
                    Roll
                </Button>
            )

            if (allPlayersGuessed) {
                buttons.push(
                    <Button w={250} h={75} fontSize={30} borderRadius={100} boxShadow='md' colorScheme='orange' leftIcon={<BsFillCaretRightFill />} onClick={nextTurn} _focus={{}}>
                        Next Turn
                    </Button>
                )
            }
            
            return buttons
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
    function handleGuess(guessNum, guesser, selfGuess) {
        setPlayerGuessed(true)
        setPlayerGuess(guessNum)
        setPlayerGuesses(oldArray => [...oldArray, { username: guesser, guess: guessNum }])
        setDisabledGuesses(oldArray => [...oldArray, guessNum])
        
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
                    <HStack spacing={3} key={index}>
                        <Text fontSize={18} fontWeight='medium'> { player_info.username } - { player_info.score } </Text>
                        
                        {/* If player is psychic display an icon next to their name */}
                        { player_info.isPsychic ? <Icon color={purpleIconColor} as={BsHurricane} /> : '' }

                        {/* If player has highest score display an icon next to their name */}
                        {/* { player_info.score === highest_score ? <Image src={crownIcon} boxSize={18} /> : '' } */}
                    </HStack>
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
                        <Heading size='xl' textColor={greenTextColor}> Points Awarded To </Heading>
                        {
                            pointReceiverNames.map((name, index) => {
                                return <Heading size='xl' key={index} > { name } </Heading>
                            })
                        }
                    </VStack>
                </Box>
            )
        }

        // If psychic, display roll number
        if (isPsychic)
            return <Heading size='2xl'> {rollNum} </Heading>
        
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
                        <Button ml={3} colorScheme='red' onClick={() => navigate('/')} _focus={{}} >
                            Leave
                        </Button>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialogOverlay>
            </AlertDialog>
        )
    }

    /* Gets a random integer between min and max */
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