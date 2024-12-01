import { LoaderFunctionArgs } from "@remix-run/node";
import DocumentRenderer from "../old-app/components/DocumentRenderer";
import { useLoaderData } from "@remix-run/react";
import React from 'react'; // Added to fix the linter error

export async function loader() {
  const endpoint = `/api/documents/privacy-policy`;
  return { endpoint };
}

export default function PrivacyPolicy() {
  const { endpoint } = useLoaderData<typeof loader>();
  return <DocumentRenderer endpoint={endpoint} />;
} 