import React from 'react';
import { useNavigate, Link } from 'react-router';
import { Card, CardContent, CardMedia, Typography, Button, Skeleton } from '@mui/material';
import Grid from '@mui/material/Grid';
import Avatar from '@mui/material/Avatar';
import ImageIcon from '@mui/icons-material/Image';
import slugify from 'slugify';
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

// Helper function to generate post URL with slug
const getPostUrl = (post: BlogPost) => {
    const slug = slugify(post.title, {
        lower: true,
        strict: true,
        locale: 'vi',
        trim: true
    });
    return `/blog/posts/${post.id}/${slug}`;
};

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

    const renderMedia = () => {
        if (!post) {
            return <Skeleton variant="rectangular" height={200} />;
        }

        if (post.image) {
            return (
                <CardMedia
                    component="img"
                    height="200"
                    image={post.image}
                    alt={post.title}
                    onClick={() => navigate(getPostUrl(post))}
                    style={{ cursor: 'pointer' }}
                />
            );
        }

        return (
            <Grid container justifyContent="center" alignItems="center"
                  onClick={() => navigate(getPostUrl(post))}
                  style={{ cursor: 'pointer', height: 200, backgroundColor: getBackgroundColor() }}>
                <ImageIcon fontSize="large" />
            </Grid>
        );
    };

    const renderAvatar = () => {
        if (!post) {
            return <Skeleton variant="circular" width={40} height={40} />;
        }
        return (
            <Link to={`/users/${post.author.username}`} style={{ textDecoration: 'none' }}>
                <Avatar src={post.author.image} alt={post.author.username} sx={{ cursor: 'pointer' }} />
            </Link>
        );
    };

    const renderContent = () => {
        if (!post) {
            return (
                <>
                    <Skeleton variant="text" width="80%" height={32} />
                    <Skeleton variant="text" width="40%" height={24} />
                </>
            );
        }

        return (
            <>
                <Link 
                    to={getPostUrl(post)}
                    style={{ 
                        textDecoration: 'none',
                        color: 'inherit',
                        display: 'block'
                    }}
                >
                    <Typography variant="h5" component="div">
                        {post.title}
                    </Typography>
                </Link>
                <Link 
                    to={`/users/${post.author.username}`}
                    style={{ 
                        textDecoration: 'none',
                        color: 'inherit',
                        display: 'block'
                    }}
                >
                    <Typography variant="subtitle1" sx={{ lineHeight: 1 }}>
                        {post.author.username}
                    </Typography>
                </Link>
            </>
        );
    };

    const renderAction = () => {
        if (!post) {
            return <Skeleton variant="rectangular" width={80} height={36} />;
        }

        return (
            <Button 
                variant="contained" 
                onClick={() => navigate(getPostUrl(post))}
                sx={{ minWidth: '80px' }}
            >
                Go!
            </Button>
        );
    };

    return (
        <Card 
            className={"my-4"} 
            id={post ? `post-${post.id}` : undefined}
            sx={{ '& .MuiButton-root': { textTransform: 'none' } }}
        >
            {renderMedia()}
            <CardContent sx={{ py: 2 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid>
                        {renderAvatar()}
                    </Grid>
                    <Grid flex={1} sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                        {renderContent()}
                    </Grid>
                    <Grid sx={{ display: 'flex', alignItems: 'center' }}>
                        {renderAction()}
                    </Grid>
                </Grid>
            </CardContent>
        </Card>
    );
};

export default BlogPostCard;
