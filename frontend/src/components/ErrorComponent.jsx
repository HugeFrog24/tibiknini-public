import React from 'react';
import { Box, Typography } from '@mui/material';
import { errorData } from './constants/errorMessages';

function ErrorComponent({errorCode}) {
    const validErrorCode = errorData.hasOwnProperty(errorCode) ? errorCode : 'Unknown';
    const errorInfo = errorData[validErrorCode] || errorData['default'];
    const randomMessage = errorInfo.messages[Math.floor(Math.random() * errorInfo.messages.length)];
    const Icon = errorInfo.emoji;

    return (
        <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Typography variant="h4" component="h1">
                <Icon sx={{ fontSize: 40, mr: 1 }} /> Error {errorCode}
            </Typography>
            <Typography>{randomMessage}</Typography>
            <meta name="robots" content="noindex"/>
            <meta httpEquiv="status" content={errorCode.toString()}/>
        </Box>
    );
}

export default ErrorComponent;
