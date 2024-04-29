import React, {useContext} from "react";
import {Link, useLocation} from "react-router-dom";
import {Button, ButtonGroup, Dropdown, Image, Nav, Navbar} from "react-bootstrap";
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

import { useDarkMode } from "./contexts/DarkModeContext";
import UserContext from "./contexts/UserContext";
import styles from "../styles/NavigationBar.module.css";
import { handleLogout } from '../utils/auth';
import { handleProfileImageError } from '../utils/ImageUtils';

function NavigationBar() {
    const {isDarkMode, toggleDarkMode, modeClasses} = useDarkMode();
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
                className={`${modeClasses.bgClass} ${modeClasses.textClass} mx-2 d-flex flex-column align-items-center text-center`}
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
                        className={`${modeClasses.bgClass} ${modeClasses.textClass}`}
                        id="dropdown-basic"
                    >
                        <Image
                            src={`${user.image}`}
                            roundedCircle
                            width="24"
                            height="24"
                            className="me-2"
                            onError={handleProfileImageError}
                        />
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
                    variant={isDarkMode ? "outline-primary" : "outline-secondary"}
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
        <Navbar className={`px-4 ${modeClasses.bgClass} shadow`} expand={false}>
            <Nav className="me-auto d-flex flex-row">
                {renderNavLinks()}
            </Nav>
            <ButtonGroup className="shadow">
                <Button
                    variant={isDarkMode ? "primary" : "secondary"}
                    className="rounded-start"
                    onClick={toggleDarkMode}
                >
                    <FontAwesomeIcon
                        icon={isDarkMode ? faMoon : faSun}
                        className={`fa-fw ${isDarkMode ? "moon-icon" : "sun-icon"}`}
                        title={`Switch to ${isDarkMode ? "light" : "dark"} mode`}
                    />
                </Button>
                {renderUserSection()}
            </ButtonGroup>
        </Navbar>
    );
}

export default NavigationBar;
