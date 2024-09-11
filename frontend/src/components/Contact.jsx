import React, {useState} from 'react';
import {Container, Row, Col} from 'react-bootstrap';
import {TextField, Button, Typography, CircularProgress} from '@mui/material';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faPaperPlane} from '@fortawesome/free-solid-svg-icons';
import {toast, ToastContainer} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import api from '../utils/api';

function ContactForm() {
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
            <ToastContainer />
            <Container>
                <Row className="justify-content-center">
                    <Col xs={12} md={8} lg={6}>
                        <Typography variant="h4" component="h2" className="mt-2">Contact</Typography>
                        <Typography variant="body1" className="mb-4">
                            If you have any questions, comments, or concerns, please feel free to reach out to us using the form below. We look forward to hearing from you!
                        </Typography>
                        <form onSubmit={handleSubmit} noValidate>
                            <TextField
                                id="name"
                                label="Name"
                                variant="outlined"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                fullWidth
                                required
                                error={nameInvalid}
                                helperText={nameInvalid ? "Please fill your name." : ""}
                                className="mb-3"
                            />
                            <TextField
                                id="email"
                                label="Email address"
                                variant="outlined"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                fullWidth
                                required
                                error={emailInvalid}
                                helperText={emailInvalid ? (email && !/\S+@\S+\.\S+/.test(email) ? 'Invalid email address.' : 'Email is required.') : ""}
                                className="mb-3"
                            />
                            <TextField
                                id="subject"
                                label="Subject"
                                variant="outlined"
                                value={subject}
                                onChange={e => setSubject(e.target.value)}
                                fullWidth
                                required
                                error={subjectInvalid}
                                helperText={subjectInvalid ? "Please fill the subject." : ""}
                                className="mb-3"
                            />
                            <TextField
                                id="message"
                                label="Message"
                                variant="outlined"
                                value={message}
                                onChange={e => setMessage(e.target.value)}
                                fullWidth
                                required
                                multiline
                                rows={4}
                                error={messageInvalid}
                                helperText={messageInvalid ? "Please fill the message." : ""}
                                className="mb-3"
                            />
                            <Button
                                variant="contained"
                                color="primary"
                                type="submit"
                                fullWidth
                                disabled={isLoading}
                                startIcon={isLoading ? <CircularProgress size="1rem" /> : <FontAwesomeIcon icon={faPaperPlane} />}
                                className="shadow"
                            >
                                {isLoading ? "Sending..." : "SEND"}
                            </Button>
                        </form>
                    </Col>
                </Row>
            </Container>
        </>
    );
}

export default ContactForm;
