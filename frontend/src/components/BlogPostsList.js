import React, {useCallback, useContext, useEffect, useState} from "react";
import Button from "react-bootstrap/Button";
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome'
import {faPlus} from '@fortawesome/free-solid-svg-icons'
import {useNavigate} from "react-router-dom";
import Pagination from "react-bootstrap/Pagination";
import { Helmet } from 'react-helmet-async';

import config from "../config.json";
import BlogPostCard from "./BlogPostCard";
import UserContext from "./contexts/UserContext";
import UseDarkMode from "../utils/UseDarkMode";
import api from "../utils/api"

const BlogPostsList = ({postId}) => {
    const [blogPosts, setBlogPosts] = useState([]);
    const isDetailView = postId !== undefined;
    const [hasError, setHasError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();
    const user = useContext(UserContext);
    const {textClass} = UseDarkMode();
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);

    const fetchBlogPosts = useCallback(
        (retryAttempt = 0, page = 1) => {
            setIsLoading(true);
            setHasError(false);
            const url = postId
                ? `/blog/posts/id/${postId}/`
                : `/blog/posts/?page=${page}`;

            api.get(url)
                .then((response) => {
                    const data = response.data;
                    setBlogPosts(postId ? [data] : data.results);
                    if (data.page_count) {
                        setTotalPages(data.page_count);
                    } else {
                        const calculatedPages = Math.ceil(data.count / 10);
                        setTotalPages(calculatedPages);
                    }
                    setIsLoading(false);
                })
                .catch((error) => {
                    console.error("Error fetching blog posts:", error);
                    if (retryAttempt < 3) {
                        setTimeout(() => {
                            fetchBlogPosts(retryAttempt + 1, page);
                        }, 3000 * retryAttempt);
                    } else {
                        setIsLoading(false);
                        setHasError(true);
                    }
                });
        },
        [postId]
    );

    const handleAddPostClick = () => {
        navigate("/blog/posts/new");
    };

    const handlePostUpdated = (updatedPost) => {
        setBlogPosts((prevPosts) => {
            const index = prevPosts.findIndex((post) => post.id === updatedPost.id);
            const updatedPosts = [...prevPosts];
            const prevPost = prevPosts[index];
            updatedPosts[index] = {
                ...prevPost,
                ...updatedPost,
            };
            return updatedPosts;
        });
    };

    const handleRetryClick = () => {
        fetchBlogPosts(1);
    };

    const renderPagination = () => {
        let items = [];
        for (let number = 1; number <= totalPages; number++) {
            items.push(
                <Pagination.Item
                    key={number}
                    active={number === currentPage}
                    onClick={() => setCurrentPage(number)}>
                    {number}
                </Pagination.Item>
            );
        }
        return <Pagination>{items}</Pagination>;
    };

    useEffect(() => {
        fetchBlogPosts(1, currentPage);
    }, [fetchBlogPosts, currentPage]);

    return (
        <div>
            <Helmet>
                <title>Blog - {config.siteName}</title>
                <meta name="description" content={`Browse the latest blog posts on ${config.siteName}`} />
            </Helmet>
            <div className="d-flex align-items-center justify-content-between">
                <h1>Blog</h1>
                {user && (
                    <Button variant="success" className="shadow" onClick={handleAddPostClick}>
                        <FontAwesomeIcon icon={faPlus}/> Add post
                    </Button>
                )}
            </div>
            <hr/>
            {isLoading ? (
                <div>
                    {Array(5).fill(0).map((_, index) => (
                        <BlogPostCard key={index} />
                        ))}
                </div>
            ) : hasError ? (
                <div>
                    <h2 role="img" aria-label="Warning">
                        ⚠️
                    </h2>
                    <p>Error retrieving data</p>
                    <Button variant="primary" className="shadow" onClick={handleRetryClick}>
                        Retry
                    </Button>
                </div>
            ) : blogPosts.length === 0 ? (
                <div>
                    <h3 className={textClass}>Nothing to show</h3>
                    <p>There are no blog posts available at this time.</p>
                </div>
            ) : (
                <>
                    {blogPosts.map((post, index) => (
                        <BlogPostCard
                            key={post.id || index}
                            post={post}
                            isDetailView={isDetailView}
                            user={user}
                            postId={postId}
                            textClass={textClass}
                            onPostUpdated={(updatedPost) =>
                                handlePostUpdated(updatedPost, index)
                            }
                        />
                    ))}
                    {blogPosts.length > 0 && renderPagination()}
                </>
            )}
        </div>
    );
};

export default BlogPostsList;
