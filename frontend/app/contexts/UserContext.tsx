import { createContext } from "react";
import { User } from "../types/user";

export interface UserContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  updateUser: (user: User | null) => void;
}

const defaultContext: UserContextType = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  updateUser: () => {},
};

const UserContext = createContext<UserContextType>(defaultContext);

export default UserContext;
