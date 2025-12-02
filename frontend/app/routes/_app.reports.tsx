import React, { useState, useCallback } from 'react';
import { useLoaderData } from 'react-router';
import type { LoaderFunctionArgs } from 'react-router';
import { fetchReports } from '../utils/server-fetch';
import ReportsList from '../components/ReportsList';
import { ReportsResponse } from '../types/report';
import UserContext from '../contexts/UserContext';
import api from '../utils/api';

interface LoaderData {
  reports: ReportsResponse;
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const url = new URL(request.url);
    const page = url.searchParams.get('page');
    const pageNumber = page ? parseInt(page) : undefined;
    
    const reports = await fetchReports(request, pageNumber);
    return { reports };
  } catch {
    // If there's an error (like 401/403), return empty data
    // The component will handle showing appropriate messages
    return {
      reports: {
        results: [],
        count: 0,
        next: null,
        previous: null
      }
    };
  }
};

export default function ReportsPage() {
  const { reports: initialReports } = useLoaderData<LoaderData>();
  const { user } = React.useContext(UserContext);
  const [reports, setReports] = useState<ReportsResponse>(initialReports);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshReports = useCallback(async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      // Get current page from URL
      const url = new URL(window.location.href);
      const page = url.searchParams.get('page');
      const pageNumber = page ? parseInt(page) : 1;
      
      // Fetch updated reports
      const response = await api.get(`/moderation/reports/${pageNumber > 1 ? `?page=${pageNumber}` : ''}`);
      setReports(response.data);
    } catch (error) {
      console.error('Failed to refresh reports:', error);
      // Optionally show a toast notification here
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing]);

  const handleReportReviewed = useCallback(() => {
    // Perform in-place update instead of hard refresh
    refreshReports();
  }, [refreshReports]);

  return (
    <ReportsList
      initialData={reports}
      user={user}
      onReportReviewed={handleReportReviewed}
      isRefreshing={isRefreshing}
    />
  );
}