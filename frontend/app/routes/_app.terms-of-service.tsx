import { LoaderFunctionArgs } from "@remix-run/node";
import DocumentRenderer from "../old-app/components/DocumentRenderer";
import { useLoaderData } from "@remix-run/react";
import React from 'react';

export async function loader() {
  const endpoint = `/api/documents/terms-of-service`;
  return { endpoint };
}

export default function TermsOfService() {
  const { endpoint } = useLoaderData<typeof loader>();
  return <DocumentRenderer endpoint={endpoint} />;
} 