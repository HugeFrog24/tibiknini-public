import { SvgIcon } from '@mui/material';
import {
    SentimentVeryDissatisfied as SadIcon,
    Face as FaceIcon,
    AccountCircle as AccountIcon,
    Storage as ServerIcon
} from '@mui/icons-material';

interface ErrorInfo {
    emoji: typeof SvgIcon;
    message: string;
}

export interface ErrorData {
    [key: string | number]: ErrorInfo;
}

export const errorData: ErrorData = {
    401: {
        emoji: AccountIcon,
        message: "Access denied. We couldn't verify your ID."
    },
    404: {
        emoji: SadIcon,
        message: "Error 404. We couldn't find the page you're looking for."
    },
    500: {
        emoji: ServerIcon,
        message: "Our servers are having a rough day. Please try again later."
    },
    'Unknown': {
        emoji: FaceIcon,
        message: "Unknown error. Something unexpected happened on our side."
    }
};
