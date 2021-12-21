import { Box, Heading, Center, VStack, Button, Stack, Grid, Text, HStack } from '@chakra-ui/react';
import { useLocation } from 'react-router-dom'
import { BsDice6Fill, BsFillDoorClosedFill } from 'react-icons/bs';
import { useState } from 'react';

export default function Game() {
    const location = useLocation()
    const [playerRolled, setPlayerRolled] = useState(false)
    const [rollNum, setRollNum] = useState('--')
    const [disabledGuesses, setDisabledGuesses] = useState([])
    const [playerGuesses, setPlayerGuesses] = useState([])
    const username = location.state.username

    return (
        <Box>
            <Grid templateColumns='0.18fr 0.64fr 0.18fr'>
                {/* Left Column (Player List) */}
                <Box px={7} py={5} borderRight='1px' borderColor='gray.200'>
                    <Stack>
                        <Text fontSize={20} fontWeight='bold'>
                            Players
                        </Text>
                        {
                            playerGuesses.map((guess) => {
                                return (
                                    <HStack spacing={3}>
                                        <Text fontSize={18} fontWeight='medium'> {guess.username} - 10 </Text>
                                    </HStack>
                                )
                            })
                        }
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

                        <Grid templateColumns="repeat(10, 1fr)">
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
                            playerGuesses.map((guess) => {
                                return (
                                    <HStack spacing={3}>
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

    /* Gets a random integer between min and max */
    function getRandomInt(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
    }
}