import * as React from "react";
import { json, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import BlogPostDetail from "../old-app/components/BlogPostDetail";
import { fetchPublicBlogPost } from "../utils/server-fetch";

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

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  if (!data?.post) {
    return [
      { title: "Post Not Found" },
      { name: "description", content: "This blog post could not be found." }
    ];
  }

  const post = data.post;
  return [
    { title: post.title },
    { name: "description", content: post.description || post.title },
    // OpenGraph tags
    { property: "og:title", content: post.title },
    { property: "og:description", content: post.description || post.title },
    { property: "og:type", content: "article" },
    { property: "article:published_time", content: post.created_at },
    { property: "article:modified_time", content: post.updated_at },
    { property: "article:author", content: post.author.username },
    // Twitter Card tags
    { name: "twitter:card", content: "summary" },
    { name: "twitter:title", content: post.title },
    { name: "twitter:description", content: post.description || post.title }
  ];
};

export default function BlogPost() {
  const { post } = useLoaderData<typeof loader>();
  
  return <BlogPostDetail post={post} />;
}
