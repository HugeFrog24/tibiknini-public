import React from 'react';
import { json, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";
import BlogPostCard from "../old-app/components/BlogPostCard";
import { Typography, Button, Box, Pagination } from '@mui/material';
import { Warning as WarningIcon, Add as AddIcon } from '@mui/icons-material';
import { useCallback, useState } from "react";
import { getApiUrl } from "../env.server";

// Types for our data
interface BlogPost {
  id: string;
  title: string;
  content: string;
  author?: string;
  created_at?: string;
  updated_at?: string;
  published?: boolean;
}

interface LoaderData {
  posts: BlogPost[];
  totalPages: number;
  currentPage: number;
  isAuthenticated: boolean;
  isStaff: boolean;
}

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  
  try {
    const apiUrl = getApiUrl();
    const response = await fetch(`${apiUrl}/api/blog/posts/?page=${page}`);
    const data = await response.json();
    
    // Get auth status from session (implement your auth logic here)
    const isAuthenticated = true; // Replace with actual auth check
    const isStaff = true; // Replace with actual staff check

    return json<LoaderData>({
      posts: data.results || [],
      totalPages: Math.ceil(data.count / 10),
      currentPage: page,
      isAuthenticated,
      isStaff,
    });
  } catch (error) {
    console.error("Error fetching blog posts:", error);
    return json<LoaderData>({
      posts: [],
      totalPages: 0,
      currentPage: 1,
      isAuthenticated: false,
      isStaff: false,
    });
  }
}

export default function BlogIndex() {
  const { posts, totalPages, currentPage, isAuthenticated, isStaff } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [hasError, setHasError] = useState(false);

  const handleAddPostClick = () => {
    navigate("/blog/posts/new");
  };

  const handlePageChange = useCallback((_event: React.ChangeEvent<unknown>, page: number) => {
    navigate(`?page=${page}`);
  }, [navigate]);

  return (
    <Box>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Typography variant="h4" component="h1">Blog</Typography>
        {isAuthenticated && isStaff && (
          <Button
            variant="contained"
            color="primary"
            onClick={handleAddPostClick}
            startIcon={<AddIcon />}
          >
            Add Post
          </Button>
        )}
      </Box>
      <hr/>
      {hasError ? (
        <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
          <WarningIcon color="warning" fontSize="large" />
          <Typography variant="body1">Error retrieving data</Typography>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </Box>
      ) : posts.length === 0 ? (
        <Box>
          <Typography variant="h5" component="h3">Nothing to show</Typography>
          <Typography variant="body1">There are no blog posts available at this time.</Typography>
        </Box>
      ) : (
        <>
          <Box display="flex" flexDirection="column" gap={2}>
            {posts.map((post) => (
              <BlogPostCard
                key={post.id}
                post={post}
              />
            ))}
          </Box>
          {totalPages > 1 && (
            <Box display="flex" justifyContent="center" mt={3}>
              <Pagination 
                count={totalPages}
                page={currentPage}
                onChange={handlePageChange}
                color="primary"
                showFirstButton
                showLastButton
              />
            </Box>
          )}
        </>
      )}
    </Box>
  );
}
