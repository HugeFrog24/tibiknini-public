import { createTheme } from '@mui/material';

// Light theme instance
export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    // Define other palette properties if needed
  },
  // You can also customize other theme aspects like typography, breakpoints, etc.
});

// Dark theme instance
export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    // Define other palette properties if needed
  },
  // Additional customizations can be added here
});