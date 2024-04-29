import React from 'react';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome'

import { errorData } from './constants/errorMessages';

function ErrorComponent({errorCode}) {

    const validErrorCode = errorData.hasOwnProperty(errorCode) ? errorCode : 'Unknown';
    const errorInfo = errorData[validErrorCode] || errorData['default'];
    const randomMessage = errorInfo.messages[Math.floor(Math.random() * errorInfo.messages.length)];

    return (
        <>
            <h1><FontAwesomeIcon icon={errorInfo.emoji}/> Error {errorCode}</h1>
            <p>{randomMessage}</p>
            <meta name="robots" content="noindex"/>
            <meta httpEquiv="status" content={errorCode.toString()}/>
        </>
    );
}

export default ErrorComponent;
