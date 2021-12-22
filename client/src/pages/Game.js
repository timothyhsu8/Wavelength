import { Box, Heading, Center, VStack, Button, Stack, Grid, Text, HStack } from '@chakra-ui/react';
import { useLocation } from 'react-router-dom'
import { BsDice6Fill } from 'react-icons/bs';
import { useState, useEffect } from 'react';
import io from 'socket.io-client';

export default function Game() {
    const location = useLocation()
    const [socket, setSocket] = useState(null);
    const [roomCode, setRoomCode] = useState('NONE')
    const [playerList, setPlayerList] = useState([])
    const [playerRolled, setPlayerRolled] = useState(false)
    const [rollNum, setRollNum] = useState('--')
    const [disabledGuesses, setDisabledGuesses] = useState([])
    const [playerGuesses, setPlayerGuesses] = useState([])
    
    const username = location.state.username
    const room_name = location.state.room_name
    // console.log(location.state.categories)
    
    useEffect(() => {
        const newSocket = io.connect(`http://${window.location.hostname}:5000`)
        setSocket(newSocket)
        let room_code = 'NONE'

        // Joining a room, use inputted room code
        if (location.state.room_code !== undefined) {
            setRoomCode(location.state.room_code)
            room_code = location.state.room_code
            newSocket.emit('join', room_code)
        }

        // Creating a room, generate a random room code
        else {
            room_code = generateRandomCode()
            setRoomCode(room_code)
            setPlayerList(oldArray => [...oldArray, username])

            let room_info = {
                room_code: room_code,
                room_name: location.state.room_name,
                room_password: location.state.room_password,
                categories: location.state.categories,
                creator: username
            }
            newSocket.emit('create_room', room_info)
        }
    }, [])

    return (
        <Box>
            <Grid templateColumns='0.18fr 0.64fr 0.18fr'>
                {/* Left Column (Player List) */}
                <Box px={7} py={5} borderRight='1px' borderColor='gray.200'>
                    <Center>
                        <Heading size='lg'>
                            {room_name}
                        </Heading>
                    </Center>

                    <Stack mt={4}>
                        <Text fontSize={20} fontWeight='bold'>
                            Players
                        </Text>
                        {
                            playerList.map((name, index) => {
                                return (
                                    <HStack spacing={3} key={index}>
                                        <Text fontSize={18} fontWeight='medium'> {name} - 10 </Text>
                                    </HStack>
                                )
                            })
                        }
                    </Stack>
                    {/* <Button size='lg' mt={50} borderRadius={100} colorScheme='orange' onClick={nextTurn} _focus={{}}>
                        Next Turn
                    </Button> */}
                    <Stack mt={8} spacing={1}>
                        <Text fontSize={20} fontWeight='bold'> Room Code </Text>
                        <Text fontSize={18} fontWeight='medium'> {roomCode} </Text>
                    </Stack>
                </Box>

                {/* Main Game (Players's Turn, Roll Number, Roll Button) */}
                <VStack mt={4} spacing={170}>
                    <VStack spacing={30}>
                        <Heading size='lg'>
                            Worst Movie - Best Movie
                        </Heading>
                        <Box px={6} py={2} borderRadius='40px' bgColor='green.500'>
                        <Heading size='lg' textColor="white" fontWeight='medium'> Your Turn </Heading>
                        </Box>
                    </VStack>
                    <Heading size='2xl'> {rollNum} </Heading>
                    <VStack spacing={12}>
                        <Button w={200} h={90} fontSize={40} borderRadius={100} boxShadow="md" colorScheme='linkedin' leftIcon={<BsDice6Fill />} onClick={roll} isDisabled={playerRolled} _focus={{}}>
                            Roll
                        </Button>

                        <Grid templateColumns="repeat(10, 1fr)" p={4} borderRadius={5}>
                            {renderGuessButtons()}
                        </Grid>
                    </VStack>
                </VStack>

                {/* Right Column (Guesses) */}
                <Box p={5} borderLeft='1px' borderColor='gray.200'>
                    <Stack>
                        <Text fontSize={20} fontWeight='bold'>
                            Guesses
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
        </Box>
    )

    /* Generates a random number and displays it to the user */
    function roll() {
        let randomInt = getRandomInt(1, 21)
        setRollNum(randomInt)
        setPlayerRolled(true)
        socket.emit('roll');
    }

    /* Renders the buttons 1-20 that players can use to guess */
    function renderGuessButtons() {
        let guessButtons = []
        for (let i = 1; i <= 20; i++)
            guessButtons.push(
                <Button w={75} h={75} m={2.5} colorScheme='facebook' fontSize={25} borderRadius={100} 
                    onClick={() => handleGuess(i)} 
                    isDisabled={disabledGuesses.includes(i)} _focus={{}} key={i}>
                    {i}
                </Button>
            )
        return guessButtons
    }

    /* Handles when a player guesses a number from 1-20 */
    function handleGuess(guessNum) {
        setPlayerGuesses(oldArray => [...oldArray, { username: username, guess: guessNum }])
        setDisabledGuesses(oldArray => [...oldArray, guessNum])
    } 

    /* Resets guesses and moves to the next players turn */
    function nextTurn() {
        setPlayerGuesses([])
        setDisabledGuesses([])
        setPlayerRolled(false)
        setRollNum('--')
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