import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Container, Typography, Paper, Box } from "@mui/material";
import ReactMarkdown from 'react-markdown';
import React from 'react';
import { fetchTermsOfService } from "../utils/server-fetch";
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import { Link as MuiLink } from '@mui/material';

export async function loader() {
  const data = await fetchTermsOfService();
  return json(data);
}

export default function TermsOfService() {
  const data = useLoaderData<typeof loader>();
  return (
    <Container maxWidth="md">
      <Paper sx={{ p: 4, my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {data.title}
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          Last updated: {new Date(data.last_updated).toLocaleDateString()}
        </Typography>
        <Box sx={{ mt: 4 }}>
          <ReactMarkdown
            components={{
              a: ({ href, children }) => (
                <MuiLink href={href} sx={{ color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                  {children}
                </MuiLink>
              ),
            }}
            rehypePlugins={[
              rehypeSlug,
              [rehypeAutolinkHeadings, { behavior: 'wrap' }]
            ]}
          >
            {data.content}
          </ReactMarkdown>
        </Box>
      </Paper>
    </Container>
  );
}