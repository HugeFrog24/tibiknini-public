import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardMedia, Typography, Button, Grid2, Skeleton } from '@mui/material';
import Avatar from '@mui/material/Avatar';
import ImageIcon from '@mui/icons-material/Image';

const BlogPostCard = ({ post }) => {
    const navigate = useNavigate();

    // Determine the background color based on the post's accent_color
    const getBackgroundColor = () => {
        // Check if accent_color is provided and is a valid hex color
        if (post.accent_color && /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(post.accent_color)) {
            return post.accent_color;
        }
        return "#e0e0e0";
    };

    if (!post) {
        return (
            <Card className={"my-4"}>
                <Skeleton variant="rectangular" height={200} />
                <CardContent>
                    <Grid2 container spacing={2} alignItems="center" justifyContent="space-between">
                        <Grid2 item>
                            <Skeleton width="200px" height="32px" />
                            <Grid2 container spacing={2} alignItems="center" className="mt-3">
                                <Grid2 item>
                                    <Skeleton variant="circular" width={32} height={32} />
                                </Grid2>
                                <Grid2 item>
                                    <Skeleton width="100px" />
                                </Grid2>
                            </Grid2>
                        </Grid2>
                        <Grid2 item>
                            <Skeleton variant="rectangular" width={50} height={40} />
                        </Grid2>
                    </Grid2>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card 
            className={"my-4"} 
            id={`post-${post.id}`}
            sx={{ '& .MuiButton-root': { textTransform: 'none' } }}
        >
            {post.image ? (
                <CardMedia
                    component="img"
                    height="200"
                    image={post.image}
                    alt={post.title}
                    onClick={() => navigate(`/blog/posts/${post.id}`)}
                    style={{ cursor: 'pointer' }}
                />
            ) : (
                <Grid2 container justifyContent="center" alignItems="center" 
                      onClick={() => navigate(`/blog/posts/${post.id}`)}
                      style={{ cursor: 'pointer', height: 200, backgroundColor: getBackgroundColor() }}>
                    <ImageIcon fontSize="large" />
                </Grid2>
            )}
            <CardContent>
                <Grid2 container spacing={2} alignItems="center" justifyContent="space-between">
                    <Grid2 item xs>
                        <Typography variant="h5" component="div" className="mb-1">
                            <Button onClick={() => navigate(`/blog/posts/${post.id}`)} 
                                    className={`text-decoration-none`}>
                                {post.title}
                            </Button>
                        </Typography>
                        <Grid2 container spacing={2} alignItems="center">
                            <Grid2 item>
                                <Avatar src={post.author.image} alt={post.author.username} />
                            </Grid2>
                            <Grid2 item>
                                <Button onClick={() => navigate(`/users/${post.author.username}`)}
                                        className={`text-decoration-none`}>
                                    <Typography variant="subtitle1">{post.author.username}</Typography>
                                </Button>
                            </Grid2>
                        </Grid2>
                    </Grid2>
                    <Grid2 item>
                        <Button variant="contained" onClick={() => navigate(`/blog/posts/${post.id}`)}>
                            Go!
                        </Button>
                    </Grid2>
                </Grid2>
            </CardContent>
        </Card>
    );
};

export default BlogPostCard;
