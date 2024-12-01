import React from 'react';
import { Outlet, useLoaderData } from "@remix-run/react";
import { ThemeProvider, CssBaseline } from '@mui/material';
import { json } from "@remix-run/node";
import { lightTheme } from '../old-app/themes/theme';
import Navbar from '../components/Navbar';
import Footer from '../old-app/components/Footer';
import { ToastContainer } from 'react-toastify';
import UserContext, { UserContextType, User } from '../contexts/UserContext';
import { fetchSiteTitle } from '../utils/server-fetch';

export async function loader() {
  try {
    const siteData = await fetchSiteTitle();
    return json({ siteData });
  } catch (error) {
    return json({ siteData: { site_name: "Our Platform" } });
  }
}

export default function AppLayout() {
  const { siteData } = useLoaderData<typeof loader>();
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
          <Navbar toggleDarkMode={() => {}} siteTitle={siteData.site_name} />
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
