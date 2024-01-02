import {Container, Nav} from 'react-bootstrap';
import {Link} from 'react-router-dom';
import DarkModeContext from "./contexts/DarkModeContext";
import { useContext } from 'react';

function Footer() {

    const { modeClasses } = useContext(DarkModeContext);

    return (
        <Container as="footer" fluid
            className={`mt-auto py-3 ${modeClasses.bgClass} ${modeClasses.textClass}`}>
            <Nav className="justify-content-center">
                <Nav.Item>
                    <Nav.Link as={Link} to="/privacy-policy"
                        className={`${modeClasses.textClass}`}>Privacy Policy</Nav.Link>
                </Nav.Item>
                <Nav.Item className="align-self-center">
                    <span className={`${modeClasses.textClass}`}> | </span>
                </Nav.Item>
                <Nav.Item>
                    <Nav.Link as={Link} to="/terms-of-service"
                        className={`${modeClasses.textClass}`}>Terms of Service</Nav.Link>
                </Nav.Item>
            </Nav>
        </Container>
    );
}

export default Footer;
