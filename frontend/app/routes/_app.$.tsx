import * as React from 'react';
import { useLocation } from "@remix-run/react";
import OnlineUsersPage from "../old-app/components/OnlineUsersPage";
import RegistrationWizard from "../old-app/components/RegistrationWizard";
import SetupWizard from "../old-app/components/SetupWizard";
import ForgotPassword from "../old-app/components/ForgotPassword";
import ResetPassword from "../old-app/components/ResetPassword";

export default function CatchAll() {
  const location = useLocation();
  const path = location.pathname;

  // Map paths to components
  let component;
  switch (path) {
    case '/online-users':
      component = <OnlineUsersPage />;
      break;
    case '/register':
      component = <RegistrationWizard />;
      break;
    case '/setup':
      component = <SetupWizard />;
      break;
    case '/forgot-password':
      component = <ForgotPassword />;
      break;
    case '/reset-password':
      component = <ResetPassword />;
      break;
    default:
      throw new Response("Not Found", {
        status: 404,
        statusText: "Not Found"
      });
  }

  return component;
}
