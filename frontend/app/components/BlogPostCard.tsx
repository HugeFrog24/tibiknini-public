import React from 'react';
import { useNavigate } from '@remix-run/react';
import { Card, CardContent, CardMedia, Typography, Button, Skeleton } from '@mui/material';
import Grid2 from '@mui/material/Grid2';
import Avatar from '@mui/material/Avatar';
import ImageIcon from '@mui/icons-material/Image';
import { User } from '../types/user';

export interface Author {
    username: string;
    image: string;
}

export interface BlogPost {
    id: string | number;
    title: string;
    image?: string;
    accent_color?: string;
    author: Author;
}

interface BlogPostCardProps {
    post?: BlogPost;
    isDetailView?: boolean;
    user?: User | null;
    postId?: string | number;
    textClass?: string;
    onPostUpdated?: (post: BlogPost) => void;
}

const BlogPostCard: React.FC<BlogPostCardProps> = ({ post }) => {
    const navigate = useNavigate();

    // Determine the background color based on the post's accent_color
    const getBackgroundColor = () => {
        // Check if accent_color is provided and is a valid hex color
        if (post?.accent_color && /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(post.accent_color)) {
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
                        <Grid2 flex={1}>
                            <Skeleton width="200px" height="32px" />
                            <Grid2 container spacing={2} alignItems="center" className="mt-3">
                                <Grid2 flex={0}>
                                    <Skeleton variant="circular" width={32} height={32} />
                                </Grid2>
                                <Grid2 flex={0}>
                                    <Skeleton width="100px" />
                                </Grid2>
                            </Grid2>
                        </Grid2>
                        <Grid2 flex={0}>
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
            <CardContent sx={{ py: 2 }}>
                <Grid2 container spacing={2} alignItems="center">
                    <Grid2>
                        <Avatar src={post.author.image} alt={post.author.username} />
                    </Grid2>
                    <Grid2 flex={1} sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                        <Button 
                            onClick={() => navigate(`/blog/posts/${post.id}`)} 
                            className="text-decoration-none"
                            sx={{ 
                                textAlign: 'left', 
                                display: 'block',
                                p: 0,
                                '&:hover': { backgroundColor: 'transparent' }
                            }}
                        >
                            <Typography variant="h5" component="div">
                                {post.title}
                            </Typography>
                        </Button>
                        <Button 
                            onClick={() => navigate(`/users/${post.author.username}`)}
                            className="text-decoration-none"
                            sx={{ 
                                justifyContent: 'flex-start', 
                                p: 0,
                                minHeight: 0,
                                '&:hover': { backgroundColor: 'transparent' }
                            }}
                        >
                            <Typography variant="subtitle1" sx={{ lineHeight: 1 }}>
                                {post.author.username}
                            </Typography>
                        </Button>
                    </Grid2>
                    <Grid2 sx={{ display: 'flex', alignItems: 'center' }}>
                        <Button 
                            variant="contained" 
                            onClick={() => navigate(`/blog/posts/${post.id}`)}
                            sx={{ minWidth: '80px' }}
                        >
                            Go!
                        </Button>
                    </Grid2>
                </Grid2>
            </CardContent>
        </Card>
    );
};

export default BlogPostCard;
