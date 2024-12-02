import React from 'react';
import { Container, Box, Link as MuiLink, Theme, Tooltip } from '@mui/material';
import { Link } from '@remix-run/react';
import { useTheme } from '@mui/material';
import GitHubIcon from '@mui/icons-material/GitHub';
import TagIcon from '@mui/icons-material/Tag';
import MovieIcon from '@mui/icons-material/Movie';

const Footer: React.FC = () => {
    const theme: Theme = useTheme();

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
                sx={{ mb: 2 }}
            >
                <Tooltip title="GitHub Profile">
                    <MuiLink
                        href="https://github.com/hugefrog24"
                        target="_blank"
                        rel="noopener noreferrer"
                        color="inherit"
                        sx={{ mx: 1, '&:hover': { color: theme.palette.primary.main } }}
                        aria-label="GitHub Profile"
                    >
                        <GitHubIcon />
                    </MuiLink>
                </Tooltip>
                <Tooltip title="PeerTube Channel">
                    <MuiLink
                        href="https://peertube.boger.dev/"
                        target="_blank"
                        rel="noopener noreferrer"
                        color="inherit"
                        sx={{ mx: 1, '&:hover': { color: theme.palette.primary.main } }}
                        aria-label="PeerTube Channel"
                    >
                        <MovieIcon />
                    </MuiLink>
                </Tooltip>
                <Tooltip title="Mastodon Profile">
                    <MuiLink
                        href="https://social.boger.dev/"
                        target="_blank"
                        rel="noopener noreferrer"
                        color="inherit"
                        sx={{ mx: 1, '&:hover': { color: theme.palette.primary.main } }}
                        aria-label="Mastodon Profile"
                    >
                        <TagIcon />
                    </MuiLink>
                </Tooltip>
            </Box>

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