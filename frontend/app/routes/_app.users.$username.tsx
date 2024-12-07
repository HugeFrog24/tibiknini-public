import * as React from "react";
import { LoaderFunctionArgs, json, MetaFunction, redirect } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Box } from "@mui/material";
import ProfileDetail from "../components/ProfileDetail";
import { fetchPublicProfile, fetchAuthenticatedUser } from "../utils/server-fetch";
import type { User } from "../types/user";

interface LoaderData {
  user: User;
  authenticatedUser: User | null;
}

export async function loader({ params, request }: LoaderFunctionArgs) {
  const { username } = params;
  
  if (!username) {
    throw new Response("Username is required", { status: 400 });
  }

  try {
    // Get the authenticated user if available
    let authenticatedUser: User | null = null;
    try {
      authenticatedUser = await fetchAuthenticatedUser(request);
    } catch (error) {
      // Ignore auth errors - user might not be logged in
    }

    // If the route is /users/me, redirect to the actual username route
    if (username === 'me') {
      if (!authenticatedUser) {
        return redirect('/login');
      }
      return redirect(`/users/${authenticatedUser.username}`);
    }
    
    // Fetch public profile data
    const userData = await fetchPublicProfile(username);

    return json<LoaderData>({ 
      user: userData,
      authenticatedUser
    });
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
  const description = `Check out ${user.username}'s profile and blog posts`;

  return [
    { title },
    { name: "description", content: description },
    // OpenGraph tags
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:type", content: "profile" },
    { property: "og:image", content: user.image || "/default-profile-image.jpg" },
    { property: "profile:username", content: user.username },
    // Twitter Card tags
    { name: "twitter:card", content: "summary" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: user.image || "/default-profile-image.jpg" }
  ];
};

export default function UserProfile() {
  const { user, authenticatedUser } = useLoaderData<typeof loader>();
  
  return (
    <Box sx={{ p: 2 }}>
      <ProfileDetail initialUser={user} authenticatedUser={authenticatedUser} />
    </Box>
  );
}
