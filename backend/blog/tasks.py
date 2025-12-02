import logging
from celery import shared_task
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils import timezone

from .models import BlogPost, Comment

logger = logging.getLogger(__name__)
User = get_user_model()


@shared_task(bind=True, max_retries=3)
def process_blog_post_creation(self, author_id, post_data):
    """
    Process blog post creation asynchronously.
    
    Args:
        author_id: ID of the User creating the post
        post_data: Dictionary containing post data (title, content, etc.)
    
    Returns:
        dict: Result of the blog post creation
    """
    try:
        with transaction.atomic():
            # Get the author
            try:
                author = User.objects.get(id=author_id)
            except User.DoesNotExist:
                logger.error(f"User {author_id} not found")
                return {"success": False, "error": "Author not found"}
            
            # Create the blog post
            try:
                blog_post = BlogPost.objects.create(
                    author=author,
                    title=post_data.get('title', ''),
                    content=post_data.get('content', ''),
                    is_draft=post_data.get('is_draft', True),
                    accent_color=post_data.get('accent_color', '#FFFFFF')
                )
                
                # Handle tags if provided
                if 'tags' in post_data and post_data['tags']:
                    blog_post.tags.set(post_data['tags'])
                
                # Handle image if provided
                if 'image' in post_data:
                    blog_post.image = post_data['image']
                    blog_post.save()
                
                logger.info(f"Successfully created blog post {blog_post.id} by user {author.username}")
                
                # Trigger content analysis for non-draft posts
                if not blog_post.is_draft:
                    try:
                        process_content_analysis.delay(blog_post.id)
                        logger.info(f"Queued content analysis for blog post {blog_post.id}")
                    except Exception as e:
                        logger.warning(f"Failed to queue content analysis for post {blog_post.id}: {e}")
                
                return {
                    "success": True,
                    "post_id": blog_post.id,
                    "title": blog_post.title,
                    "is_draft": blog_post.is_draft,
                    "created_at": blog_post.pub_date.isoformat() if blog_post.pub_date else None
                }
                
            except ValidationError as e:
                logger.error(f"Validation error creating blog post: {str(e)}")
                return {"success": False, "error": f"Validation error: {str(e)}"}
            except Exception as e:
                logger.error(f"Error creating blog post: {str(e)}")
                return {"success": False, "error": f"Failed to create post: {str(e)}"}
                
    except Exception as exc:
        logger.error(f"Unexpected error processing blog post creation: {str(exc)}", exc_info=True)
        
        # Retry with exponential backoff for transient errors
        if self.request.retries < self.max_retries:
            countdown = 60 * (2 ** self.request.retries)  # 60s, 120s, 240s
            logger.info(f"Retrying blog post creation in {countdown} seconds (attempt {self.request.retries + 1})")
            raise self.retry(exc=exc, countdown=countdown)
        else:
            logger.error(f"Max retries exceeded for blog post creation")
            return {"success": False, "error": f"Max retries exceeded: {str(exc)}"}


