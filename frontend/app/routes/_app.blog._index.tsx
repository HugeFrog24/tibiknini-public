import * as React from "react";
import { json, type LoaderFunctionArgs, type MetaFunction } from "@remix-run/node";
import { Box } from "@mui/material";
import { useLoaderData } from "@remix-run/react";
import BlogPostsList, { type BlogPostsResponse } from "../components/BlogPostsList";
import { fetchPublicBlogPosts } from "../utils/server-fetch";
import type { LoaderData } from "./_app";

export const meta: MetaFunction<typeof loader, { 'routes/_app': LoaderData }> = ({ matches }) => {
  const parentData = matches.find(
    (match) => match.id === "routes/_app"
  )?.data as LoaderData | undefined;
  
  const siteName = parentData?.siteData?.site_name || "Our Platform";

  return [
    { title: `Blog - ${siteName}` },
    { name: "description", content: `Read the latest blog posts on ${siteName}` },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const page = url.searchParams.get("page") || "1";
  const posts = await fetchPublicBlogPosts(parseInt(page));
  return json(posts);
}

export default function BlogIndex() {
  const data = useLoaderData<typeof loader>() as BlogPostsResponse;
  
  return (
    <Box sx={{ p: 2 }}>
      <BlogPostsList initialData={data} />
    </Box>
  );
}
