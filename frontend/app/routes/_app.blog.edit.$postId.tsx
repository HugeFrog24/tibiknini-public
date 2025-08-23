import React, { useContext, useEffect } from 'react';
import { LoaderFunctionArgs, MetaFunction } from "react-router";
import { useLoaderData, useNavigate } from "react-router";
import BlogPostForm from "../components/BlogPostForm";
import { fetchPublicBlogPost } from "../utils/server-fetch";
import type { LoaderData } from "../routes/_app";
import UserContext from "../contexts/UserContext";
import { ACTIONS } from "../constants/Constants";

export async function loader({ params }: LoaderFunctionArgs) {
  const { postId } = params;
  
  if (!postId) {
    throw new Response("Post ID is required", { status: 400 });
  }

  try {
    const post = await fetchPublicBlogPost(postId);
    return { post };
  } catch (error) {
    if (error instanceof Response) throw error;
    console.error("Error loading blog post:", error);
    throw new Response("Error loading blog post", { status: 500 });
  }
}

export const meta: MetaFunction<typeof loader, { 'routes/_app': LoaderData }> = ({ data, matches }) => {
  const parentData = matches.find(
    (match) => match.id === "routes/_app"
  )?.data as LoaderData | undefined;
  
  const siteName = parentData?.siteData?.site_name || "Our Platform";

  if (!data?.post) {
    return [
      { title: `Edit Post - ${siteName}` },
      { name: "description", content: "Edit blog post" }
    ];
  }

  const post = data.post;
  const title = `Edit: ${post.title} - ${siteName}`;
  
  return [
    { title },
    { name: "description", content: `Edit blog post: ${post.title}` }
  ];
};

export default function EditBlogPost() {
  const { post } = useLoaderData<typeof loader>();
  const { user, isAuthenticated, isLoading } = useContext(UserContext);
  const navigate = useNavigate();

  useEffect(() => {
    // Only redirect if loading is complete and user is not authenticated
    if (!isLoading && !isAuthenticated) {
      navigate("/login", { state: { reason: ACTIONS.REDIRECT.EDIT_POST } });
      return;
    }

    // Check if user has permission to edit this post (only after loading is complete)
    if (!isLoading && isAuthenticated && user && !(user.is_staff || user.id === post.author.id)) {
      navigate("/blog/posts/" + post.id);
    }
  }, [isAuthenticated, isLoading, user, post, navigate]);

  // Show loading state while checking authentication
  if (isLoading) {
    return <div>Loading...</div>;
  }

  // Only render the form if authenticated and authorized
  if (!isAuthenticated || !(user?.is_staff || user?.id === post.author.id)) {
    return null;
  }

  return <BlogPostForm initialPost={post} />;
}