@shared_task(bind=True, max_retries=3)
def process_blog_post_update(self, post_id, author_id, post_data):
    """
    Process blog post update asynchronously.
    
    Args:
        post_id: ID of the BlogPost to update
        author_id: ID of the User updating the post
        post_data: Dictionary containing updated post data
    
    Returns:
        dict: Result of the blog post update
    """
    try:
        with transaction.atomic():
            # Get the post and author
            try:
                blog_post = BlogPost.objects.select_for_update().get(id=post_id)
                author = User.objects.get(id=author_id)
            except BlogPost.DoesNotExist:
                logger.error(f"BlogPost {post_id} not found")
                return {"success": False, "error": "Blog post not found"}
            except User.DoesNotExist:
                logger.error(f"User {author_id} not found")
                return {"success": False, "error": "Author not found"}
            
            # Check permissions (author or admin)
            if blog_post.author != author and not author.is_staff:
                logger.warning(f"User {author.username} attempted to update post {post_id} without permission")
                return {"success": False, "error": "Permission denied"}
            
            # Update the blog post
            try:
                # Update fields if provided
                if 'title' in post_data:
                    blog_post.title = post_data['title']
                if 'content' in post_data:
                    blog_post.content = post_data['content']
                if 'is_draft' in post_data:
                    blog_post.is_draft = post_data['is_draft']
                if 'accent_color' in post_data:
                    blog_post.accent_color = post_data['accent_color']
                if 'image' in post_data:
                    blog_post.image = post_data['image']
                
                blog_post.save()
                
                # Handle tags if provided
                if 'tags' in post_data:
                    blog_post.tags.set(post_data['tags'])
                
                logger.info(f"Successfully updated blog post {blog_post.id} by user {author.username}")
                
                # Trigger content analysis if content was changed and post is not draft
                content_changed = 'title' in post_data or 'content' in post_data
                if content_changed and not blog_post.is_draft:
                    try:
                        process_content_analysis.delay(blog_post.id)
                        logger.info(f"Queued content analysis for updated blog post {blog_post.id}")
                    except Exception as e:
                        logger.warning(f"Failed to queue content analysis for updated post {blog_post.id}: {e}")
                
                return {
                    "success": True,
                    "post_id": blog_post.id,
                    "title": blog_post.title,
                    "is_draft": blog_post.is_draft,
                    "updated_at": blog_post.pub_date.isoformat() if blog_post.pub_date else None
                }
                
            except ValidationError as e:
                logger.error(f"Validation error updating blog post {post_id}: {str(e)}")
                return {"success": False, "error": f"Validation error: {str(e)}"}
            except Exception as e:
                logger.error(f"Error updating blog post {post_id}: {str(e)}")
                return {"success": False, "error": f"Failed to update post: {str(e)}"}
                
    except Exception as exc:
        logger.error(f"Unexpected error processing blog post update for post {post_id}: {str(exc)}", exc_info=True)
        
        # Retry with exponential backoff for transient errors
        if self.request.retries < self.max_retries:
            countdown = 60 * (2 ** self.request.retries)  # 60s, 120s, 240s
            logger.info(f"Retrying blog post update for post {post_id} in {countdown} seconds (attempt {self.request.retries + 1})")
            raise self.retry(exc=exc, countdown=countdown)
        else:
            logger.error(f"Max retries exceeded for blog post update of post {post_id}")
            return {"success": False, "error": f"Max retries exceeded: {str(exc)}"}



@shared_task(bind=True, max_retries=3)
def process_blog_post_deletion(self, post_id, author_id):
    """
    Process blog post deletion asynchronously.
    
    Args:
        post_id: ID of the BlogPost to delete
        author_id: ID of the User deleting the post
    
    Returns:
        dict: Result of the blog post deletion
    """
    try:
        with transaction.atomic():
            # Get the post and author
            try:
                blog_post = BlogPost.objects.select_for_update().get(id=post_id)
                author = User.objects.get(id=author_id)
            except BlogPost.DoesNotExist:
                logger.error(f"BlogPost {post_id} not found for deletion")
                return {"success": False, "error": "Blog post not found"}
            except User.DoesNotExist:
                logger.error(f"User {author_id} not found")
                return {"success": False, "error": "Author not found"}
            
            # Check permissions (author or admin)
            if blog_post.author != author and not author.is_staff:
                logger.warning(f"User {author.username} attempted to delete post {post_id} without permission")
                return {"success": False, "error": "Permission denied"}
            
            # Store post info before deletion
            post_title = blog_post.title
            post_author = blog_post.author.username
            
            # Delete the blog post
            try:
                blog_post.delete()
                
                logger.info(f"Successfully deleted blog post {post_id} ('{post_title}') by user {author.username}")
                
                return {
                    "success": True,
                    "post_id": post_id,
                    "title": post_title,
                    "author": post_author,
                    "deleted_at": timezone.now().isoformat()
                }
                
            except Exception as e:
                logger.error(f"Error deleting blog post {post_id}: {str(e)}")
                return {"success": False, "error": f"Failed to delete post: {str(e)}"}
                
    except Exception as exc:
        logger.error(f"Unexpected error processing blog post deletion for post {post_id}: {str(exc)}", exc_info=True)
        
        # Retry with exponential backoff for transient errors
        if self.request.retries < self.max_retries:
            countdown = 60 * (2 ** self.request.retries)  # 60s, 120s, 240s
            logger.info(f"Retrying blog post deletion for post {post_id} in {countdown} seconds (attempt {self.request.retries + 1})")
            raise self.retry(exc=exc, countdown=countdown)
        else:
            logger.error(f"Max retries exceeded for blog post deletion of post {post_id}")
            return {"success": False, "error": f"Max retries exceeded: {str(exc)}"}

