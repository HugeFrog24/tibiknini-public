import React, {useEffect, useState} from "react";
import {Spinner} from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCommentAlt } from "@fortawesome/free-solid-svg-icons";
import api from '../utils/api';  // Import the api instance

const BlogPostComments = ({ postId }) => {
    const [comments, setComments] = useState([]);
    const [loadingComments, setLoadingComments] = useState(false);

    useEffect(() => {
        const fetchComments = async () => {
            setLoadingComments(true);
            try {
                // Use the api instance for the GET request
                const response = await api.get(`/blog/posts/id/${postId}/comments/`);

                if (response.status === 200) {
                    setComments(response.data.results);  // Extract results from the response
                } else {
                    console.error("Failed to fetch comments:", response.statusText);
                }
            } catch (error) {
                console.error("Failed to fetch comments:", error);
            } finally {
                setLoadingComments(false);
            }
        };

        if (postId) {
            fetchComments();
        }
    }, [postId]);

    return (
        <>
            <h3 className="mt-4">Comments</h3>
            <hr/>
            {loadingComments ? (
                <div className="d-flex justify-content-center">
                    <Spinner animation="border" role="status">
                        <span className="visually-hidden">Loading comments...</span>
                    </Spinner>
                </div>
            ) : (
                comments.length > 0 ? (
                    comments.map(comment => (
                        <div key={comment.id} className="mb-3">
                            <strong>{comment.author.username}</strong>
                            <p>{comment.content}</p>
                        </div>
                    ))
                ) : (
                    <div className="text-center">
                        <FontAwesomeIcon icon={faCommentAlt} size="3x" className="mb-3" />
                        <p>No comments yet. Be the first to share your thoughts!</p>
                    </div>
                )
            )}
        </>
    );
}

export default BlogPostComments;
