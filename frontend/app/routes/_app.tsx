import React from 'react';
import { Outlet } from "@remix-run/react";
import { ThemeProvider, CssBaseline } from '@mui/material';
import { lightTheme } from '../old-app/themes/theme';
import Navbar from '../old-app/components/Navbar';
import Footer from '../old-app/components/Footer';
import { ToastContainer } from 'react-toastify';

export default function AppLayout() {
  return (
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
  );
}
