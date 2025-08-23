import * as React from 'react';
import { Box, Typography } from '@mui/material';
import { useRouteError, isRouteErrorResponse } from 'react-router';
import { errorData } from '../constants/errorMessages';

interface ErrorComponentProps {
  error?: Error | null;
}

export default function ErrorComponent({ error }: ErrorComponentProps) {
  const routeError = useRouteError();
  
  // Determine error code from various possible error sources
  let errorCode: number | string = 'Unknown';
  
  if (isRouteErrorResponse(routeError)) {
    errorCode = routeError.status;
  } else if (error?.name === 'Error') {
    errorCode = 500;
  } else if (routeError instanceof Error) {
    errorCode = 500;
  }

  // Validate error code and get error info
  const validErrorCode = Object.prototype.hasOwnProperty.call(errorData, errorCode) 
    ? errorCode 
    : 'Unknown';
  const errorInfo = errorData[validErrorCode];
  const randomMessage = errorInfo.messages[Math.floor(Math.random() * errorInfo.messages.length)];
  const Icon = errorInfo.emoji;

  return (
    <Box 
      sx={{ 
        textAlign: 'center', 
        mt: 4,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
        padding: 3
      }}
    >
      <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Icon sx={{ fontSize: 40 }} /> 
        Error {errorCode}
      </Typography>
      <Typography variant="body1">{randomMessage}</Typography>
      <meta name="robots" content="noindex"/>
      {errorCode && <meta httpEquiv="status" content={errorCode.toString()}/>}
    </Box>
  );
}

// Export error boundary for use in routes
export function ErrorBoundary() {
  return <ErrorComponent />;
}
