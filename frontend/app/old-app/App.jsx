import React, { useEffect, useState } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import { ToastContainer } from 'react-toastify';

// Import components directly instead of lazy loading
import Navbar from "./components/Navbar";
import Footer from './components/Footer';

import { lightTheme, darkTheme } from './themes/theme';
import ApiUrlContext from "./components/contexts/ApiUrlContext";
import UserContext from "./components/contexts/UserContext";

import api, { setApiUrl, setNavigate } from "./utils/api";
import { fetchUser } from "./utils/auth";
import { ThemeProvider, CssBaseline } from '@mui/material';

import "./App.css";
import "./styles/custom-bootstrap.css";
import 'react-toastify/dist/ReactToastify.css';
import { Outlet, useNavigate } from "@remix-run/react";

function App() {
    const [user, setUser] = useState(null);
    const [isDarkMode, setIsDarkMode] = useState(() => {
        if (typeof window === 'undefined') return false;
        const savedPreference = localStorage.getItem("darkMode");
        return savedPreference !== null ? JSON.parse(savedPreference) : window.matchMedia("(prefers-color-scheme: dark)").matches;
    });

    const theme = isDarkMode ? darkTheme : lightTheme;

    const toggleDarkMode = () => {
        setIsDarkMode(!isDarkMode);
        localStorage.setItem("darkMode", JSON.stringify(!isDarkMode));
    };

    useEffect(() => {
        const initializeApp = async () => {
            try {
                const userData = await fetchUser();
                if (userData) {
                    setUser(userData);
                }
            } catch (error) {
                if (error?.response?.status === 401 || error?.response?.status === 403) {
                    setUser(null);
                } else {
                    console.error('Error initializing app:', error);
                }
            }
        };

        initializeApp();
    }, []);

    const navigate = useNavigate();
    
    const apiUrl = "/api";
    setApiUrl(apiUrl);
    setNavigate(navigate);

    function updateUser(user) {
        setUser(user);
    }

    useEffect(() => {
        api.get('set-csrf-token/')
            .catch(error => {
                console.error('CSRF token fetch failed:', error.message);
            });
    }, []);

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <ApiUrlContext.Provider value={apiUrl}>
                <UserContext.Provider value={{ user, setUser, isAuthenticated: !!user }}>
                    <div className="App">
                        <Navbar toggleDarkMode={toggleDarkMode}/>
                        <ToastContainer position="top-right" />
                        <div className={`content p-5 ${isDarkMode ? 'my-bg-dark' : 'bg-light'}`} 
                             style={{minHeight: "100vh"}}>
                            <Outlet />
                        </div>
                        <Footer/>
                    </div>
                </UserContext.Provider>
            </ApiUrlContext.Provider>
        </ThemeProvider>
    );
}

export default App;