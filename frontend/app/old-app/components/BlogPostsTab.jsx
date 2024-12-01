import React, {useCallback, useEffect, useState} from "react";
import BlogPostCard from "./BlogPostCard";
import api from '../utils/api';  // Adjust the path to point to your api file

const BlogPostsTab = ({username}) => {
    const [blogPosts, setBlogPosts] = useState([]);
    const [hasError, setHasError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const fetchBlogPosts = useCallback(
        async (retryAttempt) => {
            setIsLoading(true);
            setHasError(false);
            const url = `/blog/posts/author/${username}/`;
            try {
                const response = await api.get(url);
                setBlogPosts(response.data.results);
                setIsLoading(false);
            } catch (error) {
                console.error("Error fetching blog posts:", error);
                if (retryAttempt < 3) {
                    setTimeout(() => {
                        fetchBlogPosts(retryAttempt + 1);
                    }, 3000 * retryAttempt);
                } else {
                    setIsLoading(false);
                    setHasError(true);
                }
            }
        },
        [username]
    );

    useEffect(() => {
        fetchBlogPosts(1);
    }, [fetchBlogPosts]);

    return (
        <>
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
