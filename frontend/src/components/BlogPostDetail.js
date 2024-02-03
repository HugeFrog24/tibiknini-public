import React, {useContext, useEffect, useState} from "react";
import {Button} from "react-bootstrap";
import {useNavigate, useParams} from "react-router-dom";
import {toast, ToastContainer} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faHeart, faPencilAlt, faShareAlt, faTrash} from "@fortawesome/free-solid-svg-icons";
import {Helmet} from 'react-helmet-async';
import ReactMarkdown from "react-markdown";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

import UserContext from "./contexts/UserContext";
import UseBlogPost from "./UseBlogPost";
import { handleProfileImageError } from '../utils/ImageUtils';
import { useDarkMode } from './contexts/DarkModeContext';
import {REDIRECT_REASONS} from "./constants/Constants";
import BlogPostComments from "./BlogPostComments";
import config from '../config.json';
import api from "../utils/api";

const BlogPostDetail = ({previousPath}) => {
    const {postId} = useParams();
    const { modeClasses } = useDarkMode();
    const {fetchBlogPost, deleteBlogPost} = UseBlogPost();
    const [postState, setPostState] = useState(null);
    const [likesCount, setLikesCount] = useState(0);
    const [isLiked, setIsLiked] = useState(false);
    const [isLikeButtonHovered, setIsLikeButtonHovered] = useState(false);
    const navigate = useNavigate();
    const user = useContext(UserContext);

    const handleShare = () => {
        const url = window.location.href;

        if (navigator.share) {
            navigator.share({
                title: postState.title,
                text: 'Check out this blog post!',
                url: url,
            }).catch((error) => {
                if (error.name !== 'AbortError') {
                    navigator.clipboard.writeText(url);
                    toast.success("URL copied to clipboard!");
                } else {
                    toast.info("Sharing canceled.");
                }
            });
        } else {
            navigator.clipboard.writeText(url);
            toast.success("URL copied to clipboard!");
        }
    };

    useEffect(() => {
        const fetchPost = async () => {
            try {
                const post = await fetchBlogPost(postId);
                if (post) {
                    setPostState(post);
                    setLikesCount(post.likes_count);
                    setIsLiked(post.is_liked);
                }
            } catch (errorCode) {
                console.error("Failed to fetch post with error code:", errorCode);
                if (errorCode === 404) {
                    navigate("/error-404");
                }
            }
        };

        if (postId) {
            fetchPost();
        }
    }, [postId, fetchBlogPost, navigate]);

    const handleLike = async () => {
        if (!user) {
            navigate("/login", { state: { reason: REDIRECT_REASONS.LIKE_POST } });
            return;
        }

        try {
            const response = await api({
                method: isLiked ? 'delete' : 'post',
                url: `/blog/posts/id/${postId}/like/`
            });

            if ((isLiked && response.status === 204) || (!isLiked && response.status === 201)) {
                setIsLiked(!isLiked);
                setLikesCount(isLiked ? likesCount - 1 : likesCount + 1);
            } else {
                console.error('Failed to like/unlike post:', response.statusText);
            }
        } catch (error) {
            console.error('Failed to like/unlike post:', error);
        }
    };

    const handleDelete = async () => {
        await deleteBlogPost(postState.id);
        navigate("/blog");
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const renderTags = (tags) => {
        if (!tags || tags.length === 0) {
            return null;
        }

        return (
            <>
                <strong>Tags</strong>
                <div>
                    {tags.map((tag, index) => (
                        <span
                            key={index}
                            className="badge me-2"
                            style={{backgroundColor: tag.color, color: "#FFF"}}
                        >
                        #{tag.name}
                    </span>
                    ))}
                </div>
            </>
        );
    };

    return (
        <>
            <Helmet>
                <title>{postState ? `${postState.title} - ${config.siteName}` : "Loading..."}</title>
                <meta name="description" content={postState ? postState.summary : "Loading blog post..."}/>
                <meta property="og:title" content={postState ? postState.title : "Loading..."}/>
                <meta property="og:description" content={postState ? postState.summary : "Loading blog post..."}/>
                <meta property="og:url" content={window.location.href}/>
            </Helmet>
            <ToastContainer autoClose={3000}/>
            {postState ? (
                <div
                    className={`${modeClasses.textClass} text-start`}
                    id={`post-${postState.id}`}
                >
                    {user &&
                        user.is_authenticated &&
                        (user.is_staff || user.id === postState.author.id) && (
                            <div className="d-flex justify-content-end mb-3">
                                <Button
                                    variant="outline-primary" className="me-2 shadow"
                                    onClick={() => navigate(`/blog/posts/${postState.id}/edit`)}
                                >
                                    <FontAwesomeIcon icon={faPencilAlt}/> Edit
                                </Button>
                                <Button
                                    variant="outline-danger" className="shadow"
                                    onClick={handleDelete}
                                >
                                    <FontAwesomeIcon icon={faTrash}/> Remove
                                </Button>
                            </div>
                        )}
                    <div className="d-flex justify-content-between align-items-start">
                        <div>
                            <h2 className={`text-start ${modeClasses.textClass}`}>{postState.title}</h2>
                            <a
                                href={`/users/${postState.author.username}`}
                                className={`${modeClasses.linkClass} text-decoration-none d-flex gap-3 align-items-center`}
                            >
                                <img
                                    src={postState.author.image}
                                    alt={postState.author.username}
                                    className="rounded-circle"
                                    width="16"
                                    height="16"
                                    onError={handleProfileImageError}
                                />
                                <span className="fs-6">{postState.author.username}</span>
                            </a>
                        </div>
                        <span className="text-muted fs-6 align-self-end">
                            {formatDate(postState.pub_date)}
                        </span>
                    </div>
                    <hr/>
                    <div className="text-start">
                        {" "}
                        <ReactMarkdown>{postState.content}</ReactMarkdown>
                    </div>
                    <div className="text-start">{renderTags(postState.tags)}</div>
                    <div className="d-flex justify-content-end">
                        <Button
                            variant="outline-primary"
                            className="me-2 shadow"
                            onClick={handleLike}
                            onMouseOver={() => setIsLikeButtonHovered(true)}
                            onMouseOut={() => setIsLikeButtonHovered(false)}
                        >
                            <FontAwesomeIcon icon={faHeart} color={isLiked || isLikeButtonHovered ? 'red' : 'gray'}/> {likesCount}
                        </Button>
                        <Button variant="outline-primary" className="me-2 shadow" onClick={handleShare}>
                            <FontAwesomeIcon icon={faShareAlt}/> Share
                        </Button>
                    </div>
                    <BlogPostComments postId={postId} />
                </div>
                ) : (
                // Skeleton placeholders for loading state
                <div className="text-start">
                    <Skeleton height={40} width={300} className="mb-3" />
                    <div className="d-flex justify-content-between align-items-start">
                        <div>
                            <Skeleton circle={true} height={16} width={16} className="me-2" />
                            <Skeleton width={100} />
                        </div>
                        <Skeleton width={120} />
                    </div>
                    <hr />
                    <Skeleton count={5} />
                </div>
                )}
        </>
    );
};

export default BlogPostDetail;