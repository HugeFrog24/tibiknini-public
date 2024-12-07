import React, { useContext, useEffect } from "react";
import type { MetaFunction } from "@remix-run/node";
import { useNavigate } from "@remix-run/react";
import RegistrationWizard from "../components/RegistrationWizard";
import type { LoaderData } from "./_app";
import UserContext from "../contexts/UserContext";

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

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  // Only render the registration wizard if user is not authenticated
  return !isAuthenticated ? <RegistrationWizard /> : null;
}
