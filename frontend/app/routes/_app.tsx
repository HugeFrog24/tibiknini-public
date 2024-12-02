import React from 'react';
import { Outlet, useLoaderData } from "@remix-run/react";
import { ThemeProvider, CssBaseline } from '@mui/material';
import { json, LoaderFunction } from "@remix-run/node";
import { lightTheme } from '../old-app/themes/theme';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { ToastContainer } from 'react-toastify';
import UserContext, { UserContextType, User } from '../contexts/UserContext';
import { fetchSiteTitle, fetchAuthenticatedUser } from '../utils/server-fetch';

export interface LoaderData {
  siteData: { site_name: string };
  user: User | null;
}

export const loader: LoaderFunction = async ({ request }) => {
  try {
    const [siteData, user] = await Promise.all([
      fetchSiteTitle(),
      fetchAuthenticatedUser(request),
    ]);
    return json<LoaderData>({ siteData, user });
  } catch (error) {
    return json<LoaderData>({
      siteData: { site_name: "Our Platform" },
      user: null,
    });
  }
};

export default function AppLayout() {
  const { siteData, user } = useLoaderData<LoaderData>();
  const [currentUser, setUser] = React.useState<User | null>(user);

  const userContextValue: UserContextType = {
    user: currentUser,
    isAuthenticated: !!currentUser,
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
