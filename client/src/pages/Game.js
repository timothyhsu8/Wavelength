import { Box } from '@chakra-ui/react';
import { useLocation } from 'react-router-dom'

export default function Game() {
    const location = useLocation()

    console.log(location.state)
    return (
        <Box>
            Render the room here
        </Box>
    )
}