import React, { useState, useCallback } from 'react';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { AddTransaction } from './pages/AddTransaction';
import { History } from './pages/History';
import { Charts } from './pages/Charts';
import { Settings } from './pages/Settings';
import { Page } from './types';

export const App: React.FC = () => {
  const [page, setPage] = useState<Page>('home');
  const [showAdd, setShowAdd] = useState(false);

  const navigate = useCallback((p: Page) => {
    setShowAdd(false);
    setPage(p);
  }, []);

  const handleAdd = useCallback(() => {
    setShowAdd(true);
  }, []);

  const handleAddDone = useCallback(() => {
    setShowAdd(false);
  }, []);

  if (showAdd) {
    return (
      <Layout currentPage="home" onNavigate={navigate}>
        <AddTransaction onDone={handleAddDone} />
      </Layout>
    );
  }

  return (
    <Layout currentPage={page} onNavigate={navigate}>
      {page === 'home' && <Home onAdd={handleAdd} />}
      {page === 'history' && <History />}
      {page === 'charts' && <Charts />}
      {page === 'settings' && <Settings />}
    </Layout>
  );
};
