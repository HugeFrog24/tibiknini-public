import * as React from "react";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useRouteError,
  isRouteErrorResponse,
  type MetaFunction,
} from 'react-router';
import { fetchSiteTitle } from "./utils/server-fetch";
import { CssBaseline } from '@mui/material';
import { errorData } from './constants/errorMessages';

export async function loader() {
  try {
    const siteData = await fetchSiteTitle();
    return {
      siteData
    };
  } catch {
    return {
      siteData: { site_name: "Our Platform" }
    };
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
  useLoaderData<typeof loader>();

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <CssBaseline />
        <Outlet />
        <ScrollRestoration />
        <Scripts />
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
  const message = errorInfo.message;
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
            <p>{message}</p>
          </div>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
