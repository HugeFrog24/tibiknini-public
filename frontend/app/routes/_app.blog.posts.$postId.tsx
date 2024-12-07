import * as React from "react";
import { json, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import BlogPostDetail from "../components/BlogPostDetail";
import { fetchPublicBlogPost } from "../utils/server-fetch";
import type { LoaderData } from "../routes/_app";

export async function loader({ params, request }: LoaderFunctionArgs) {
  const { postId } = params;
  
  if (!postId) {
    throw new Response("Post ID is required", { status: 400 });
  }

  try {
    // Pass the request object to ensure cookies are forwarded
    const post = await fetchPublicBlogPost(postId, request);
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
      { title: `Post Not Found - ${siteName}` },
      { name: "description", content: "This blog post could not be found." }
    ];
  }

  const post = data.post;
  const title = `${post.title} - ${siteName}`;
  
  return [
    { title },
    { name: "description", content: post.description || post.title },
    // OpenGraph tags
    { property: "og:title", content: title },
    { property: "og:description", content: post.description || post.title },
    { property: "og:type", content: "article" },
    { property: "og:site_name", content: siteName },
    { property: "article:published_time", content: post.pub_date },
    { property: "article:modified_time", content: post.pub_date },
    { property: "article:author", content: post.author.username },
    // Twitter Card tags
    { name: "twitter:card", content: "summary" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: post.description || post.title },
    { name: "twitter:site", content: `@${siteName.replace(/\s+/g, '')}` }
  ];
};

export default function BlogPost() {
  const { post } = useLoaderData<typeof loader>();
  
  return <BlogPostDetail post={post} />;
}
