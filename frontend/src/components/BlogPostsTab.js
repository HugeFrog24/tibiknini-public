import React, {useCallback, useContext, useEffect, useState} from "react";
import BlogPostCard from "./BlogPostCard";
import Spinner from "react-bootstrap/Spinner";
import ApiUrlContext from "./contexts/ApiUrlContext";

const BlogPostsTab = ({username}) => {
    const apiUrl = useContext(ApiUrlContext);
    const [blogPosts, setBlogPosts] = useState([]);
    const [hasError, setHasError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const fetchBlogPosts = useCallback(
        (retryAttempt) => {
            setIsLoading(true);
            setHasError(false);
            const url = `${apiUrl}/blog/posts/author/${username}/`;
            fetch(url)
                .then((response) => {
                    if (!response.ok) {
                        throw new Error(
                            `Network response was not ok: ${response.statusText}`
                            );
                    }
                    return response.json();
                })
                .then((data) => {
                    setBlogPosts(data.results);
                    setIsLoading(false);
                })
                .catch((error) => {
                    console.error("Error fetching blog posts:", error);
                    if (retryAttempt < 3) {
                        setTimeout(() => {
                            fetchBlogPosts(retryAttempt + 1);
                            }, 3000 * retryAttempt);
                    } else {
                        setIsLoading(false);
                        setHasError(true);
                    }
                });
            },
        [apiUrl, username]
        );

    useEffect(() => {
        fetchBlogPosts(1);
        }, [fetchBlogPosts]);

    return (
        <>
        {isLoading ? (
            <Spinner animation="border" role="status">
                <span className="visually-hidden">Loading...</span>
            </Spinner>
            ) : hasError ? (
                <div>
                    <h2 role="img" aria-label="Warning">
                        ⚠️
                    </h2>
                    <p>Error retrieving data</p>
                </div>
                ) : blogPosts.length === 0 ? (
                    <div>
                        <h3>Nothing to show</h3>
                        <p>There are no blog posts available at this time.</p>
                    </div>
                    ) : (
                        blogPosts.map((post, index) => (
                            <BlogPostCard
                                key={post.id || index}
                                post={post}
                            />
                            ))
                            )}
        </>
        );
};

export default BlogPostsTab;
