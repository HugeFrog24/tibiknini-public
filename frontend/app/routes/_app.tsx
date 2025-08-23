import React, { useMemo } from 'react';
import { Outlet, useLoaderData } from 'react-router';
import { CssBaseline } from '@mui/material';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { ToastContainer } from 'react-toastify';
import UserContext, { UserContextType } from '../contexts/UserContext';
import { User } from '../types/user';
import { fetchSiteTitle } from '../utils/server-fetch';
import usePresence from '../hooks/usePresence';
import api from '../utils/api';

export interface LoaderData {
  siteData: { site_name: string };
  user: User | null;
}

export const loader = async () => {
  try {
    const siteData = await fetchSiteTitle();
    // Don't try to fetch user on server-side due to cookie forwarding issues
    // User will be fetched client-side after hydration
    return { siteData, user: null };
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
  const [isLoading, setIsLoading] = React.useState(true);

  // Fetch user client-side after hydration to avoid cookie forwarding issues
  React.useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await api.get('/users/me/');
        setUser(response.data);
      } catch (error) {
        console.log('User not authenticated or error fetching user:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, []);

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
