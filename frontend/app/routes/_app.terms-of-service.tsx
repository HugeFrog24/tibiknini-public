import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import React from 'react';
import { getApiUrl } from "../env.server";

export async function loader() {
  const apiUrl = getApiUrl();
  const response = await fetch(`${apiUrl}/api/terms_of_service/`);
  
  if (!response.ok) {
    throw new Response("Failed to load Terms of Service", {
      status: response.status,
    });
  }

  const data = await response.json();
  return json(data);
}

export default function TermsOfService() {
  const data = useLoaderData<typeof loader>();
  return (
    <div>
      <h1>{data.title}</h1>
      <p>Last updated: {new Date(data.last_updated).toLocaleDateString()}</p>
      <div dangerouslySetInnerHTML={{ __html: data.content }} />
    </div>
  );
}