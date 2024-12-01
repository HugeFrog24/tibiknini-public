// This is a catch-all route that will render your existing React Router app
import { useLocation } from "@remix-run/react";
import BlogPostForm from "../old-app/components/BlogPostForm";
import BlogPostsList from "../old-app/components/BlogPostsList";
import BlogPostDetail from "../old-app/components/BlogPostDetail";
import Contact from "../old-app/components/Contact";
import ForgotPassword from "../old-app/components/ForgotPassword";
import OnlineUsersPage from "../old-app/components/OnlineUsersPage";
import ProfileDetail from "../old-app/components/ProfileDetail";
import ProfileSettings from "../old-app/components/ProfileSettings";
import RegistrationWizard from "../old-app/components/RegistrationWizard";
import ResetPassword from "../old-app/components/ResetPassword";
import SetupWizard from "../old-app/components/SetupWizard";
import ErrorComponent from "../old-app/components/ErrorComponent";

export default function CatchAll() {
  const location = useLocation();
  const path = location.pathname;

  // Map paths to components
  switch (path) {
    case '/blog/new':
      return <BlogPostForm />;
    case '/blog':
      return <BlogPostsList />;
    case '/contact':
      return <Contact />;
    case '/online-users':
      return <OnlineUsersPage />;
    case '/profile':
      return <ProfileDetail />;
    case '/settings':
      return <ProfileSettings />;
    case '/register':
      return <RegistrationWizard />;
    case '/reset-password':
      return <ResetPassword />;
    case '/setup':
      return <SetupWizard />;
    default:
      return <ErrorComponent />;
  }
}
