import { json } from "@remix-run/node";
import * as React from "react";
import { useLoaderData } from "@remix-run/react";
import { ClientOnly } from "remix-utils/client-only";
import Login from "../old-app/components/Login";

export async function loader() {
  return json({
    RECAPTCHA_SITE_KEY: process.env.RECAPTCHA_SITE_KEY,
  });
}

export default function LoginPage() {
  const data = useLoaderData<typeof loader>();
  return (
    <ClientOnly fallback={<div>Loading...</div>}>
      {() => <Login recaptchaSiteKey={data.RECAPTCHA_SITE_KEY} onLogin={() => {}} />}
    </ClientOnly>
  );
}
