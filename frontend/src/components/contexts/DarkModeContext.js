import { createContext, useContext, useState, useMemo, useEffect } from 'react';

const DarkModeContext = createContext();

export const DarkModeProvider = ({ children }) => {
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const savedPreference = localStorage.getItem("darkMode");
        return savedPreference !== null ? JSON.parse(savedPreference) : window.matchMedia("(prefers-color-scheme: dark)").matches;
    });

    useEffect(() => {
        localStorage.setItem("darkMode", JSON.stringify(isDarkMode));
    }, [isDarkMode]);

    const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

    const modeClasses = useMemo(() => ({
        bgClass: isDarkMode ? 'bg-dark' : 'bg-light',
        textClass: isDarkMode ? 'text-light' : 'text-dark',
        linkClass: isDarkMode ? 'link-info' : 'text-primary',
        contentStyle: {
            backgroundColor: isDarkMode ? '#121212' : '#f8f9fa',
        },
    }), [isDarkMode]);

    const value = useMemo(() => ({ isDarkMode, toggleDarkMode, modeClasses }), [isDarkMode, modeClasses]);

    return <DarkModeContext.Provider value={value}>{children}</DarkModeContext.Provider>;
};

export const useDarkMode = () => useContext(DarkModeContext);
