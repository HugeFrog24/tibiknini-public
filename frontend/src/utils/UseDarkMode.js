import { useReducer, useEffect } from 'react';

const classesReducer = (state, action) => {
    switch (action.type) {
      case 'TOGGLE_DARK_MODE':
        return {
          ...state,
          bgClass: action.isDarkMode ? 'bg-dark' : 'bg-light',
          textClass: action.isDarkMode ? 'text-light' : 'text-dark',
          contentStyle: {
            backgroundColor: action.isDarkMode ? '#121212' : '#dddddd',
          },
        };
      default:
        throw new Error(`Unsupported action type: ${action.type}`);
    }
  };

export default function UseDarkMode(isDarkMode) {
    const [classes, dispatch] = useReducer(classesReducer, {
      bgClass: isDarkMode ? 'bg-dark' : 'bg-light',
      textClass: isDarkMode ? 'text-light' : 'text-dark',
      linkClass: isDarkMode ? 'link-info' : 'text-primary',
    });

    const contentStyle = {
        backgroundColor: isDarkMode ? '#121212' : '#f8f9fa', // adjust these colors as needed
      };
  
    useEffect(() => {
      dispatch({ type: 'TOGGLE_DARK_MODE', isDarkMode });
    }, [isDarkMode]);
  
    return classes;
  }