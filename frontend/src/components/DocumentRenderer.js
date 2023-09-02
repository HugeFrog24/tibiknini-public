import React, {useContext, useEffect, useState} from 'react';
import ReactMarkdown from 'react-markdown';
import axios from 'axios';
import {Helmet} from 'react-helmet-async';

import config from "../config.json";
import ApiUrlContext from './contexts/ApiUrlContext';
import UseDarkMode from "../utils/UseDarkMode";

function DocumentRenderer({endpoint, defaultTextClass}) {
    const apiUrl = useContext(ApiUrlContext);
    const [type, setType] = useState('');
    const [lastUpdated, setLastUpdated] = useState('');
    const [content, setContent] = useState('');
    const {textClass} = defaultTextClass ? {textClass: defaultTextClass} : UseDarkMode();

    useEffect(() => {
        const fetchDocument = async () => {
            try {
                const response = await axios.get(`${apiUrl}${endpoint}`);
                setContent(response.data.content);
                setType(response.data.type);
                setLastUpdated(new Date(response.data.last_updated).toLocaleDateString());
            } catch (error) {
                console.error(`Error fetching document from ${endpoint}:`, error);
            }
        };

        fetchDocument();
    }, [apiUrl, endpoint]);

    return (
        <>
            <Helmet>
                <title>{type} - {config.siteName}</title>
                <meta name="description" content={`Read ${type} at ${config.siteName}`}/>
            </Helmet>
            <h1>{type}</h1>
            <p>Last updated: {lastUpdated}</p>
            <ReactMarkdown className={`${textClass} text-start`}>{content}</ReactMarkdown>
        </>
    );
}

export default DocumentRenderer;
