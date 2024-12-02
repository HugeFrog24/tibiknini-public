import * as React from "react";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useRouteError,
  isRouteErrorResponse,
  type MetaFunction,
} from "@remix-run/react";
import { json } from "@remix-run/node";
import { fetchSiteTitle } from "./utils/server-fetch";
import { ThemeProvider, CssBaseline } from '@mui/material';
import { lightTheme } from './old-app/themes/theme';
import { errorData } from './constants/errorMessages';

// Import your styles
import './old-app/App.css';
import './old-app/styles/custom-bootstrap.css';

export async function loader() {
  try {
    const siteData = await fetchSiteTitle();
    return json({ siteData });
  } catch (error) {
    // Fallback to default title if API call fails
    return json({ siteData: { site_name: "Our Platform" } });
  }
}

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  const siteName = data?.siteData?.site_name || "Our Platform";
  
  return [
    { title: siteName },
    { name: "description", content: `Welcome to ${siteName}` },
    // OpenGraph tags
    { property: "og:title", content: siteName },
    { property: "og:description", content: `Welcome to ${siteName}` },
    { property: "og:type", content: "website" },
  ];
};

export default function App() {
  const { siteData } = useLoaderData<typeof loader>();

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <ThemeProvider theme={lightTheme}>
          <CssBaseline />
          <Outlet />
        </ThemeProvider>
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  
  // Determine error code from various possible error sources
  let errorCode: number | string = 'Unknown';
  
  if (isRouteErrorResponse(error)) {
    errorCode = error.status;
  } else if (error instanceof Error) {
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
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="noindex"/>
        {errorCode && <meta httpEquiv="status" content={errorCode.toString()}/>}
        <Meta />
        <Links />
      </head>
      <body>
        <ThemeProvider theme={lightTheme}>
          <CssBaseline />
          <div style={{ 
            textAlign: 'center', 
            marginTop: '2rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem',
            padding: '1rem'
          }}>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Icon sx={{ fontSize: 40 }} /> 
              Error {errorCode}
            </h1>
            <p>{randomMessage}</p>
          </div>
        </ThemeProvider>
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
