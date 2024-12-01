import * as React from "react";
import { LoaderFunctionArgs, json, MetaFunction, redirect } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Box } from "@mui/material";
import ProfileDetail from "../old-app/components/ProfileDetail";
import { fetchPublicProfile, fetchAuthenticatedUser } from "../utils/server-fetch";

// Define the user type
type User = {
  username: string;
  bio?: string;
  profile_image?: string;
  date_joined: string;
};

export async function loader({ params, request }: LoaderFunctionArgs) {
  const { username } = params;
  
  if (!username) {
    throw new Response("Username is required", { status: 400 });
  }

  // If the route is /users/me, fetch the authenticated user from Django API
  if (username === 'me') {
    try {
      const user = await fetchAuthenticatedUser(request);
      // Redirect to the actual username route
      return redirect(`/users/${user.username}`);
    } catch (error) {
      // If unauthorized or any other error, redirect to login
      return redirect('/login');
    }
  }
  
  try {
    // Only fetch public profile data server-side
    const userData = await fetchPublicProfile(username);
    return json({ user: userData });
  } catch (error: any) {
    if (error instanceof Response) throw error;
    console.error("Error loading user profile:", error);
    throw new Response("Error loading user profile", { status: 500 });
  }
}

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  if (!data?.user) {
    return [
      { title: "User Not Found" },
      { name: "description", content: "This user profile could not be found." }
    ];
  }

  const user = data.user;
  const title = `${user.username}'s Profile`;
  const description = user.bio || `Check out ${user.username}'s profile and blog posts`;

  return [
    { title },
    { name: "description", content: description },
    // OpenGraph tags
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:type", content: "profile" },
    { property: "og:image", content: user.profile_image || "/default-profile-image.jpg" },
    { property: "profile:username", content: user.username },
    // Twitter Card tags
    { name: "twitter:card", content: "summary" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: user.profile_image || "/default-profile-image.jpg" }
  ];
};

export default function UserProfile() {
  const { user } = useLoaderData<typeof loader>();
  
  return (
    <Box sx={{ p: 2 }}>
      {/* @ts-ignore - ProfileDetail is a JS component that accepts initialUser prop */}
      <ProfileDetail initialUser={user} />
    </Box>
  );
}
