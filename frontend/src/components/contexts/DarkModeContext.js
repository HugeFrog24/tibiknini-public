import { createContext } from 'react';

const DarkModeContext = createContext({
  isDarkMode: false,
  toggleDarkMode: () => {},
  modeClasses: {
    bgClass: 'bg-light',
    textClass: 'text-dark',
    linkClass: 'text-primary',
    contentStyle: { backgroundColor: '#dddddd' }, // add this line
  },
});

export default DarkModeContext;
