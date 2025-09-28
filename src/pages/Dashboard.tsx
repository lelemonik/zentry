import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Index from './Index';

const Dashboard = () => {
  const { currentUser } = useAuth();

  // You can add any dashboard-specific logic here
  // For now, we'll just render the existing Index component
  return <Index />;
};

export default Dashboard;