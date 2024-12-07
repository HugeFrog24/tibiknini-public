import React from "react";
import { Box, Typography, Container } from "@mui/material";

interface HomeProps {
  textClass?: string;
}

export default function Home({ textClass }: HomeProps) {
  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 2 }}>
        <Typography 
          variant="h2" 
          component="h1" 
          className={textClass}
          gutterBottom
        >
          Welcome to our website!
        </Typography>
        <Typography variant="body1">
          This is the home page.
        </Typography>
      </Box>
    </Container>
  );
}