@shared_task
def process_content_analysis(post_id):
    """
    Analyze blog post content for spam, inappropriate content, etc.
    Uses the moderation system's content analyzer.
    
    Args:
        post_id: ID of the BlogPost to analyze
    """
    try:
        from moderation.content_analyzer import content_analyzer
        
        blog_post = BlogPost.objects.get(id=post_id)
        
        # Combine title and content for analysis
        full_content = f"{blog_post.title}\n\n{blog_post.content}"
        
        # Perform content analysis
        analysis_result = content_analyzer.analyze_content(full_content, blog_post)
        
        # Log the results
        if analysis_result['flagged_words']:
            logger.warning(
                f"Content analysis flagged blog post {post_id}: "
                f"Score {analysis_result['severity_score']}, "
                f"Max severity: {analysis_result['max_severity']}, "
                f"Flagged words: {len(analysis_result['flagged_words'])}"
            )
            
            # Log details of flagged content
            for flagged in analysis_result['flagged_words']:
                logger.info(
                    f"Flagged word in post {post_id}: '{flagged['word']}' "
                    f"(severity: {flagged['severity']}, matches: {flagged['match_count']})"
                )
        else:
            logger.info(f"Content analysis completed for blog post {post_id} - content appears clean")
        
        # Prepare response
        response = {
            "success": True,
            "post_id": post_id,
            "analysis": {
                "severity_score": analysis_result['severity_score'],
                "max_severity": analysis_result['max_severity'],
                "flagged_word_count": analysis_result['flagged_word_count'],
                "action_required": analysis_result['action_required'],
                "auto_hidden": analysis_result.get('auto_hide', False),
                "summary": analysis_result['analysis_summary']
            }
        }
        
        # If content was auto-hidden, include that in the response
        if analysis_result.get('auto_hide', False):
            response["warning"] = "Content was automatically hidden due to critical violations"
        
        return response
        
    except BlogPost.DoesNotExist:
        logger.error(f"BlogPost {post_id} not found for content analysis")
        return {"success": False, "error": "Blog post not found"}
    except Exception as e:
        logger.error(f"Error analyzing content for post {post_id}: {str(e)}", exc_info=True)
        return {"success": False, "error": str(e)}


@shared_task
def send_post_notifications(post_id, action='created'):
    """
    Send notifications when blog posts are created or updated.
    This is a placeholder for future notification features.
    
    Args:
        post_id: ID of the BlogPost
        action: 'created' or 'updated'
    """
    try:
        blog_post = BlogPost.objects.get(id=post_id)
        
        # Placeholder for notification logic
        # Future implementations could include:
        # - Email notifications to followers
        # - Push notifications
        # - Social media integration
        # - RSS feed updates
        
        logger.info(f"Notifications sent for blog post {post_id} ({action})")
        return {"success": True, "post_id": post_id, "action": action}
        
    except BlogPost.DoesNotExist:
        logger.error(f"BlogPost {post_id} not found for notifications")
        return {"success": False, "error": "Blog post not found"}
    except Exception as e:
        logger.error(f"Error sending notifications for post {post_id}: {str(e)}", exc_info=True)
        return {"success": False, "error": str(e)}


@shared_task(bind=True, max_retries=3)
def process_comment_creation(self, user_id, post_id, comment_data):
    """
    Process comment creation asynchronously.
    
    Args:
        user_id: ID of the user creating the comment
        post_id: ID of the blog post being commented on
        comment_data: Dictionary containing comment data
        
    Returns:
        Dictionary with success status and comment details
    """
    try:
        with transaction.atomic():
            # Get the user and blog post
            try:
                user = User.objects.get(id=user_id)
                blog_post = BlogPost.objects.get(id=post_id)
            except User.DoesNotExist:
                logger.error(f"User {user_id} not found")
                return {"success": False, "error": "User not found"}
            except BlogPost.DoesNotExist:
                logger.error(f"BlogPost {post_id} not found")
                return {"success": False, "error": "Blog post not found"}
            
            # Create the comment
            try:
                comment = Comment.objects.create(
                    author=user,
                    blog_post=blog_post,
                    content=comment_data['content']
                )
                
                logger.info(f"Successfully created comment {comment.id} for post {post_id} by user {user.username}")
                
                # Trigger content analysis for the comment
                if not comment.hidden:  # Only analyze if not already hidden
                    try:
                        process_comment_content_analysis.delay(comment.id)
                        logger.info(f"Queued content analysis for comment {comment.id}")
                    except Exception as e:
                        logger.warning(f"Failed to queue content analysis for comment {comment.id}: {e}")
                
                # Create notification for the blog post author
                try:
                    from notifications.tasks import create_comment_notification
                    create_comment_notification.delay(comment.id, blog_post.author.id, user.id)
                    logger.info(f"Queued comment notification for post author {blog_post.author.id}")
                except Exception as e:
                    logger.warning(f"Failed to queue comment notification: {e}")
                
                return {
                    "success": True,
                    "comment_id": comment.id,
                    "content": comment.content,
                    "author": comment.author.username,
                    "created_at": comment.pub_date.isoformat(),
                    "post_id": post_id
                }
                
            except ValidationError as e:
                logger.error(f"Validation error creating comment: {str(e)}")
                return {"success": False, "error": f"Validation error: {str(e)}"}
            except Exception as e:
                logger.error(f"Error creating comment: {str(e)}")
                return {"success": False, "error": f"Failed to create comment: {str(e)}"}
                
    except Exception as exc:
        logger.error(f"Unexpected error processing comment creation: {str(exc)}", exc_info=True)
        
        # Retry with exponential backoff for transient errors
        if self.request.retries < self.max_retries:
            countdown = 60 * (2 ** self.request.retries)  # 60s, 120s, 240s
            logger.info(f"Retrying comment creation in {countdown} seconds (attempt {self.request.retries + 1})")
            raise self.retry(exc=exc, countdown=countdown)
        else:
            logger.error(f"Max retries exceeded for comment creation")
            return {"success": False, "error": f"Max retries exceeded: {str(exc)}"}


