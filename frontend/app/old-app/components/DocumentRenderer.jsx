import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import { 
  Typography, 
  Container, 
  Skeleton,
  useTheme,
  Box,
} from '@mui/material';
import { Link } from '@remix-run/react';
import LinkIcon from '@mui/icons-material/Link';
import PropTypes from 'prop-types';

import api from "../utils/api";

function DocumentRenderer({ endpoint }) {
    const [title, setTitle] = useState('');
    const [lastUpdated, setLastUpdated] = useState('');
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(true);
    const theme = useTheme();

    useEffect(() => {
        const fetchDocument = async () => {
            try {
                const response = await api.get(endpoint);
                setContent(response.data.content);
                setTitle(response.data.title);
                setLastUpdated(new Date(response.data.last_updated).toLocaleDateString());
            } catch (error) {
                console.error(`Error fetching document from ${endpoint}:`, error);
            } finally {
                setLoading(false);
            }
        };

        fetchDocument();
    }, [endpoint]);

    const CustomLink = ({ href, children }) => {
        const isInternal = href.startsWith('/');
        
        if (isInternal) {
            return (
                <Link
                    to={href}
                    style={{
                        color: 'inherit',
                        textDecoration: 'none',
                        '&:hover': { 
                            color: theme.palette.primary.main,
                            '& .MuiSvgIcon-root': { opacity: 1 } 
                        },
                    }}
                >
                    {children}
                    <LinkIcon 
                        fontSize="small" 
                        sx={{ 
                            marginLeft: 1, 
                            opacity: 0, 
                            transition: 'opacity 0.2s'
                        }} 
                    />
                </Link>
            );
        }

        return (
            <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                    color: 'inherit',
                    textDecoration: 'none',
                }}
            >
                {children}
                <LinkIcon 
                    fontSize="small" 
                    sx={{ 
                        marginLeft: 1, 
                        opacity: 0, 
                        transition: 'opacity 0.2s'
                    }} 
                />
            </a>
        );
    };

    return (
        <Container maxWidth="md">
            <Box sx={{ 
                textAlign: 'left', 
                marginTop: theme.spacing(3),
                marginBottom: theme.spacing(3)
            }}>
                {loading ? (
                    <>
                        <Skeleton variant="text" width="60%" height={60} />
                        <Skeleton variant="text" width="40%" height={30} />
                        <Skeleton variant="rectangular" height={400} />
                    </>
                ) : (
                    <>
                        <Typography variant="h3" gutterBottom>{title}</Typography>
                        <Typography variant="subtitle1" gutterBottom>Last updated: {lastUpdated}</Typography>
                        <ReactMarkdown 
                            components={{
                                h1: ({...props}) => <Typography variant="h4" gutterBottom {...props} />,
                                h2: ({...props}) => <Typography variant="h5" gutterBottom {...props} />,
                                h3: ({...props}) => <Typography variant="h6" gutterBottom {...props} />,
                                p: ({...props}) => <Typography variant="body1" component="p" sx={{marginBottom: theme.spacing(2)}} {...props} />,
                                a: ({href, ...props}) => <CustomLink href={href} {...props} />
                            }}
                            rehypePlugins={[
                                rehypeSlug,
                                [rehypeAutolinkHeadings, { behavior: 'wrap' }]
                            ]}
                        >
                            {content}
                        </ReactMarkdown>
                    </>
                )}
            </Box>
        </Container>
    );
}

DocumentRenderer.propTypes = {
    endpoint: PropTypes.string.isRequired,
};

export default DocumentRenderer;