import React from 'react';
import { json, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import BlogPostForm from "../components/BlogPostForm";
import { fetchPublicBlogPost } from "../utils/server-fetch";
import type { LoaderData } from "../routes/_app";

export async function loader({ params }: LoaderFunctionArgs) {
  const { postId } = params;
  
  if (!postId) {
    throw new Response("Post ID is required", { status: 400 });
  }

  try {
    const post = await fetchPublicBlogPost(postId);
    return json({ post });
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
  return <BlogPostForm />;
}
