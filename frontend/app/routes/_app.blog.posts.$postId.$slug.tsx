import * as React from "react";
import { LoaderFunctionArgs, MetaFunction, redirect, ActionFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import slugify from "slugify";
import BlogPostDetail from "../components/BlogPostDetail";
import {
  fetchPublicBlogPost,
  fetchPublicComments,
  fetchReportReasons,
  createComment,
  updateComment,
  deleteComment,
  reportComment,
  reportPost
} from "../utils/server-fetch";
import type { LoaderData } from "../routes/_app";

export async function loader({ params, request }: LoaderFunctionArgs) {
  const { postId, slug } = params;
  
  if (!postId) {
    throw new Response("Post ID is required", { status: 400 });
  }

  try {
    // Fetch post, comments, and report reasons in parallel
    const [post, commentsData, reportReasonsData] = await Promise.all([
      fetchPublicBlogPost(postId, request),
      fetchPublicComments(postId).catch(error => {
        console.error('Error fetching comments:', error);
        return { results: [] }; // Return empty results on error
      }),
      fetchReportReasons().catch(error => {
        console.error('Error fetching report reasons:', error);
        return { results: [] }; // Return empty results on error
      })
    ]);
    
    // Generate the expected slug from the post title using slugify
    // This handles Unicode characters properly, including Cyrillic and Chinese
    const expectedSlug = slugify(post.title, {
      lower: true,        // Convert to lower case
      strict: true,       // Strip special characters except replacement
      locale: 'vi',       // Use Vietnamese locale for better Unicode handling
      trim: true          // Trim leading/trailing replacement chars
    });

    // If the provided slug doesn't match the expected slug, redirect to the correct URL
    // This ensures SEO benefits while keeping post loading based on ID
    if (slug !== expectedSlug) {
      return redirect(`/blog/posts/${postId}/${expectedSlug}`);
    }

    console.log('🔍 DEBUG: Loader fetched data:');
    console.log('🔍 DEBUG: Post:', post.title);
    console.log('🔍 DEBUG: Comments count:', commentsData.results?.length || 0);
    console.log('🔍 DEBUG: Report reasons count:', reportReasonsData.results?.length || 0);

    return {
      post,
      comments: commentsData.results || [],
      reportReasons: reportReasonsData.results || []
    };
  } catch (error) {
    if (error instanceof Response) throw error;
    console.error("Error loading blog post:", error);
    throw new Response("Error loading blog post", { status: 500 });
  }
}

export async function action({ request, params }: ActionFunctionArgs) {
  const { postId } = params;
  
  if (!postId) {
    throw new Response("Post ID is required", { status: 400 });
  }

  try {
    const formData = await request.formData();
    const actionType = formData.get('_action') as string;
    
    console.log('🔍 DEBUG: Action function called with:', actionType);
    console.log('🔍 DEBUG: Post ID:', postId);
    
    switch (actionType) {
      case 'create': {
        const content = formData.get('content') as string;
        
        if (!content?.trim()) {
          return { error: 'Comment content is required' };
        }

        console.log('🔍 DEBUG: Creating comment with content:', content);
        
        const comment = await createComment(postId, content.trim(), request);
        
        console.log('🔍 DEBUG: Comment created successfully:', comment);
        return { success: true, comment };
      }
      
      case 'update': {
        const commentId = formData.get('commentId') as string;
        const content = formData.get('content') as string;
        
        if (!commentId || !content?.trim()) {
          return { error: 'Comment ID and content are required' };
        }

        console.log('🔍 DEBUG: Updating comment:', commentId);
        
        const comment = await updateComment(postId, commentId, content.trim(), request);
        
        console.log('🔍 DEBUG: Comment updated successfully:', comment);
        return { success: true, comment };
      }
      
      case 'delete': {
        const commentId = formData.get('commentId') as string;
        
        if (!commentId) {
          return { error: 'Comment ID is required' };
        }

        console.log('🔍 DEBUG: Deleting comment:', commentId);
        
        await deleteComment(postId, commentId, request);
        
        console.log('🔍 DEBUG: Comment deleted successfully');
        return { success: true, deleted: commentId };
      }
      
      case 'reportComment': {
        const commentId = formData.get('commentId') as string;
        const reason = formData.get('reason') as string;
        const description = formData.get('description') as string;
        
        if (!commentId || !reason) {
          return { error: 'Comment ID and reason are required' };
        }

        console.log('🔍 DEBUG: Reporting comment:', commentId, 'Reason:', reason);
        
        const report = await reportComment(commentId, reason, description || '', request);
        
        console.log('🔍 DEBUG: Comment reported successfully:', report);
        return { success: true, report };
      }
      
      case 'reportPost': {
        const reason = formData.get('reason') as string;
        const description = formData.get('description') as string;
        
        if (!reason) {
          return { error: 'Reason is required' };
        }

        console.log('🔍 DEBUG: Reporting post:', postId, 'Reason:', reason);
        
        const report = await reportPost(postId, reason, description || '', request);
        
        console.log('🔍 DEBUG: Post reported successfully:', report);
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
    
    // Handle server-fetch errors (which are Response objects)
    return { error: 'An error occurred while processing your request' };
  }
}

export const meta: MetaFunction<typeof loader, { 'routes/_app': LoaderData }> = ({ data, matches }) => {
  const parentData = matches.find(
    (match) => match.id === "routes/_app"
  )?.data as LoaderData | undefined;
  
  const siteName = parentData?.siteData?.site_name || "Our Platform";

  if (!data?.post) {
    return [
      { title: `Post Not Found - ${siteName}` },
      { name: "description", content: "This blog post could not be found." }
    ];
  }

  const post = data.post;
  const title = `${post.title} - ${siteName}`;
  
  return [
    { title },
    { name: "description", content: post.description || post.title },
    // OpenGraph tags
    { property: "og:title", content: title },
    { property: "og:description", content: post.description || post.title },
    { property: "og:type", content: "article" },
    { property: "og:site_name", content: siteName },
    { property: "article:published_time", content: post.pub_date },
    { property: "article:modified_time", content: post.pub_date },
    { property: "article:author", content: post.author.username },
    // Twitter Card tags
    { name: "twitter:card", content: "summary" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: post.description || post.title },
    { name: "twitter:site", content: `@${siteName.replace(/\s+/g, '')}` }
  ];
};

export default function BlogPost() {
  const { post, comments, reportReasons } = useLoaderData<typeof loader>();
  
  return <BlogPostDetail post={post} comments={comments} reportReasons={reportReasons} />;
}
