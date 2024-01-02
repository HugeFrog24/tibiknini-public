import React, {useState} from 'react';
import {Button, Col, Container, FloatingLabel, Form, Row} from 'react-bootstrap';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faPaperPlane} from '@fortawesome/free-solid-svg-icons';
import {toast, ToastContainer} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import api from '../utils/api';
import UseDarkMode from '../utils/UseDarkMode';
import Spinner from "react-bootstrap/Spinner";

function ContactForm() {
    const {bgClass, textClass} = UseDarkMode();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [nameInvalid, setNameInvalid] = useState(false);
    const [emailInvalid, setEmailInvalid] = useState(false);
    const [subjectInvalid, setSubjectInvalid] = useState(false);
    const [messageInvalid, setMessageInvalid] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();

        const isNameInvalid = !name;
        const isEmailInvalid = !email || !/\S+@\S+\.\S+/.test(email);
        const isSubjectInvalid = !subject;
        const isMessageInvalid = !message;

        // Update the states
        setNameInvalid(isNameInvalid);
        setEmailInvalid(isEmailInvalid);
        setSubjectInvalid(isSubjectInvalid);
        setMessageInvalid(isMessageInvalid);

        // Check the directly computed validation flags
        if (isNameInvalid || isEmailInvalid || isSubjectInvalid || isMessageInvalid) {
            return; // return early from the function
        }

        setIsLoading(true);

        try {
            const response = await api.post("/messages/contact/", {
                name,
                email,
                subject,
                message,
            });

            if (response.status === 201) {
                toast.success('Message sent successfully');
                setName('');
                setEmail('');
                setSubject('');
                setMessage('');
            }
        } catch (error) {
            if (error.response && error.response.status === 429) {
                toast.error('Too many requests. Please try again later.');
            } else {
                toast.error('An error occurred while sending your message.');
            }
        } finally {
            setIsLoading(false);  // Reset loading to false once sending process completes
        }
    };

    return (
        <>
            <ToastContainer/>
            <Container>
                <Row className="justify-content-center">
                    <Col xs={12} md={8} lg={3}>
                        <h2 className="mt-2">Contact</h2>
                        <Form onSubmit={handleSubmit}>
                            <FloatingLabel controlId="floatingName" label="Name *" className="mb-3">
                                <Form.Control
                                    type="text"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    className={`${bgClass} ${textClass} shadow`}
                                    placeholder="Enter your name"
                                    autoComplete="off"
                                    isInvalid={nameInvalid} // Add this line
                                />
                                <Form.Control.Feedback type="invalid">Please fill your name.</Form.Control.Feedback>
                            </FloatingLabel>
                            <FloatingLabel controlId="floatingEmail" label="Email address *" className="mb-3">
                                <Form.Control
                                    type="text"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className={`${bgClass} ${textClass} shadow`}
                                    placeholder="Enter your email address"
                                    autoComplete="off"
                                    isInvalid={emailInvalid} // Add this line
                                />
                                <Form.Control.Feedback type="invalid">
                                    {email && !/\S+@\S+\.\S+/.test(email) ? 'Invalid email address.' : 'Email is required.'}
                                </Form.Control.Feedback>
                            </FloatingLabel>
                            <FloatingLabel controlId="floatingSubject" label="Subject *" className="mb-3">
                                <Form.Control
                                    type="text"
                                    value={subject}
                                    onChange={e => setSubject(e.target.value)}
                                    className={`${bgClass} ${textClass} shadow`}
                                    placeholder="Enter the subject"
                                    autoComplete="off"
                                    isInvalid={subjectInvalid} // Add this line
                                />
                                <Form.Control.Feedback type="invalid">Please fill the subject.</Form.Control.Feedback>
                            </FloatingLabel>
                            <FloatingLabel controlId="floatingMessage" label="Message *" className="mb-3">
                                <Form.Control
                                    as="textarea"
                                    placeholder="Your message here"
                                    style={{resize: "none", height: '100px'}}
                                    className={`${bgClass} ${textClass} shadow`}
                                    value={message}
                                    onChange={e => setMessage(e.target.value)}
                                    isInvalid={messageInvalid} // Add this line
                                />
                                <Form.Control.Feedback type="invalid">Please fill the message.</Form.Control.Feedback>
                            </FloatingLabel>
                            <Button
                                variant={isLoading ? "secondary" : "primary"}
                                type="submit"
                                className="shadow w-100"
                                disabled={isLoading}
                            >
                                {
                                    isLoading ?
                                        <Spinner
                                            as="span"
                                            animation="border"
                                            size="sm"
                                            role="status"
                                            aria-hidden="true"
                                        /> :
                                        <>
                                            <FontAwesomeIcon icon={faPaperPlane} className="me-2"/> SEND
                                        </>
                                }
                            </Button>
                        </Form>
                    </Col>
                </Row>
            </Container>
        </>
    );
}

export default ContactForm;
