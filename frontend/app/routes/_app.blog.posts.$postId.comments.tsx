import * as React from "react";
import { LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { fetchPublicComments } from "../utils/server-fetch";

export async function loader({ params }: LoaderFunctionArgs) {
  const { postId } = params;
  
  if (!postId) {
    throw new Response("Post ID is required", { status: 400 });
  }

  try {
    const comments = await fetchPublicComments(postId);
    return { comments };
  } catch (error) {
    if (error instanceof Response) throw error;
    console.error("Error loading comments:", error);
    throw new Response("Error loading comments", { status: 500 });
  }
}

export default function PostComments() {
  const { comments } = useLoaderData<typeof loader>();
  
  return (
    <div>
      {/* Comments are rendered by the BlogPostComments component client-side */}
      {/* This loader provides initial data for SEO purposes */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Comment",
            commentCount: comments.length,
            comments: comments.map((comment: any) => ({
              "@type": "Comment",
              text: comment.content,
              author: {
                "@type": "Person",
                name: comment.author.username
              },
              dateCreated: comment.created_at
            }))
          })
        }}
      />
    </div>
  );
}