@shared_task(bind=True, max_retries=3)
def process_comment_update(self, comment_id, user_id, comment_data):
    """
    Process comment update asynchronously.
    
    Args:
        comment_id: ID of the comment to update
        user_id: ID of the user updating the comment
        comment_data: Dictionary containing updated comment data
        
    Returns:
        Dictionary with success status and updated comment details
    """
    try:
        with transaction.atomic():
            # Get the comment and verify ownership
            try:
                comment = Comment.objects.select_for_update().get(id=comment_id)
                user = User.objects.get(id=user_id)
            except Comment.DoesNotExist:
                logger.error(f"Comment {comment_id} not found")
                return {"success": False, "error": "Comment not found"}
            except User.DoesNotExist:
                logger.error(f"User {user_id} not found")
                return {"success": False, "error": "User not found"}
            
            # Check permissions
            if comment.author != user and not user.is_staff:
                logger.warning(f"User {user.username} attempted to update comment {comment_id} without permission")
                return {"success": False, "error": "Permission denied: You can only edit your own comments"}
            
            # Store original content for comparison
            original_content = comment.content
            
            # Update comment fields
            try:
                if 'content' in comment_data:
                    comment.content = comment_data['content']
                
                comment.save()
                
                logger.info(f"Successfully updated comment {comment_id} by user {user.username}")
                
                # Trigger content analysis if content changed
                if 'content' in comment_data and comment_data['content'] != original_content:
                    if not comment.hidden:  # Only analyze if not already hidden
                        try:
                            process_comment_content_analysis.delay(comment.id)
                            logger.info(f"Queued content analysis for updated comment {comment.id}")
                        except Exception as e:
                            logger.warning(f"Failed to queue content analysis for updated comment {comment.id}: {e}")
                
                return {
                    "success": True,
                    "comment_id": comment.id,
                    "content": comment.content,
                    "author": comment.author.username,
                    "updated_at": comment.pub_date.isoformat(),
                    "post_id": comment.blog_post.id
                }
                
            except ValidationError as e:
                logger.error(f"Validation error updating comment {comment_id}: {str(e)}")
                return {"success": False, "error": f"Validation error: {str(e)}"}
            except Exception as e:
                logger.error(f"Error updating comment {comment_id}: {str(e)}")
                return {"success": False, "error": f"Failed to update comment: {str(e)}"}
                
    except Exception as exc:
        logger.error(f"Unexpected error processing comment update for comment {comment_id}: {str(exc)}", exc_info=True)
        
        # Retry with exponential backoff for transient errors
        if self.request.retries < self.max_retries:
            countdown = 60 * (2 ** self.request.retries)  # 60s, 120s, 240s
            logger.info(f"Retrying comment update for comment {comment_id} in {countdown} seconds (attempt {self.request.retries + 1})")
            raise self.retry(exc=exc, countdown=countdown)
        else:
            logger.error(f"Max retries exceeded for comment update of comment {comment_id}")
            return {"success": False, "error": f"Max retries exceeded: {str(exc)}"}


