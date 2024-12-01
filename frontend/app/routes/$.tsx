// This is a catch-all route that will render your existing React Router app
import { useLocation } from "@remix-run/react";
import BlogPostForm from "../old-app/components/BlogPostForm";
import BlogPostsList from "../old-app/components/BlogPostsList";
import Contact from "../old-app/components/Contact";
import ForgotPassword from "../old-app/components/ForgotPassword";
import OnlineUsersPage from "../old-app/components/OnlineUsersPage";
import ProfileDetail from "../old-app/components/ProfileDetail";
import ProfileSettings from "../old-app/components/ProfileSettings";
import RegistrationWizard from "../old-app/components/RegistrationWizard";
import ResetPassword from "../old-app/components/ResetPassword";
import SetupWizard from "../old-app/components/SetupWizard";

export default function CatchAll() {
  const location = useLocation();
  const path = location.pathname;

  // Map paths to components
  let component;
  switch (path) {
    case '/blog/new':
      component = <BlogPostForm />;
      break;
    case '/blog':
      component = <BlogPostsList />;
      break;
    case '/contact':
      component = <Contact />;
      break;
    case '/online-users':
      component = <OnlineUsersPage />;
      break;
    case '/profile':
      component = <ProfileDetail />;
      break;
    case '/profile/settings':
      component = <ProfileSettings />;
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
