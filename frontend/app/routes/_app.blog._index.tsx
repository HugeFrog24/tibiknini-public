import React from 'react';
import { defer, json, LoaderFunctionArgs } from "@remix-run/node";
import { Await, useLoaderData, useNavigate } from "@remix-run/react";
import BlogPostCard from "../old-app/components/BlogPostCard";
import { Typography, Button, Box, Pagination, Stack } from '@mui/material';
import { Warning as WarningIcon, Add as AddIcon } from '@mui/icons-material';
import { Suspense, useCallback, useState } from "react";
import { getApiUrl } from "../env.server";
import api from '../old-app/utils/api';
import BlogPostSkeleton from '../components/BlogPostSkeleton';

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
  posts: Promise<{
    posts: BlogPost[];
    totalPages: number;
    currentPage: number;
  }>;
  isAuthenticated: boolean;
  isStaff: boolean;
}

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  
  // Get auth status immediately (should be fast)
  const isAuthenticated = true; // Replace with actual auth check
  const isStaff = true; // Replace with actual staff check

  // Defer the posts loading
  const postsPromise = api.get(`/blog/posts/?page=${page}`)
    .then(response => ({
      posts: response.data.results || [],
      totalPages: Math.ceil(response.data.count / 10),
      currentPage: page,
    }));

  return defer({
    posts: postsPromise,
    isAuthenticated,
    isStaff,
  });
}

export default function BlogIndex() {
  const { posts, isAuthenticated, isStaff } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);

  const handlePageChange = useCallback((_: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
    navigate(`/blog?page=${value}`);
  }, [navigate]);

  return (
    <Box sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1">Blog Posts</Typography>
        {isAuthenticated && isStaff && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => navigate('/blog/new')}
          >
            New Post
          </Button>
        )}
      </Box>

      <Suspense fallback={
        <Stack spacing={2}>
          {[1, 2, 3, 4, 5].map((n) => (
            <BlogPostSkeleton key={n} />
          ))}
        </Stack>
      }>
        <Await resolve={posts}
          errorElement={
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <WarningIcon color="error" sx={{ fontSize: 48, mb: 2 }} />
              <Typography>Error loading blog posts. Please try again later.</Typography>
            </Box>
          }
        >
          {(resolvedPosts) => (
            <>
              {resolvedPosts.posts.map((post: any) => (
                <BlogPostCard key={post.id} post={post} />
              ))}
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <Pagination
                  count={resolvedPosts.totalPages}
                  page={resolvedPosts.currentPage}
                  onChange={handlePageChange}
                  color="primary"
                />
              </Box>
            </>
          )}
        </Await>
      </Suspense>
    </Box>
  );
}
