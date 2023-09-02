import React, {useContext} from "react";
import {Link, useLocation} from "react-router-dom";
import {Button, ButtonGroup, Dropdown, Image, Nav, Navbar} from "react-bootstrap";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {
    faBookOpen,
    faEnvelope,
    faHome,
    faMoon,
    faSignInAlt,
    faSignOutAlt,
    faSun,
    faUser,
} from "@fortawesome/free-solid-svg-icons";

import DarkModeContext from "./contexts/DarkModeContext";
import UserContext from "./contexts/UserContext";
import styles from "../styles/NavigationBar.module.css";
import {RemoveTokens} from "../utils/AccessToken";
import UseDarkMode from "../utils/UseDarkMode";

function NavigationBar() {
    const {isDarkMode, toggleDarkMode} = useContext(DarkModeContext);
    const user = useContext(UserContext);
    const location = useLocation();
    const { bgClass, textClass } = UseDarkMode();

    const renderUserSection = () => {
        if (user) {
            return (
                <Dropdown as={ButtonGroup} className={`d-flex align-items-center rounded-end`}>
                    <Dropdown.Toggle
                        className={`${bgClass} ${textClass} ${styles.navLinkContainer}`}
                        id="dropdown-basic"
                    >
                        <Image
                            src={`${user.image}`}
                            roundedCircle
                            width="24"
                            height="24"
                            className="me-2"
                        />
                        <span>{user.username}</span>
                    </Dropdown.Toggle>

                    <Dropdown.Menu>
                        <Dropdown.Item as={Link} to={`/users/${user.username}`}>
                            <FontAwesomeIcon icon={faUser} className="me-2"/>
                            Profile
                        </Dropdown.Item>
                        <Dropdown.Item onClick={RemoveTokens} className="text-danger">
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
        <Navbar className={`px-4 ${bgClass} shadow`} expand={false}>
            <Nav className="me-auto d-flex flex-row">
                <Nav.Link
                    className={`${bgClass} ${textClass} mx-2 ${styles.navLinkContainer}`}
                    as={Link}
                    to={"/"}
                >
                    <FontAwesomeIcon
                        icon={faHome}
                        className={`fa-lg fa-fw ${styles.navIcon} ${
                            location.pathname === "/" ? styles.active : ""
                        }`}
                        title="Home"
                    />
                    <span className={`${styles.label} small`}>Home</span>
                </Nav.Link>
                <Nav.Link
                    className={`${bgClass} ${textClass} mx-2 ${styles.navLinkContainer}`}
                    as={Link}
                    to={"/blog"}
                >
                    <FontAwesomeIcon
                        icon={faBookOpen}
                        className={`fa-lg fa-fw ${styles.navIcon} ${
                            location.pathname === "/blog" ? styles.active : ""
                        }`}
                        title="Blog"
                    />
                    <span className={`${styles.label} small`}>Blog</span>
                </Nav.Link>
                <Nav.Link
                    className={`${bgClass} ${textClass} mx-2 ${styles.navLinkContainer}`}
                    as={Link}
                    to={"/contact"}
                >
                    <FontAwesomeIcon
                        icon={faEnvelope}
                        className={`fa-lg fa-fw ${styles.navIcon} ${
                            location.pathname === "/contact" ? styles.active : ""
                        }`}
                        title="Contact"
                    />
                    <span className={`${styles.label} small`}>Contact</span>
                </Nav.Link>
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
