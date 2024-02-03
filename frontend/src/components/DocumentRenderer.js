import React, {useEffect, useState} from 'react';
import ReactMarkdown from 'react-markdown';
import {Helmet} from 'react-helmet-async';
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

import config from "../config.json";
import api from "../utils/api";
import { useDarkMode } from './contexts/DarkModeContext';

function DocumentRenderer({endpoint, defaultTextClass}) {
    const [type, setType] = useState('');
    const [lastUpdated, setLastUpdated] = useState('');
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(true);
    const { modeClasses } = useDarkMode();

    useEffect(() => {
        const fetchDocument = async () => {
            try {
                const response = await api.get(endpoint);
                setContent(response.data.content);
                setType(response.data.type);
                setLastUpdated(new Date(response.data.last_updated).toLocaleDateString());
            } catch (error) {
                console.error(`Error fetching document from ${endpoint}:`, error);
            } finally {
                setLoading(false); // Set loading to false after data is fetched or if there's an error
            }
        };


        fetchDocument();
    }, [endpoint]);

    return (
        <>
            <Helmet>
                <title>{loading ? 'Loading...' : `${type} - ${config.siteName}`}</title>
                <meta name="description" content={loading ? 'Loading...' : `Read ${type} at ${config.siteName}`}/>
            </Helmet>
            <h1 className={modeClasses.textClass}>{loading ? <Skeleton width={200}/> : type}</h1>
            <p className={modeClasses.textClass}>{loading ? <Skeleton width={150}/> : `Last updated: ${lastUpdated}`}</p>
            {loading ? (
                <div className="text-start">
                    <Skeleton width="90%" height={30} /> {/* Headline */}
                    <Skeleton width="95%" height={15} count={3} /> {/* Paragraph */}
                    <Skeleton width="60%" height={30} /> {/* Headline */}
                    <Skeleton width="85%" height={15} count={3} /> {/* Paragraph */}
                    <Skeleton width="80%" height={30} /> {/* Headline */}
                    <Skeleton width="90%" height={15} count={3} /> {/* Paragraph */}
                </div>
            ) : (
                <ReactMarkdown className={`${modeClasses.textClass} text-start`}>{content}</ReactMarkdown>
            )}
        </>
    );
}

export default DocumentRenderer;
