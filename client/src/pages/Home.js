import { Container, Stack, Center, Heading, Input, FormControl, FormLabel, SimpleGrid, GridItem, Icon, Button, Tabs, TabList, Tab, Textarea } from '@chakra-ui/react';
import { BsFilter } from "react-icons/bs";
import { useNavigate } from 'react-router-dom'
import { useState } from 'react';

export default function Home() {
    let navigate = useNavigate();
    const [formType, setFormType] = useState('create')
    
    return (
        <Container maxW="container.xl">
            <Center>
                <Tabs mt={10} variant="enclosed" >
                    <TabList>
                        <Tab onClick={() => setFormType('create')} _focus={{}} > Create Game </Tab>
                        <Tab onClick={() => setFormType('join')} _focus={{}}> Join Game </Tab>
                    </TabList>

                    {
                        formType === 'create' ?
                        <Stack w={500} p={10} spacing={4} border='1px' borderColor='gray.200'>
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
                                        <Input name='username' />
                                    </GridItem>
                                    <GridItem>
                                        <FormLabel> Room Name </FormLabel>
                                        <Input name='room_name' />
                                    </GridItem>
                                    <GridItem>
                                        <FormLabel> Room Password </FormLabel>
                                        <Input name='room_password' />
                                    </GridItem>
                                    <GridItem>
                                        <FormLabel> Categories </FormLabel>
                                        <Textarea name='categories' />
                                    </GridItem>
                                    <GridItem mt={4}>
                                        <Button w='full' type='submit' colorScheme='green'>
                                            Create Game
                                        </Button>
                                    </GridItem>
                                </SimpleGrid>
                            </form>
                        </Stack>
                        :
                        <Stack w={500} p={10} spacing={4} border='1px' borderColor='gray.200'>
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
                                        <Input name='username' />
                                    </GridItem>
                                    <GridItem>
                                        <FormLabel> Room Code </FormLabel>
                                        <Input name='room_name' />
                                    </GridItem>
                                    <GridItem>
                                        <FormLabel> Room Password </FormLabel>
                                        <Input name='room_password' />
                                    </GridItem>
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
    )
                    
    function createGame(event) {
        event.preventDefault()
        navigate('/game', 
        { 
            state: {
                username: event.target.username.value,
                room_name: event.target.room_name.value,
                room_password: event.target.room_password.value,
                categories: event.target.categories.value
            }
        })
    }
    
    function joinGame(event) {
        event.preventDefault()
        console.log("ehh")
        navigate('/game', 
        { 
            state: {
                username: event.target.username.value,
                room_name: event.target.room_name.value,
                room_password: event.target.room_password.value
            }
        })
    }
}