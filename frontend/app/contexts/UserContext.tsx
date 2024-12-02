import { createContext } from "react";

export interface User {
  id: number;
  username: string;
  is_staff: boolean;
}

export interface UserContextType {
  user: User | null;
  isAuthenticated: boolean;
  updateUser: (user: User | null) => void;
}

const defaultContext: UserContextType = {
  user: null,
  isAuthenticated: false,
  updateUser: () => {},
};

const UserContext = createContext<UserContextType>(defaultContext);

export default UserContext;
