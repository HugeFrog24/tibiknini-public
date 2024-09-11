import React, { useContext } from "react";
import UserContext from "./contexts/UserContext"; // Adjust the relative path if necessary
import {Link, useLocation} from "react-router-dom";
import {Button, ButtonGroup, Dropdown, Nav, Navbar} from "react-bootstrap";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {
    faBookOpen,
    faEnvelope,
    faGears,
    faHome,
    faMoon,
    faSignInAlt,
    faSignOutAlt,
    faSun,
    faUser,
} from "@fortawesome/free-solid-svg-icons";
import Avatar from '@mui/material/Avatar';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import IconButton from '@mui/material/IconButton';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';

import { handleLogout } from '../utils/auth';

// Import the CSS module here
import styles from '../styles/NavigationBar.module.css'; // Adjust the path as necessary

function NavigationBar({ toggleDarkMode }) {
    const theme = useTheme();
    const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
    const user = useContext(UserContext);
    const location = useLocation();

    const navItems = [
        { path: "/", icon: faHome, label: "Home" },
        { path: "/blog", icon: faBookOpen, label: "Blog" },
        { path: "/contact", icon: faEnvelope, label: "Contact" },
        ];

    const renderNavLinks = () => {
        return navItems.map((item) => (
            <Nav.Link
                key={item.path}
                className={`${theme.palette.mode === 'dark' ? 'bg-dark' : 'bg-light'} ${theme.palette.mode === 'dark' ? 'text-light' : 'text-dark'} mx-2 d-flex flex-column align-items-center text-center`}
                as={Link}
                to={item.path}
                >
                <FontAwesomeIcon
                    icon={item.icon}
                    className={`fa-lg fa-fw mx-auto d-block ${styles.navIcon} ${location.pathname === item.path ? styles.active : ""}`}
                    title={item.label}
                />
                <span className="small d-block">{item.label}</span>
            </Nav.Link>
            ));
    };

    const renderUserSection = () => {
        if (user) {
            return (
                <Dropdown as={ButtonGroup} className={`d-flex align-items-center rounded-end`}>
                    <Dropdown.Toggle
                        className={`${theme.palette.mode === 'dark' ? 'bg-dark' : 'bg-light'} ${theme.palette.mode === 'dark' ? 'text-light' : 'text-dark'}`}
                        id="dropdown-basic"
                    >
                        <Avatar
                            src={user.image}
                            alt={user.username}
                            sx={{ width: 24, height: 24 }}
                        >
                            {user.username.charAt(0).toUpperCase()}
                        </Avatar>
                    </Dropdown.Toggle>

                    <Dropdown.Menu align="end"> {/* Aligns dropdown to the end (right side) of the toggle to prevent overflow */}
                        <Dropdown.Item disabled>
                            {user.username}
                        </Dropdown.Item>
                        <Dropdown.Item as={Link} to="/users/me">
                            <FontAwesomeIcon icon={faUser} className="me-2"/>
                            Profile
                        </Dropdown.Item>
                        {user.is_staff && (
                            <Dropdown.Item href="/admin">
                                <FontAwesomeIcon icon={faGears} className="me-2"/>
                                Admin console
                            </Dropdown.Item>
                        )}
                        <Dropdown.Item as={Link} to="/settings">
                            <FontAwesomeIcon icon={faGears} className="me-2"/>
                            Settings
                        </Dropdown.Item>
                        <Dropdown.Item onClick={handleLogout} className="text-danger">
                            <FontAwesomeIcon icon={faSignOutAlt} className="me-2"/>
                            Logout
                        </Dropdown.Item>
                    </Dropdown.Menu>
                </Dropdown>
            );
        } else {
            return (
                <Button
                    variant={prefersDarkMode ? "outline-primary" : "outline-secondary"}
                    className="rounded-end d-flex align-items-center"
                    as={Link}
                    to={"/login"}
                >
                    <FontAwesomeIcon icon={faSignInAlt} className="me-2"/>
                    Login
                </Button>
            );
        }
    };

    return (
        <Navbar className={`px-4 ${theme.palette.mode === 'dark' ? 'bg-dark' : 'bg-light'} shadow`} expand={false}>
            <Nav className="me-auto d-flex flex-row">
                {renderNavLinks()}
            </Nav>
            <ButtonGroup className="shadow">
                <IconButton onClick={toggleDarkMode} color="inherit">
                    {theme.palette.mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
                </IconButton>
                {renderUserSection()}
            </ButtonGroup>
        </Navbar>
    );
}

export default NavigationBar;
