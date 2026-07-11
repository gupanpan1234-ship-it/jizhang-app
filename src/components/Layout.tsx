import React from 'react';
import { BottomNav } from './BottomNav';
import { Page } from '../types';

interface Props {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  children: React.ReactNode;
}

export const Layout: React.FC<Props> = ({ currentPage, onNavigate, children }) => (
  <div className="app">
    <div className="page">{children}</div>
    <BottomNav currentPage={currentPage} onNavigate={onNavigate} />
  </div>
);
