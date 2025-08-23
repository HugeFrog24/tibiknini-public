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

export async function fetchPublicBlogPost(postId: string, request?: Request) {
  const options: RequestInit = {};
  if (request) {
    options.headers = {
      Cookie: request.headers.get('Cookie') || '',
    };
  }
  return fetchFromApi(`/blog/posts/id/${postId}/`, options);
}

export async function fetchPublicComments(postId: string) {
  return fetchFromApi(`/blog/posts/id/${postId}/comments/`);
}

export async function fetchReportReasons() {
  return fetchFromApi('/moderation/reasons/');
}

// Comment mutation functions for server-side actions
export async function createComment(postId: string, content: string, request: Request) {
  return fetchFromApi(`/blog/posts/id/${postId}/comments/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: request.headers.get('Cookie') || '',
      'X-CSRFToken': extractCSRFToken(request),
    },
    body: JSON.stringify({ content }),
  });
}

export async function updateComment(postId: string, commentId: string, content: string, request: Request) {
  return fetchFromApi(`/blog/posts/id/${postId}/comments/${commentId}/`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Cookie: request.headers.get('Cookie') || '',
      'X-CSRFToken': extractCSRFToken(request),
    },
    body: JSON.stringify({ content }),
  });
}

export async function deleteComment(postId: string, commentId: string, request: Request) {
  return fetchFromApi(`/blog/posts/id/${postId}/comments/${commentId}/`, {
    method: 'DELETE',
    headers: {
      Cookie: request.headers.get('Cookie') || '',
      'X-CSRFToken': extractCSRFToken(request),
    },
  });
}

export async function reportComment(commentId: string, reason: string, description: string, request: Request) {
  return fetchFromApi('/moderation/reports/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: request.headers.get('Cookie') || '',
      'X-CSRFToken': extractCSRFToken(request),
    },
    body: JSON.stringify({
      comment_id: commentId,
      reason,
      description: description || '',
    }),
  });
}

export async function reportPost(postId: string, reason: string, description: string, request: Request) {
  return fetchFromApi('/moderation/reports/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: request.headers.get('Cookie') || '',
      'X-CSRFToken': extractCSRFToken(request),
    },
    body: JSON.stringify({
      post_id: postId,
      reason,
      description: description || '',
    }),
  });
}

export async function reportUser(userId: string, reason: string, description: string, request: Request) {
  return fetchFromApi('/moderation/reports/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: request.headers.get('Cookie') || '',
      'X-CSRFToken': extractCSRFToken(request),
    },
    body: JSON.stringify({
      user_id: userId,
      reason,
      description: description || '',
    }),
  });
}

// Helper function to extract CSRF token from request
function extractCSRFToken(request: Request): string {
  // Try header first
  const headerToken = request.headers.get('x-csrftoken');
  if (headerToken) return headerToken;
  
  // Extract from cookies
  const cookie = request.headers.get('cookie');
  if (cookie) {
    const csrfMatch = cookie.match(/csrftoken=([^;]+)/);
    if (csrfMatch) return csrfMatch[1];
  }
  
  return '';
}

export async function fetchPrivacyPolicy() {
  return fetchFromApi('/privacy_policy/');
}

export async function fetchTermsOfService() {
  return fetchFromApi('/terms_of_service/');
}
