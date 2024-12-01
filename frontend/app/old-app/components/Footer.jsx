import React from 'react';
import { Container, Box, Link as MuiLink } from '@mui/material';
import { Link } from '@remix-run/react';
import { useTheme } from '@mui/material';

function Footer() {
    const theme = useTheme();

    return (
        <Container
            component="footer"
            maxWidth={false}
            sx={{
                mt: 'auto',
                py: 3,
                backgroundColor: theme.palette.background.paper,
                color: theme.palette.text.primary,
            }}
        >
            <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                sx={{ '& a': { textDecoration: 'none' } }}
                role="navigation"
                aria-label="Footer Navigation"
            >
                <MuiLink
                    component={Link}
                    to="/privacy-policy"
                    color="inherit"
                    sx={{ mr: 1 }}
                    aria-label="Privacy Policy"
                >
                    Privacy Policy
                </MuiLink>
                <Box component="span" sx={{ mx: 1 }} aria-hidden="true">|</Box>
                <MuiLink
                    component={Link}
                    to="/terms-of-service"
                    color="inherit"
                    sx={{ ml: 1 }}
                    aria-label="Terms of Service"
                >
                    Terms of Service
                </MuiLink>
            </Box>
        </Container>
    );
}

export default Footer;