import { getApiUrl } from "../env.server";

async function fetchFromApi(path: string, options: RequestInit = {}) {
  const apiUrl = getApiUrl();
  const response = await fetch(`${apiUrl}/api${path}`, {
    ...options,
    credentials: 'include', // This ensures cookies are sent
  });
  
  if (!response.ok) {
    if (response.status === 404) {
      throw new Response("Not found", { status: 404 });
    }
    if (response.status === 401) {
      throw new Response("Unauthorized", { status: 401 });
    }
    throw new Response("Error loading data", { status: 500 });
  }
  
  return response.json();
}

export async function fetchSiteTitle() {
  return fetchFromApi('/core/site-title/');
}

export async function fetchAuthenticatedUser(request: Request) {
  return fetchFromApi('/users/me/', {
    headers: {
      Cookie: request.headers.get('Cookie') || '',
    },
  });
}

export async function fetchPublicProfile(username: string) {
  return fetchFromApi(`/users/${username}/`);
}

export async function fetchPublicBlogPosts(page?: number) {
  const query = page ? `?page=${page}` : '';
  return fetchFromApi(`/blog/posts/${query}`);
}

export async function fetchPublicBlogPost(postId: string) {
  return fetchFromApi(`/blog/posts/id/${postId}/`);
}

export async function fetchPublicComments(postId: string) {
  return fetchFromApi(`/blog/posts/id/${postId}/comments/`);
}

export async function fetchPrivacyPolicy() {
  return fetchFromApi('/privacy_policy/');
}

export async function fetchTermsOfService() {
  return fetchFromApi('/terms_of_service/');
}
