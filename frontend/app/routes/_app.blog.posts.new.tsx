import React, { useContext, useEffect } from 'react';
import { useNavigate } from "react-router";
import UserContext from "../contexts/UserContext";
import BlogPostForm from "../components/BlogPostForm";
import { ACTIONS } from "../constants/Constants";

export default function NewBlogPost() {
  const { isAuthenticated, isLoading } = useContext(UserContext);
  const navigate = useNavigate();

  useEffect(() => {
    // Only redirect if loading is complete and user is not authenticated
    if (!isLoading && !isAuthenticated) {
      navigate("/login", { state: { reason: ACTIONS.REDIRECT.NEW_POST } });
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Show loading state while checking authentication
  if (isLoading) {
    return <div>Loading...</div>;
  }

  // Only render the form if authenticated
  if (!isAuthenticated) return null;

  return <BlogPostForm />;
}