@shared_task(bind=True, max_retries=3)
def process_comment_deletion(self, comment_id, user_id):
    """
    Process comment deletion asynchronously.
    
    Args:
        comment_id: ID of the comment to delete
        user_id: ID of the user deleting the comment
        
    Returns:
        Dictionary with success status and deletion details
    """
    try:
        with transaction.atomic():
            # Get the comment and verify ownership
            try:
                comment = Comment.objects.select_for_update().get(id=comment_id)
                user = User.objects.get(id=user_id)
            except Comment.DoesNotExist:
                logger.error(f"Comment {comment_id} not found for deletion")
                return {"success": False, "error": "Comment not found"}
            except User.DoesNotExist:
                logger.error(f"User {user_id} not found")
                return {"success": False, "error": "User not found"}
            
            # Check permissions
            if comment.author != user and not user.is_staff:
                logger.warning(f"User {user.username} attempted to delete comment {comment_id} without permission")
                return {"success": False, "error": "Permission denied: You can only delete your own comments"}
            
            # Store comment details before deletion
            comment_details = {
                "comment_id": comment.id,
                "content": comment.content[:50] + ('...' if len(comment.content) > 50 else ''),
                "author": comment.author.username,
                "post_id": comment.blog_post.id,
                "deleted_at": timezone.now().isoformat()
            }
            
            # Delete the comment
            try:
                comment.delete()
                
                logger.info(f"Successfully deleted comment {comment_id} by user {user.username}")
                
                return {
                    "success": True,
                    **comment_details
                }
                
            except Exception as e:
                logger.error(f"Error deleting comment {comment_id}: {str(e)}")
                return {"success": False, "error": f"Failed to delete comment: {str(e)}"}
                
    except Exception as exc:
        logger.error(f"Unexpected error processing comment deletion for comment {comment_id}: {str(exc)}", exc_info=True)
        
        # Retry with exponential backoff for transient errors
        if self.request.retries < self.max_retries:
            countdown = 60 * (2 ** self.request.retries)  # 60s, 120s, 240s
            logger.info(f"Retrying comment deletion for comment {comment_id} in {countdown} seconds (attempt {self.request.retries + 1})")
            raise self.retry(exc=exc, countdown=countdown)
        else:
            logger.error(f"Max retries exceeded for comment deletion of comment {comment_id}")
            return {"success": False, "error": f"Max retries exceeded: {str(exc)}"}


@shared_task
def process_comment_content_analysis(comment_id):
    """
    Analyze comment content for inappropriate material.
    
    Args:
        comment_id: ID of the comment to analyze
        
    Returns:
        Dictionary with analysis results
    """
    try:
        from moderation.content_analyzer import content_analyzer
        
        comment = Comment.objects.get(id=comment_id)
        
        # Analyze the comment content
        analysis_result = content_analyzer.analyze_content(comment.content, comment)
        
        # Log the results
        if analysis_result['flagged_words']:
            logger.warning(
                f"Content analysis flagged comment {comment_id}: "
                f"Score {analysis_result['severity_score']}, "
                f"Max severity: {analysis_result['max_severity']}, "
                f"Flagged words: {len(analysis_result['flagged_words'])}"
            )
            
            # Log details of flagged content
            for flagged in analysis_result['flagged_words']:
                logger.info(
                    f"Flagged word in comment {comment_id}: '{flagged['word']}' "
                    f"(severity: {flagged['severity']}, matches: {flagged['match_count']})"
                )
        else:
            logger.info(f"Content analysis completed for comment {comment_id} - content appears clean")
        
        # Prepare response
        response = {
            "success": True,
            "comment_id": comment_id,
            "analysis": {
                "severity_score": analysis_result['severity_score'],
                "max_severity": analysis_result['max_severity'],
                "flagged_word_count": analysis_result['flagged_word_count'],
                "action_required": analysis_result['action_required'],
                "auto_hidden": analysis_result.get('auto_hide', False),
                "summary": analysis_result['analysis_summary']
            }
        }
        
        # If content was auto-hidden, include that in the response
        if analysis_result.get('auto_hide', False):
            response["warning"] = "Comment was automatically hidden due to critical violations"
        
        return response
        
    except Comment.DoesNotExist:
        logger.error(f"Comment {comment_id} not found for content analysis")
        return {"success": False, "error": "Comment not found"}
    except Exception as e:
        logger.error(f"Error analyzing content for comment {comment_id}: {str(e)}", exc_info=True)
        return {"success": False, "error": str(e)}
