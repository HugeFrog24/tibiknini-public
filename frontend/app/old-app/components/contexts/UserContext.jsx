import { createContext } from 'react';

const UserContext = createContext({
    user: null,
    isAuthenticated: false
});

export default UserContext;
