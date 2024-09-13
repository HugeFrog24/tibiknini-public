import React, { useContext } from "react";
import UserContext from "./contexts/UserContext";
import { Link, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faBookOpen,
    faEnvelope,
    faGears,
    faHome,
    faSignInAlt,
    faSignOutAlt,
    faUser,
} from "@fortawesome/free-solid-svg-icons";
import {
    AppBar,
    Avatar,
    Box,
    Button,
    IconButton,
    Menu,
    MenuItem,
    Toolbar,
    Typography,
    useTheme,
} from "@mui/material";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";

import { handleLogout } from '../utils/auth';

function NavigationBar({ toggleDarkMode }) {
    const theme = useTheme();
    const user = useContext(UserContext);
    const location = useLocation();
    const [anchorEl, setAnchorEl] = React.useState(null);

    const handleMenu = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const navItems = [
        { path: "/", icon: faHome, label: "Home" },
        { path: "/blog", icon: faBookOpen, label: "Blog" },
        { path: "/contact", icon: faEnvelope, label: "Contact" },
    ];

    const renderNavLinks = () => {
        return navItems.map((item) => (
            <Button
                key={item.path}
                component={Link}
                to={item.path}
                color="inherit"
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    mx: 2,
                    color: 'white',
                    backgroundColor: location.pathname === item.path ? theme.palette.action.selected : 'transparent',
                    '&:hover': {
                        backgroundColor: theme.palette.action.hover,
                    },
                }}
            >
                <FontAwesomeIcon icon={item.icon} size="lg" color="white" />
                <Typography variant="caption" style={{ color: 'white' }}>{item.label}</Typography>
            </Button>
        ));
    };

    const renderUserSection = () => {
        return (
            <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
                <IconButton onClick={toggleDarkMode} color="inherit">
                    {theme.palette.mode === "dark" ? (
                        <Brightness7Icon />
                    ) : (
                        <Brightness4Icon />
                    )}
                </IconButton>
                {user ? (
                    <>
                        <IconButton
                            size="large"
                            aria-label="account of current user"
                            aria-controls="menu-appbar"
                            aria-haspopup="true"
                            onClick={handleMenu}
                            color="inherit"
                        >
                            <Avatar src={user.image} alt={user.username} />
                        </IconButton>
                        <Menu
                            id="menu-appbar"
                            anchorEl={anchorEl}
                            anchorOrigin={{
                                vertical: "bottom",
                                horizontal: "right",
                            }}
                            keepMounted
                            transformOrigin={{
                                vertical: "top",
                                horizontal: "right",
                            }}
                            open={Boolean(anchorEl)}
                            onClose={handleClose}
                        >
                            <MenuItem disabled>{user.username}</MenuItem>
                            <MenuItem component={Link} to="/users/me" onClick={handleClose}>
                                <FontAwesomeIcon icon={faUser} className="me-2" color={theme.palette.mode === 'dark' ? 'white' : 'black'} />
                                Profile
                            </MenuItem>
                            {user.is_staff && (
                                <MenuItem component="a" href="/admin" onClick={handleClose}>
                                    <FontAwesomeIcon icon={faGears} className="me-2" color={theme.palette.mode === 'dark' ? 'white' : 'black'} />
                                    Admin console
                                </MenuItem>
                            )}
                            <MenuItem component={Link} to="/settings" onClick={handleClose}>
                                <FontAwesomeIcon icon={faGears} className="me-2" color={theme.palette.mode === 'dark' ? 'white' : 'black'} />
                                Settings
                            </MenuItem>
                            <MenuItem onClick={handleLogout} sx={{ color: "error.main" }}>
                                <FontAwesomeIcon icon={faSignOutAlt} className="me-2" color="error.main" />
                                Logout
                            </MenuItem>
                        </Menu>
                    </>
                ) : (
                    <Button
                        variant="outlined"
                        component={Link}
                        to={"/login"}
                        color="inherit"
                        startIcon={<FontAwesomeIcon icon={faSignInAlt} color="white" />}
                    >
                        Login
                    </Button>
                )}
            </Box>
        );
    };

    return (
        <AppBar position="static">
            <Toolbar>
                <Box sx={{ flexGrow: 1, display: "flex" }}>{renderNavLinks()}</Box>
                {renderUserSection()}
            </Toolbar>
        </AppBar>
    );
}

export default NavigationBar;
