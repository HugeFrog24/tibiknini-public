import {faSadTear, faFlushed, faIdCard, faServer} from '@fortawesome/free-solid-svg-icons'

export const errorData = {
    401: {
        emoji: faIdCard,
        messages: [
            "Access denied. We couldn't verify your ID.",
            "Unable to authenticate. Are you sure you're using the correct ID?",
            "Unrecognized ID. Please double-check and try again.",
            "Access denied. Your digital key appears to be incorrect.",
            "Authentication failed. Please ensure you're using the right credentials.",
            "Your ID was not recognized. Please verify and try again.",
            "Unable to authenticate. Did you enter the right digital keys?",
            "We couldn't find your access ticket. Please make sure it's valid.",
            "Who's there? Unable to identify you with the provided ID.",
            "Access denied. Please verify your ID.",
            "Access denied. Your secret handshake doesn't match our records.",
            "Unable to verify your identity. Did you forget your password?",
            "Access denied. Please provide valid identification.",
            "Your ID seems to be missing. Can you confirm it's correct?"
        ]
    },
    404: {
        emoji: faSadTear,
        messages: [
            "Error 404. We couldn't find the page you're looking for.",
            "The requested page is unavailable. It might not exist.",
            "Sorry, but we couldn't find the page you requested.",
            "The page you're looking for doesn't exist here.",
            "Unable to find the page. It might have been removed or moved.",
            "This page doesn't exist. Please check the URL and try again.",
            "404 Error. This page might have been lost in the matrix.",
            "The requested page took a wrong turn. It can't be found.",
            "We also can't find the page you're looking for!",
            "Error 404. The page you're looking for is not available.",
            "The requested page is missing. Please check the URL.",
            "The page you're looking for can't be found. Please try another link.",
            "The requested page has left the building. It's not here anymore.",
            "We can't find the page. Please check the URL and try again."
        ]
    },
    500: {
        emoji: faServer,
        messages: [
            "The server is grappling with an intense migraine of cosmic proportions. Please allow it some respite and return later!",
            "The server is grappling with a severe headache. Could you please return later?",
            "The server consumed some unsavory data and now has a terrible stomachache. Mind trying again after a bit?",
            "The server's paper tray is tangled in a fierce paper jam. Might you have overloaded it?",
            "Our servers are having a rough day. Please try again later.",
            "Looks like our servers are a bit under the weather.",
            "Our servers are currently rehearsing for a role in a drama. Please come back later.",
            "Our servers are playing hide and seek. Try again later.",
            "Our servers went out for a digital walk. Please try again later.",
            "We're experiencing technical difficulties. Our servers are currently in time-out.",
            "Our servers are currently on a coffee break. Please check back in a few.",
            "Our servers are currently solving a sudoku. Please check back in a moment.",
            "Our servers are having a yoga session. Please try again later.",
            "Our servers decided to go stargazing. Please check back later.",
            "Our servers are currently in a game of chess. Your move, try again.",
            "Our servers are currently lost in the cloud. Please try again later.",
            "Our servers are watching a digital concert. Please try again after the encore."
        ]
    },
    'Unknown': {
        emoji: faFlushed,
        messages: [
            "Unknown error. Something unexpected happened on our side.",
            "Oops, we encountered an unexpected error.",
            "Something went wrong. We're not quite sure what."
        ]
    }
};