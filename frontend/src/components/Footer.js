import {Container, Nav} from 'react-bootstrap';
import {Link} from 'react-router-dom';
import UseDarkMode from "../utils/UseDarkMode";

function Footer() {

    const { bgClass, textClass } = UseDarkMode();


    return (
        <Container as="footer" fluid
            className={`mt-auto py-3 ${bgClass} ${textClass}`}>
            <Nav className="justify-content-center">
                <Nav.Item>
                    <Nav.Link as={Link} to="/privacy-policy"
                        className={`${textClass}`}>Privacy Policy</Nav.Link>
                </Nav.Item>
                <Nav.Item className="align-self-center">
                    <span className={`${textClass}`}> | </span>
                </Nav.Item>
                <Nav.Item>
                    <Nav.Link as={Link} to="/terms-of-service"
                        className={`${textClass}`}>Terms of Service</Nav.Link>
                </Nav.Item>
            </Nav>
        </Container>
    );
}

export default Footer;
