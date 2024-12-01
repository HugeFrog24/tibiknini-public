import { json, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";
import { Box, Alert } from "@mui/material";
import BlogPostDetail from "../old-app/components/BlogPostDetail";
import api, { setApiUrl } from "../old-app/utils/api";
import { getApiUrl } from "../env.server";

export async function loader({ params }: LoaderFunctionArgs) {
  const postId = params.postId;
  
  // Set API URL for server-side requests
  const apiUrl = getApiUrl();
  setApiUrl(apiUrl);
  
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
