import React, { useMemo } from 'react';
import { Outlet, useLoaderData } from 'react-router';
import { CssBaseline } from '@mui/material';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { ToastContainer } from 'react-toastify';
import UserContext, { UserContextType } from '../contexts/UserContext';
import { User } from '../types/user';
import { fetchSiteTitle, fetchAuthenticatedUser } from '../utils/server-fetch';
import usePresence from '../hooks/usePresence';

export interface LoaderData {
  siteData: { site_name: string };
  user: User | null;
}

export const loader = async ({ request }: { request: Request }) => {
  try {
    const [siteData, userData] = await Promise.allSettled([
      fetchSiteTitle(),
      fetchAuthenticatedUser(request)
    ]);

    return {
      siteData: siteData.status === 'fulfilled' ? siteData.value : { site_name: "Our Platform" },
      user: userData.status === 'fulfilled' ? userData.value : null
    };
  } catch {
    return {
      siteData: { site_name: "Our Platform" },
      user: null,
    };
  }
};


export default function AppLayout() {
  // Use regular useLoaderData
  const { siteData, user } = useLoaderData<LoaderData>();
  const [currentUser, setUser] = React.useState<User | null>(user);
  const [isLoading, setIsLoading] = React.useState(false); // Start with false since we have server data

  const userContextValue: UserContextType = useMemo(() => ({
    user: currentUser,
    isAuthenticated: !!currentUser,
    isLoading: isLoading,
    updateUser: setUser,
  }), [currentUser, isLoading]);

  // Initialize presence system - this will automatically connect
  // to the WebSocket when the user is authenticated
  usePresence();

  return (
    <UserContext.Provider value={userContextValue}>
      <CssBaseline />
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Navbar toggleDarkMode={() => {}} siteTitle={siteData.site_name} />
        <main style={{ flex: 1 }}>
          <Outlet />
        </main>
        <Footer />
        <ToastContainer />
      </div>
    </UserContext.Provider>
  );
}
