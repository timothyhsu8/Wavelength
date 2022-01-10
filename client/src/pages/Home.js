import { Box, Container, Stack, Center, Heading, Input, FormControl, FormLabel, SimpleGrid, GridItem, Icon, Button, Tabs, TabList, Tab, Textarea, useColorMode, useColorModeValue } from '@chakra-ui/react';
import { SunIcon } from '@chakra-ui/icons'
import { BsFilter } from "react-icons/bs";
import { useNavigate } from 'react-router-dom'
import { useState } from 'react';

export default function Home() {
    let navigate = useNavigate()
    const [formType, setFormType] = useState('create')
    const { toggleColorMode } = useColorMode()
    
    const inputBgColor = useColorModeValue("white", "gray.700")
    const bgColor = useColorModeValue("gray.100", "gray.700")
    const borderColor = useColorModeValue("gray.200", "gray.600")

    return (
        <Box>
            <Button float="right" variant="ghost" onClick={toggleColorMode} _focus={{}}>
                <SunIcon />
            </Button>
            <Container maxW="container.xl">
                <Center>
                    <Tabs mt={20} variant='enclosed' borderColor={borderColor}>
                        <TabList>
                            <Tab onClick={() => setFormType('create')} _focus={{}} borderBottom='none' bgColor={formType === 'create' ? bgColor : ''} > Create Game </Tab>
                            <Tab onClick={() => setFormType('join')} _focus={{}} borderBottom='none' bgColor={formType === 'join' ? bgColor : ''} > Join Game </Tab>
                        </TabList>

                        {
                            formType === 'create' ?
                            <Stack w={500} p={10} spacing={4} border='1px' borderColor={borderColor} bgColor={bgColor}>
                                {/* Wavelength Header */}
                                <Center> 
                                    <Heading> 
                                        <Icon as={BsFilter} pos='relative' color='blue.500' top={1.5} right={2}/>
                                        Wavelength 
                                    </Heading> 
                                </Center>

                                {/* Input Form */}
                                <form onSubmit={createGame}>
                                    <SimpleGrid rowGap={4}>
                                        <GridItem>
                                            <FormLabel> Username </FormLabel>
                                            <Input name='username' bgColor={inputBgColor} />
                                        </GridItem>
                                        <GridItem>
                                            <FormLabel> Room Name </FormLabel>
                                            <Input name='room_name' bgColor={inputBgColor} />
                                        </GridItem>
                                        <GridItem>
                                            <FormLabel> Room Password </FormLabel>
                                            <Input name='room_password' bgColor={inputBgColor} />
                                        </GridItem>
                                        {/* <GridItem>
                                            <FormLabel> Categories </FormLabel>
                                            <Textarea name='categories' bgColor={inputBgColor} />
                                        </GridItem> */}
                                        <GridItem mt={4}>
                                            <Button w='full' type='submit' colorScheme='green'>
                                                Create Game
                                            </Button>
                                        </GridItem>
                                    </SimpleGrid>
                                </form>
                            </Stack>
                            :
                            <Stack w={500} p={10} spacing={4} border='1px' borderColor={borderColor} bgColor={bgColor}>
                                {/* Wavelength Header */}
                                <Center> 
                                    <Heading> 
                                    <Icon as={BsFilter} pos='relative' color='blue.500' top={1.5} right={2}/>
                                        Wavelength 
                                    </Heading> 
                                </Center>

                                {/* Input Form */}
                                <form onSubmit={joinGame}>
                                    <SimpleGrid rowGap={4}>
                                        <GridItem>
                                            <FormLabel> Username </FormLabel>
                                            <Input name='username' bgColor={inputBgColor} />
                                        </GridItem>
                                        <GridItem>
                                            <FormLabel> Room Code </FormLabel>
                                            <Input name='room_code' bgColor={inputBgColor} />
                                        </GridItem>
                                        {/* <GridItem>
                                            <FormLabel> Room Password </FormLabel>
                                            <Input name='room_password' bgColor={inputBgColor} />
                                        </GridItem> */}
                                        <GridItem mt={4}>
                                            <Button w='full' type='submit' colorScheme='blue'>
                                                Join Game
                                            </Button>
                                        </GridItem>
                                    </SimpleGrid>
                                </form>
                            </Stack>
                        }
                    </Tabs>
                </Center>
            </Container>
        </Box>
    )
                    
    function createGame(event) {
        event.preventDefault()
        let roomCode = generateRandomCode()
        navigate(`/game/${roomCode}`, 
        { 
            state: {
                action: 'create',
                username: event.target.username.value,
                room_name: event.target.room_name.value,
                room_password: event.target.room_password.value,
                room_code: roomCode
                // categories: event.target.categories.value
            }
        })
    }
    
    function joinGame(event) {
        event.preventDefault()
        navigate(`/game/${event.target.room_code.value}`, 
        { 
            state: {
                action: 'join',
                username: event.target.username.value,
                room_code: event.target.room_code.value,
                // room_password: event.target.room_password.value
            }
        })
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