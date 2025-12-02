import React, { useState, useEffect } from "react";
import UserContext, { UserContextType } from "../contexts/UserContext";
import { User } from "../types/user";

interface UserProviderProps {
  children: React.ReactNode;
  initialUser?: User | null;
}

export default function UserProvider({ children, initialUser = null }: UserProviderProps) {
  const [user, setUser] = useState<User | null>(initialUser);
  const [isLoading, setIsLoading] = useState(false);

  // If we have initial user data from server, we're not loading
  useEffect(() => {
    if (initialUser !== undefined) {
      setIsLoading(false);
    }
  }, [initialUser]);

  const updateUser = (newUser: User | null) => {
    setUser(newUser);
  };

  const contextValue: UserContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    updateUser,
  };

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
}