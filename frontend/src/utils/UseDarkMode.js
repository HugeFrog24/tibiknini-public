import { useContext } from 'react';
import DarkModeContext from "../components/contexts/DarkModeContext";

export default function UseDarkMode() {
    const { isDarkMode } = useContext(DarkModeContext);

    let classes = {
        bgClass: isDarkMode ? 'bg-dark' : 'bg-light',
        textClass: isDarkMode ? 'text-light' : 'text-dark',
        linkClass: isDarkMode ? 'link-info' : 'text-primary'
    };

    return classes;
}
