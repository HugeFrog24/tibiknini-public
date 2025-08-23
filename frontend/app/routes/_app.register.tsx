import React, { useContext, useEffect } from "react";
import type { MetaFunction } from "react-router";
import { useNavigate, useLoaderData } from "react-router";
import RegistrationWizard from "../components/RegistrationWizard";
import type { LoaderData } from "./_app";
import UserContext from "../contexts/UserContext";

export async function loader() {
  const siteKey = process.env.VITE_RECAPTCHA_SITE_KEY;
  
  if (!siteKey) {
    throw new Error('Missing VITE_RECAPTCHA_SITE_KEY environment variable');
  }
  
  return {
    VITE_RECAPTCHA_SITE_KEY: siteKey,
  };
}

export const meta: MetaFunction<never, { 'routes/_app': LoaderData }> = ({ matches }) => {
  // Get the parent route's loader data
  const parentData = matches.find(
    (match) => match.id === "routes/_app"
  )?.data as LoaderData | undefined;
  
  const siteName = parentData?.siteData?.site_name || "Our Platform";

  return [
    { title: `Register - ${siteName}` },
    { name: "description", content: `Create your ${siteName} account` },
  ];
};

export default function Register() {
  const { isAuthenticated } = useContext(UserContext);
  const navigate = useNavigate();
  const data = useLoaderData<typeof loader>();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  // Only render the registration wizard if user is not authenticated
  return !isAuthenticated ? <RegistrationWizard recaptchaSiteKey={data.VITE_RECAPTCHA_SITE_KEY} /> : null;
}
