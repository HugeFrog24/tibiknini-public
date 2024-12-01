import * as React from "react";
import { json } from "@remix-run/node";
import { Box } from "@mui/material";
import BlogPostsList from "../old-app/components/BlogPostsList";

export async function loader() {
  // BlogPostsList handles its own data fetching on the client side
  // This ensures proper handling of authentication and pagination
  return json({});
}

export default function BlogIndex() {
  return (
    <Box sx={{ p: 2 }}>
      <BlogPostsList />
    </Box>
  );
}
