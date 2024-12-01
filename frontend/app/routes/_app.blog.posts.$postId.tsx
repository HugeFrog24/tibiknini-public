import React from "react";
import { ClientOnly } from "remix-utils/client-only";
import BlogPostDetail from "../old-app/components/BlogPostDetail";

export default function BlogPostDetailPage() {
  return (
    <ClientOnly fallback={<div>Loading...</div>}>
      {() => <BlogPostDetail previousPath="/blog" />}
    </ClientOnly>
  );
}
