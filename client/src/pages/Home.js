import { Box, Container, Stack, Center, Heading, Input, Text, FormControl, FormLabel, SimpleGrid, GridItem, Icon, Button, Tabs, TabList, Tab, Textarea, useColorMode, useColorModeValue, Tooltip } from '@chakra-ui/react';
import { SunIcon } from '@chakra-ui/icons'
import { BsFilter } from "react-icons/bs";
import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from "framer-motion"
import { io } from 'socket.io-client';

export default function Home() {
    let navigate = useNavigate();
    const [socket, setSocket] = useState(null)
    const [formType, setFormType] = useState('create');
    const [animationPlayed, setAnimationPlayed] = useState(false);
    const [usernameError, setUsernameError] = useState(false);
    const [roomcodeError, setRoomcodeError] = useState(false);
    const [isMounted, setIsMounted] = useState(true);
    const { toggleColorMode } = useColorMode();
    
    const [username, setUsername] = useState("");

    const inputBgColor = useColorModeValue("white", "gray.700");
    const bgColor = useColorModeValue("gray.100", "gray.700");
    const borderColor = useColorModeValue("gray.200", "gray.600");

    const MotionBox = motion(Box);
    const MotionButton = motion(Button);
    const MotionText = motion(Text);

    useEffect(() => {
        const newSocket = io.connect(`http://${window.location.hostname}:5000`) // For local testing 
        // const newSocket = io.connect(`ws://${window.location.hostname}`) // For deploying to Heroku //
        setSocket(newSocket);
        
        newSocket.on('join', (joinData) => {
            // Joined room successfully
            if (joinData.success) {
                navigate(`/game/${joinData.room_code}`, 
                    { 
                        state: {
                            action: 'join',
                            username: joinData.username,
                            room_code: joinData.room_code,
                            // room_password: event.target.room_password.value
                        }
                    })
            }
            
            // Room doesn't exist
            else {
                setRoomcodeError(true);
            }
        })
    }, []);

    return (
        <Box>

            <Button float="right" variant="ghost" onClick={toggleColorMode} _focus={{}}>
                <SunIcon />
            </Button>
            <AnimatePresence>
            {
                isMounted && <motion.div initial={ !animationPlayed ? { scale:0 } : '' } exit={{ scale:0 }} animate={{ scale: 1 }} onAnimationComplete={() => setAnimationPlayed(true)}
                transition={{
                    type: "spring",
                    stiffness: 260,
                    damping: 40
                }}
            >
                <Container maxW="container.xl">
                    <Center>
                        <Tabs mt={20} variant='enclosed' borderColor={borderColor}>
                            <TabList>
                                <Tab onClick={() => changeForm('create')} _hover={{ bgColor: formType !== 'create' ? 'gray.200' : '' }} _focus={{}} borderBottom='none' bgColor={formType === 'create' ? bgColor : ''} > Create Game </Tab>
                                <Tab onClick={() => changeForm('join')} _hover={{ bgColor: formType !== 'join' ? 'gray.200' : '' }} _focus={{}} borderBottom='none' bgColor={formType === 'join' ? bgColor : ''} > Join Game </Tab>
                            </TabList>

                            {
                                formType === 'create' ?
                                <Stack w={500} p={10} spacing={4} border='1px' borderColor={borderColor} bgColor={bgColor}>
                                    {/* Wavelength Header */}
                                    <Center> 
                                        <Heading fontFamily="cairo"> 
                                            <Icon as={BsFilter} pos='relative' color='blue.500' top={1.5} right={2}/>
                                            Wavelength 
                                        </Heading> 
                                    </Center>

                                    {/* Input Form */}
                                    <form onSubmit={(event) => enterGame(event, 'create')}>
                                        <SimpleGrid rowGap={6}>
                                            <GridItem>
                                                <FormLabel> Username </FormLabel>
                                                <Input name='username' placeholder="Username" bgColor={inputBgColor} />
                                                {
                                                    usernameError ? <motion.div initial={{ opacity:0 }} animate={{ opacity: 1 }}><Text pos='absolute' fontSize='14' color='red.500' fontWeight='medium'> Please enter a username </Text> </motion.div> : ''
                                                }
                                            </GridItem>
                                            
                                            <GridItem>
                                                <FormLabel> Room Password </FormLabel>
                                                <Input name='room_password' placeholder="Room Password" bgColor={inputBgColor} />
                                            </GridItem>
                                            <GridItem mt={4}>
                                                <MotionButton w='full' type='submit' colorScheme='green' whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                                    Create Game
                                                </MotionButton>
                                            </GridItem>
                                        </SimpleGrid>
                                    </form>
                                </Stack>
                                :
                                <Stack w={500} p={10} spacing={4} border='1px' borderColor={borderColor} bgColor={bgColor}>
                                    {/* Wavelength Header */}
                                    <Center> 
                                        <Heading fontFamily="cairo"> 
                                            <Icon as={BsFilter} pos='relative' color='blue.500' top={1.5} right={2}/>
                                            Wavelength 
                                        </Heading> 
                                    </Center>

                                    {/* Input Form */}
                                    <form onSubmit={(event) => enterGame(event, 'join')}>
                                        <SimpleGrid rowGap={6}>
                                            <GridItem>
                                                <FormLabel> Username </FormLabel>
                                                <Input name='username' placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} bgColor={inputBgColor} />
                                                {
                                                    usernameError ? <motion.div initial={{ opacity:0 }} animate={{ opacity: 1 }}><Text pos='absolute' fontSize='14' color='red.500' fontWeight='medium'> Please enter a username </Text> </motion.div> : ''
                                                }
                                            </GridItem>
                                            <GridItem>
                                                <FormLabel> Room Code </FormLabel>
                                                <Input name='room_code' placeholder="Room Code" bgColor={inputBgColor} />
                                                {
                                                    roomcodeError? <motion.div initial={{ opacity:0 }} animate={{ opacity: 1 }}><Text pos='absolute' initial={{ opacity:0 }} animate={{ opacity: 1 }} fontSize='14' color='red.500' fontWeight='medium'> Room does not exist </Text> </motion.div> : ''
                                                }
                                            </GridItem>
                                            {/* <GridItem>
                                                <FormLabel> Room Password </FormLabel>
                                                <Input name='room_password' bgColor={inputBgColor} />
                                            </GridItem> */}
                                            <GridItem mt={4}>
                                                <MotionButton w='full' type='submit' colorScheme='blue' whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                                    Join Game
                                                </MotionButton>
                                            </GridItem>
                                        </SimpleGrid>
                                    </form>
                                </Stack>
                            }
                        </Tabs>
                    </Center>
                </Container>
            </motion.div>
            }
            </AnimatePresence>
        </Box>
    )

    // Changes form type
    function changeForm(destForm) {
        if (formType === destForm)
            return;

        setFormType(destForm);
        setUsernameError(false);
        setRoomcodeError(false);
    }

    function enterGame(event, action) {
        event.preventDefault();

        const username = event.target.username.value;

        if (username.trim() === "") {
            setUsernameError(true);
        }

        else {
            // Creating Game
            if (action === 'create') {
                setIsMounted(false);
                let room_code = generateRandomCode()
                navigate(`/game/${room_code}`, 
                { 
                    state: {
                        action: 'create',
                        username: username,
                        room_password: event.target.room_password.value,
                        room_code: room_code
                        // categories: event.target.categories.value
                    }
                })
            }
            
            // Joining Game
            else {
                const room_code = event.target.room_code.value;
                socket.emit('check_room', { room_code, username });
            }
            setUsernameError(false);
            setRoomcodeError(false);
        }

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