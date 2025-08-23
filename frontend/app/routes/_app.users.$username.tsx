import * as React from "react";
import { LoaderFunctionArgs, MetaFunction, redirect, ActionFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { Box } from "@mui/material";
import ProfileDetail from "../components/ProfileDetail";
import { fetchPublicProfile, fetchAuthenticatedUser, fetchReportReasons, reportUser } from "../utils/server-fetch";
import type { User } from "../types/user";


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
    } catch {
      // Ignore auth errors - user might not be logged in
    }

    // If the route is /users/me, redirect to the actual username route
    if (username === 'me') {
      if (!authenticatedUser) {
        return redirect('/login');
      }
      return redirect(`/users/${authenticatedUser.username}`);
    }
    
    // Fetch public profile data and report reasons in parallel
    const [userData, reportReasonsData] = await Promise.all([
      fetchPublicProfile(username),
      fetchReportReasons().catch(error => {
        console.error('Error fetching report reasons:', error);
        return { results: [] }; // Return empty results on error
      })
    ]);

    return {
      user: userData,
      authenticatedUser,
      reportReasons: reportReasonsData.results || []
    };
  } catch (error: any) {
    if (error instanceof Response) throw error;
    console.error("Error loading user profile:", error);
    throw new Response("Error loading user profile", { status: 500 });
  }
}

export async function action({ request, params }: ActionFunctionArgs) {
  const { username } = params;
  
  if (!username) {
    throw new Response("Username is required", { status: 400 });
  }

  try {
    const formData = await request.formData();
    const actionType = formData.get('_action') as string;
    
    console.log('🔍 DEBUG: User action function called with:', actionType);
    console.log('🔍 DEBUG: Username:', username);
    
    switch (actionType) {
      case 'reportUser': {
        const reason = formData.get('reason') as string;
        const description = formData.get('description') as string;
        
        if (!reason) {
          return { error: 'Reason is required' };
        }

        // Get the user data to find the user ID
        const userData = await fetchPublicProfile(username);
        
        console.log('🔍 DEBUG: Reporting user:', userData.id, 'Reason:', reason);
        
        const report = await reportUser(userData.id.toString(), reason, description || '', request);
        
        console.log('🔍 DEBUG: User reported successfully:', report);
        return { success: true, report };
      }
      
      default:
        console.log('🔍 DEBUG: Unknown action type:', actionType);
        return { error: 'Unknown action type' };
    }
  } catch (error) {
    console.error('🔍 DEBUG: Action error:', error);
    
    if (error instanceof Response) {
      throw error;
    }
    
    return { error: 'An error occurred while processing your request' };
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
  const { user, authenticatedUser, reportReasons } = useLoaderData<typeof loader>();
  
  return (
    <Box sx={{ p: 2 }}>
      <ProfileDetail initialUser={user} authenticatedUser={authenticatedUser} reportReasons={reportReasons} />
    </Box>
  );
}
