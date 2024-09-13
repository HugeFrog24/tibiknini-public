import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import { Helmet } from 'react-helmet-async';
import { 
  Typography, 
  Container, 
  Skeleton,
  useTheme,
  Box,
  Link
} from '@mui/material';
import LinkIcon from '@mui/icons-material/Link';

import config from "../config.json";
import api from "../utils/api";

function DocumentRenderer({endpoint}) {
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

    return (
        <Container maxWidth="md">
            <Helmet>
                <title>{loading ? 'Loading...' : `${title} - ${config.siteName}`}</title>
                <meta name="description" content={loading ? 'Loading...' : `Read ${title} at ${config.siteName}`}/>
            </Helmet>
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
                                h1: ({node, ...props}) => <Typography variant="h4" gutterBottom {...props} />,
                                h2: ({node, ...props}) => <Typography variant="h5" gutterBottom {...props} />,
                                h3: ({node, ...props}) => <Typography variant="h6" gutterBottom {...props} />,
                                p: ({node, ...props}) => <Typography variant="body1" component="p" sx={{marginBottom: theme.spacing(2)}} {...props} />,
                                a: ({node, ...props}) => (
                                    <Link 
                                        {...props} 
                                        color="textPrimary" 
                                        underline="none" 
                                        sx={{ 
                                            '&:hover': { 
                                                color: 'primary.main', 
                                                '& .MuiSvgIcon-root': { opacity: 1 } 
                                            },
                                            '& .MuiSvgIcon-root': { 
                                                marginLeft: 1, 
                                                opacity: 0, 
                                                transition: 'opacity 0.2s' 
                                            }
                                        }}
                                    >
                                        {props.children}
                                        <LinkIcon fontSize="small" />
                                    </Link>
                                )
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

export default DocumentRenderer;