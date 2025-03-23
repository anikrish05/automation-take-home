
import React from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import Header from '@/components/Header';
import ValidationResults from '@/components/ValidationResults';

interface LocationState {
  url: string;
}

const Results: React.FC = () => {
  const location = useLocation();
  const state = location.state as LocationState;

  // If no URL was provided, redirect back to the home page
  if (!state?.url) {
    return <Navigate to="/" replace />;
  }

  return (
    <Layout>
      <Header />
      <ValidationResults url={state.url} />
    </Layout>
  );
};

export default Results;
