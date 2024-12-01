import * as React from "react";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  type MetaFunction,
} from "@remix-run/react";
import { json } from "@remix-run/node";
import { fetchSiteTitle } from "./utils/server-fetch";

// Import your styles
import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-toastify/dist/ReactToastify.css';
import './old-app/App.css';
import './old-app/styles/custom-bootstrap.css';

export const links = () => [
  { rel: "stylesheet", href: "bootstrap/dist/css/bootstrap.min.css" },
  { rel: "stylesheet", href: "react-toastify/dist/ReactToastify.css" },
];

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
        <Outlet />
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
