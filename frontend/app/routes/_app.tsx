import React from 'react';
import { Outlet } from "@remix-run/react";
import { ThemeProvider, CssBaseline } from '@mui/material';
import { lightTheme } from '../old-app/themes/theme';
import Navbar from '../components/Navbar';
import Footer from '../old-app/components/Footer';
import { ToastContainer } from 'react-toastify';
import UserContext, { UserContextType, User } from '../contexts/UserContext';

export default function AppLayout() {
  const [user, setUser] = React.useState<User | null>(null);

  const userContextValue: UserContextType = {
    user,
    isAuthenticated: !!user,
    updateUser: setUser,
  };

  return (
    <UserContext.Provider value={userContextValue}>
      <ThemeProvider theme={lightTheme}>
        <CssBaseline />
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Navbar toggleDarkMode={() => {}} />
          <main style={{ flex: 1 }}>
            <Outlet />
          </main>
          <Footer />
          <ToastContainer />
        </div>
      </ThemeProvider>
    </UserContext.Provider>
  );
}
