import React, { useContext, useEffect } from 'react';
import { useNavigate } from "@remix-run/react";
import UserContext from "../contexts/UserContext";
import BlogPostForm from "../components/BlogPostForm";
import { REDIRECT_REASONS } from "../constants/Constants";

export default function NewBlogPost() {
  const { isAuthenticated } = useContext(UserContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login", { state: { reason: REDIRECT_REASONS.NEW_POST } });
    }
  }, [isAuthenticated, navigate]);

  // Only render the form if authenticated
  if (!isAuthenticated) return null;

  return <BlogPostForm />;
}
