import React from 'react';
import { useLoaderData } from 'react-router';
import type { LoaderFunctionArgs } from 'react-router';
import { fetchReports } from '../utils/server-fetch';
import ReportsList from '../components/ReportsList';
import { ReportsResponse } from '../types/report';
import UserContext from '../contexts/UserContext';

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
  const { reports } = useLoaderData<LoaderData>();
  const { user } = React.useContext(UserContext);

  const handleReportReviewed = () => {
    // Refresh the page to get updated data
    window.location.reload();
  };

  return (
    <ReportsList
      initialData={reports}
      user={user}
      onReportReviewed={handleReportReviewed}
    />
  );
}