import React, {useEffect, useState, Suspense} from "react";
import {Route, Routes, useLocation, useNavigate} from "react-router-dom";
import 'bootstrap/dist/css/bootstrap.min.css';
import { Spinner } from 'react-bootstrap';
import {ToastContainer} from 'react-toastify';
import {Helmet, HelmetProvider} from 'react-helmet-async';
import config from './config.json';

import DocumentRenderer from "./components/DocumentRenderer";
import ErrorComponent from "./components/ErrorComponent";
import Navbar from "./components/Navbar";
import Footer from './components/Footer';

import { lightTheme, darkTheme } from './themes/theme';
import { DarkModeProvider } from "./components/contexts/DarkModeContext";
import ApiUrlContext from "./components/contexts/ApiUrlContext";
import UserContext from "./components/contexts/UserContext";

import api, { setApiUrl, setNavigate } from "./utils/api";

import "./App.css";
import "./styles/custom-bootstrap.css";
import 'react-toastify/dist/ReactToastify.css';

// Lazy-load non-essential components to reduce initial loading time
const BlogPostForm = React.lazy(() => import("./components/BlogPostForm"));
const BlogPostsList = React.lazy(() => import("./components/BlogPostsList"));
const BlogPostDetail = React.lazy(() => import("./components/BlogPostDetail"));
const Contact = React.lazy(() => import("./components/Contact"));
const Home = React.lazy(() => import("./components/Home"));
const Login = React.lazy(() => import("./components/Login"));
const ProfileDetail = React.lazy(() => import("./components/ProfileDetail"));
const RegistrationWizard = React.lazy(() => import("./components/RegistrationWizard"));
const SetupWizard = React.lazy(() => import("./components/SetupWizard"));
const ProfileSettings = React.lazy(() => import("./components/ProfileSettings"));

import { fetchUser } from "./utils/auth";
import { ThemeProvider, CssBaseline } from '@mui/material'; // Import CssBaseline here

function App() {
    const [user, setUser] = useState(null);
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const savedPreference = localStorage.getItem("darkMode");
        return savedPreference !== null ? JSON.parse(savedPreference) : window.matchMedia("(prefers-color-scheme: dark)").matches;
    });

    const toggleDarkMode = () => {
        setIsDarkMode(!isDarkMode);
        localStorage.setItem("darkMode", JSON.stringify(!isDarkMode));
    };

    // Fetch user's information in the background
    useEffect(() => {
        const initializeApp = async () => {
            try {
                const userData = await fetchUser();
                if (userData) {
                    setUser(userData);
                }
            } catch (error) {
                // Only clear user state if it's an authentication error
                if (error?.response?.status === 401 || error?.response?.status === 403) {
                    setUser(null);
                } else {
                    // For other errors (network, server, etc.), keep the current state
                    console.error('Error initializing app:', error);
                }
            }
        };

        initializeApp();
    }, []);

    const location = useLocation();
    const navigate = useNavigate();
    
    // Set the API base URL to the relative path "/api".
    // Thanks to the Nginx reverse proxy setup in our infrastructure,
    // any request made to "/api/..." from the frontend will be transparently
    // forwarded to the Django backend. This abstraction makes our frontend code
    // environment-agnostic, meaning it doesn't need to know where the backend is hosted.
    // This approach simplifies deployment configurations, avoids CORS issues, and provides
    // a seamless integration between our frontend and backend services.
    const apiUrl = "/api";
    setApiUrl(apiUrl);
    setNavigate(navigate);

    function updateUser(user) {
        setUser(user);
    }

    useEffect(() => {
        // Make a GET request to the server to ensure the CSRF cookie is set
        api.get('set-csrf-token/')
            .catch(error => {
                // Error is already handled by the interceptor, so we can
                // just log it or ignore it here
                console.error('CSRF token fetch failed:', error.message);
            });
    }, []);

    return (
        <HelmetProvider>
            <ThemeProvider theme={isDarkMode ? darkTheme : lightTheme}>
            <CssBaseline />
            <DarkModeProvider>
                <ApiUrlContext.Provider value={apiUrl}>
                    <UserContext.Provider value={{ user, isAuthenticated: !!user }}>
                        <Helmet>
                            <meta name="viewport" content="width=device-width, initial-scale=1"/>
                            <meta name="theme-color" content="#000000"/>
                            <meta name="description" content="Web site created using create-react-app"/>
                            <link rel="apple-touch-icon" href="/tibiknini192.png"/>
                            <link rel="icon" href="/tibiknini192.png"/>
                            <link rel="manifest" href="/manifest.json"/>
                            <title>{config.siteName}</title>
                        </Helmet>
                        <Navbar toggleDarkMode={toggleDarkMode}/>
                        <div className="App">
                            <ToastContainer position="top-right" />
                            <div
                                className={`content p-5 ${isDarkMode ? 'my-bg-dark' : 'bg-light'}`}
                                style={{minHeight: "100vh"}}>
                                <Suspense fallback={<Spinner />}>
                                    <Routes>
                                        <Route
                                            path="/"
                                            element={<Home />}
                                        />
                                        <Route
                                            path="/blog/"
                                            element={<BlogPostsList postId={undefined}/>}
                                        />
                                        <Route
                                            path="/blog/posts/:postId"
                                            element={
                                                <BlogPostDetail/>
                                            }
                                        />
                                        <Route path="/blog/posts/:postId/edit" element={<BlogPostForm/>}/>
                                        <Route
                                            path="/blog/posts/new"
                                            element={<BlogPostForm
                                                previousPath={location.pathname !== "/blog/posts/new" ? location.pathname : "/blog"}/>}
                                        />
                                        <Route
                                            path="/contact/"
                                            element={<Contact/>}
                                        />
                                        <Route
                                            path="/users/:username"
                                            element={<ProfileDetail />}
                                        />
                                        <Route
                                            path="/login"
                                            element={
                                                <Login onLogin={updateUser}/>
                                            }
                                        />
                                        <Route
                                            path="/register"
                                            element={<RegistrationWizard />}
                                        />
                                        <Route
                                            path="/setup"
                                            element={<SetupWizard />}
                                        />
                                        <Route
                                            path="/privacy-policy"
                                            element={<DocumentRenderer endpoint="/privacy_policy/"/>}
                                        />
                                        <Route
                                            path="/terms-of-service"
                                            element={<DocumentRenderer endpoint="/terms_of_service/"/>}
                                        />
                                        <Route path="*" element={<ErrorComponent errorCode={404}/>}/>
                                        <Route
                                            path="/settings"
                                            element={<ProfileSettings />}
                                        />
                                    </Routes>
                                </Suspense>
                            </div>
                            <Footer/>
                        </div>
                    </UserContext.Provider>
                </ApiUrlContext.Provider>
            </DarkModeProvider>
            </ThemeProvider>
        </HelmetProvider>
    );
}

export default App;