import React, {useContext, useEffect, useState} from 'react';

import {Button, FloatingLabel, Form, Spinner} from "react-bootstrap";
import {useNavigate, useParams} from "react-router-dom";
import {toast} from "react-toastify";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faSave, faTimes} from '@fortawesome/free-solid-svg-icons';

import UserContext from "./contexts/UserContext";
import {REDIRECT_REASONS} from "./constants/Constants";
import UseBlogPost from "./UseBlogPost";
import UseDarkMode from "../utils/UseDarkMode";

const BlogPostForm = ({previousPath}) => {
    const navigate = useNavigate();
    const {fetchBlogPost, createBlogPost, updateBlogPost} = UseBlogPost();
    const {bgClass, textClass} = UseDarkMode();
    const {postId} = useParams();
    const user = useContext(UserContext);
    // Add a new state for the fetched post
    const [post, setPost] = useState(null);

    // Adjust the initial state declarations
    const [isDraft, setIsDraft] = useState(false);
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleToggleDraft = () => setIsDraft(!isDraft);

    const handleSave = async (isDraft) => {
        setIsSubmitting(true);  // Set loading to true when save process starts

        // Ensure user is authenticated
        if (!user || !user.is_authenticated) {
            toast.warning("You must be logged in to save this post.");
            setIsSubmitting(false);  // Reset loading to false
            return;
        }

        // Ensure user has permissions for updating a post (only when editing)
        if (postId && !(user.is_staff || user.id === post.author.id)) {
            toast.warning("You do not have permission to save this post.");
            setIsSubmitting(false);  // Reset loading to false
            return;
        }

        // Check if title or content is empty
        if (!title.trim() || !content.trim()) {
            // If either is empty, show a warning and return early
            toast.warning("Please fill all fields before saving.");
            setIsSubmitting(false);  // Reset loading to false
            return;
        }

        const newPost = {
            title: title,
            content: content,
            is_draft: isDraft,
        };

        try {
            if (!postId) {
                // Create a new post
                const response = await createBlogPost(newPost);
                // Navigate to the new post's detail view
                navigate(`/blog/posts/${response.id}`);
            } else {
                // Update existing post
                await updateBlogPost(post.id, newPost);
                navigate(`/blog/posts/${post.id}`);
            }
        } catch (error) {
            console.error("Error saving post:", error);
            toast.error('An error occurred while saving the post. Please try again.');
        } finally {
            setIsSubmitting(false);  // Reset loading to false once save process completes
        }
    };

    const handleCancel = () => {
        if (previousPath) {
            navigate(previousPath);
        } else if (postId) {
            // If editing an existing post, navigate back to the post's detail view
            navigate(`/blog/posts/${postId}`);
        } else {
            // If creating a new post, navigate back to the blog list or another default
            navigate('/blog');
        }
    };

    useEffect(() => {
        const fetchPostForEditing = async () => {
            if (postId) {
                try {
                    const fetchedPost = await fetchBlogPost(postId);
                    // If user is not authenticated, redirect to login page with a reason for the redirection
                    if (!user || !user.is_authenticated) {
                        navigate("/login", {state: {reason: REDIRECT_REASONS.EDIT_POST}});
                        return;  // Exit early to prevent further execution
                    }
                    // Check if the user is either the post author or has the 'is_staff' status
                    if (user.is_staff || user.id === fetchedPost.author.id) {
                        setPost(fetchedPost);  // Set the fetched post to state
                        setTitle(fetchedPost.title);
                        setContent(fetchedPost.content);
                        setIsDraft(fetchedPost.is_draft ?? false);
                    } else {
                        // If not authorized to edit, redirect to login with a reason for the redirection
                        navigate("/login", {state: {reason: REDIRECT_REASONS.EDIT_POST}});
                    }
                } catch (error) {
                    console.error("Failed to fetch post for editing:", error);
                }
            }
        };

        fetchPostForEditing();
    }, [postId, fetchBlogPost, user, navigate]);

    return (
        <div>
            <div className="d-flex justify-content-end mb-3">
                <div className="form-check form-switch me-2">
                    <input
                        className="form-check-input"
                        type="checkbox"
                        id={`isDraft-${postId || 'new'}`}
                        checked={isDraft}
                        onChange={handleToggleDraft}
                    />
                    <label
                        className="form-check-label"
                        htmlFor={`isDraft-${postId || 'new'}`}
                    >
                        Draft
                    </label>
                </div>
                <Button variant={isSubmitting ? "secondary" : "outline-success"} className="me-2" onClick={() => handleSave(isDraft)} disabled={isSubmitting}>
                {
                    isSubmitting ?
                        <Spinner
                            as="span"
                            animation="border"
                            size="sm"
                            role="status"
                            aria-hidden="true"
                        /> :
                        <>
                            <FontAwesomeIcon icon={faSave}/> Save
                        </>
                }
                </Button>
                <Button variant="outline-secondary" onClick={handleCancel}>
                    <FontAwesomeIcon icon={faTimes}/> Cancel
                </Button>
            </div>
            <FloatingLabel controlId="floatingTitle" label="Title">
                <Form.Control
                    className={`mb-3 ${textClass} ${bgClass}`}
                    type="text"
                    placeholder="Enter your title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                />
            </FloatingLabel>
            <FloatingLabel controlId="floatingContent" label="Content">
                <Form.Control
                    className={`mb-3 ${textClass} ${bgClass}`}
                    as="textarea"
                    // Ideally, this would set the visible number of lines in the textarea to 15.
                    // However, due to Bootstrap's styles for floating labels, this doesn't work on its own.
                    rows="15"
                    // Inline style to override Bootstrap's fixed height for form controls inside .form-floating.
                    // By setting height to 'auto', we allow the textarea to respect the 'rows' attribute.
                    // Additionally, resizing is disabled by setting 'resize' to 'none'.
                    style={{height: 'auto', resize: 'none'}}
                    placeholder="Enter your content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                />
            </FloatingLabel>
        </div>
    );
}

export default BlogPostForm;
