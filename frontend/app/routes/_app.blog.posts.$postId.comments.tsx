import { json, LoaderFunctionArgs } from "@remix-run/node";
import api from "../old-app/utils/api";

export async function loader({ params }: LoaderFunctionArgs) {
  const postId = params.postId;
  try {
    const [commentsResponse, reasonsResponse] = await Promise.all([
      api.get(`/blog/posts/id/${postId}/comments/`),
      api.get('/blog/comments/report-reasons/')
    ]);
    
    if (!commentsResponse.data || !reasonsResponse.data) {
      throw new Response("Failed to load comments data", { status: 500 });
    }

    return json({
      comments: commentsResponse.data.results || [],
      reportReasons: reasonsResponse.data || []
    });
  } catch (error: any) {
    console.error("Error loading comments:", error);
    throw new Response("Error loading comments", { status: 500 });
  }
}

export async function action({ request, params }: LoaderFunctionArgs) {
  const postId = params.postId;
  const formData = await request.formData();
  const { _action, ...values } = Object.fromEntries(formData);

  try {
    let response;
    switch (_action) {
      case 'create':
        response = await api.post(`/blog/posts/id/${postId}/comments/`, values);
        return json(response.data);
      
      case 'update':
        response = await api.put(`/blog/comments/id/${values.commentId}/`, values);
        return json(response.data);
      
      case 'delete':
        await api.delete(`/blog/comments/id/${values.commentId}/`);
        return json({ success: true });
      
      case 'report':
        response = await api.post(`/blog/comments/id/${values.commentId}/report/`, {
          reason: values.reason,
          description: values.description
        });
        return json(response.data);
      
      default:
        throw new Response(`Invalid action: ${_action}`, { status: 400 });
    }
  } catch (error: any) {
    console.error("Error in comments action:", error);
    const message = error.response?.data?.message || "Error processing request";
    throw new Response(message, { status: error.response?.status || 500 });
  }
}
