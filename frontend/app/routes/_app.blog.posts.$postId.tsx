import { json, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";
import { Box, Alert } from "@mui/material";
import BlogPostDetail from "../old-app/components/BlogPostDetail";
import api from "../old-app/utils/api";
import type { MetaFunction } from "@remix-run/node";

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  if (!data?.post) {
    return [
      { title: "Post Not Found" },
      { name: "description", content: "The requested blog post could not be found." },
    ];
  }

  const { post } = data;
  return [
    { title: `${post.title} | Your Blog Name` },
    { name: "description", content: post.description || post.title },
    // OpenGraph tags
    { property: "og:title", content: post.title },
    { property: "og:description", content: post.description || post.title },
    { property: "og:type", content: "article" },
    // If you have a post image, you can add it here
    ...(post.image ? [{ property: "og:image", content: post.image }] : []),
    // Twitter Card tags
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: post.title },
    { name: "twitter:description", content: post.description || post.title },
  ];
};

export async function loader({ params }: LoaderFunctionArgs) {
  const postId = params.postId;
  
  try {
    const response = await api.get(`/blog/posts/id/${postId}/`);
    if (!response.data) {
      throw new Response("Post not found", { status: 404 });
    }
    return json({ post: response.data });
  } catch (error: any) {
    if (error?.response?.status === 404) {
      throw new Response("Post not found", { status: 404 });
    }
    console.error("Error loading post:", error);
    throw new Response("Error loading post", { status: 500 });
  }
}

export default function BlogPost() {
  const navigate = useNavigate();
  const { post } = useLoaderData<typeof loader>();
  
  if (!post) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <Alert severity="error" onClose={() => navigate('/blog')}>
          Post not found or error loading post
        </Alert>
      </Box>
    );
  }
  
  return (
    <Box sx={{ p: 2 }}>
      <BlogPostDetail post={post} />
    </Box>
  );
}
