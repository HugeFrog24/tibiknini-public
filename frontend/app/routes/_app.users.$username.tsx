import { LoaderFunctionArgs, json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Box } from "@mui/material";
import ProfileDetail from "../old-app/components/ProfileDetail";
import api from "../old-app/utils/api";

export async function loader({ params }: LoaderFunctionArgs) {
  const { username } = params;
  
  try {
    const response = await api.get(`/users/${username}/`);
    if (!response.data) {
      throw new Response("User not found", { status: 404 });
    }
    return json({ user: response.data });
  } catch (error: any) {
    if (error?.response?.status === 404) {
      throw new Response("User not found", { status: 404 });
    }
    console.error("Error loading user profile:", error);
    throw new Response("Error loading user profile", { status: 500 });
  }
}

export default function UserProfile() {
  const { user } = useLoaderData<typeof loader>();
  
  return (
    <Box sx={{ p: 2 }}>
      <ProfileDetail user={user} />
    </Box>
  );
}
