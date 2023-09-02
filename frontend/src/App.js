import React, {useEffect, useState} from "react";
import {Route, Routes, useLocation, useNavigate} from "react-router-dom";
import 'bootstrap/dist/css/bootstrap.min.css';
import {ToastContainer} from 'react-toastify';
import {Helmet, HelmetProvider} from 'react-helmet-async';
import config from './config.json';

import BlogPostsList from "./components/BlogPostsList";
import ErrorComponent from "./components/ErrorComponent";
import Footer from './components/Footer';
import Home from "./components/Home";
import Login from "./components/Login";
import Navbar from "./components/Navbar";
import BlogPostDetail from "./components/BlogPostDetail";
import Contact from "./components/Contact";
import ProfileDetail from "./components/ProfileDetail";
import FetchUser from "./utils/FetchUser";
import RefreshAccessToken from "./utils/RefreshAccessToken";

import DarkModeContext from "./components/contexts/DarkModeContext";
import ApiUrlContext from "./components/contexts/ApiUrlContext";
import UserContext from "./components/contexts/UserContext";

import "./App.css";
import "./styles/custom-bootstrap.css";
import {GetAccessToken, RemoveTokens} from "./utils/AccessToken";
import BlogPostForm from "./components/BlogPostForm";
import DocumentRenderer from "./components/DocumentRenderer";

function App() {
    const getInitialDarkMode = () => {
        const savedPreference = localStorage.getItem("darkMode");
        if (savedPreference !== null) {
            return JSON.parse(savedPreference);
        }

        return window.matchMedia("(prefers-color-scheme: dark)").matches;
    };

    const navigate = useNavigate();
    const [isDarkMode, setIsDarkMode] = useState(getInitialDarkMode());

    const toggleDarkMode = () => {
        const newDarkMode = !isDarkMode;
        setIsDarkMode(newDarkMode);
        localStorage.setItem("darkMode", JSON.stringify(newDarkMode));
    };

    const [user, setUser] = useState(null);
    const location = useLocation();
    
    // Set the API base URL to the relative path "/api".
    // Thanks to the Nginx reverse proxy setup in our infrastructure,
    // any request made to "/api/..." from the frontend will be transparently
    // forwarded to the Django backend. This abstraction makes our frontend code
    // environment-agnostic, meaning it doesn't need to know where the backend is hosted.
    // This approach simplifies deployment configurations, avoids CORS issues, and provides
    // a seamless integration between our frontend and backend services.
    const apiUrl = "/api";

    const [modeClasses, setModeClasses] = useState({
        content: "bg-light",
    });

    function handleLogin(user) {
        setUser(user);
    }

    useEffect(() => {
        setModeClasses({
            content: isDarkMode ? "my-bg-dark text-light" : "bg-light",
            text: isDarkMode ? "text-light" : "text-dark",
        });
        const token = GetAccessToken();
        if (token) {
            FetchUser(apiUrl, setUser, RefreshAccessToken)
                .catch((error) => {
                    console.error('Error fetching user:', error.message);
                    // if there's an error, remove the invalid tokens and redirect to login
                    RemoveTokens();
                    navigate('/login');
                });
        }
    }, [apiUrl, isDarkMode, navigate]);

    return (
        <HelmetProvider>
            <DarkModeContext.Provider value={{isDarkMode, toggleDarkMode}}>
                <ApiUrlContext.Provider value={apiUrl}>
                    <UserContext.Provider value={user}>
                        <Helmet>
                            <meta name="viewport" content="width=device-width, initial-scale=1"/>
                            <meta name="theme-color" content="#000000"/>
                            <meta name="description" content="Web site created using create-react-app"/>
                            <link rel="apple-touch-icon" href="/tibiknini192.png"/>
                            <link rel="icon" href="/tibiknini192.png"/>
                            <link rel="manifest" href="/manifest.json"/>
                            <title>{config.siteName}</title>
                        </Helmet>
                        <Navbar/>
                        <div className="App">
                            <ToastContainer/>
                            <div
                                className={`content p-5 ${modeClasses.content}`}
                                style={{minHeight: "100vh"}}
                            >
                                <Routes>
                                    <Route
                                        path="/"
                                        element={<Home textClass={modeClasses.text}/>}
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
                                        element={<ProfileDetail textClass={modeClasses.text}/>}
                                    />
                                    <Route
                                        path="/login"
                                        element={
                                            <Login onLogin={handleLogin}/>
                                        }
                                    />
                                    <Route
                                        path="/privacy-policy"
                                        element={<DocumentRenderer endpoint="/api/privacy_policy/"/>}
                                    />
                                    <Route
                                        path="/terms-of-service"
                                        element={<DocumentRenderer endpoint="/api/terms_of_service/"/>}
                                    />
                                    <Route path="*" element={<ErrorComponent errorCode={404}/>}/>
                                </Routes>
                            </div>
                            <Footer/>
                        </div>
                    </UserContext.Provider>
                </ApiUrlContext.Provider>
            </DarkModeContext.Provider>
        </HelmetProvider>
    );
}

export default App;
