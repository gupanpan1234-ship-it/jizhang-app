import React from 'react';
import { Page } from '../types';

interface Props {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

const TABS: { page: Page; label: string; icon: string }[] = [
  { page: 'home', label: '首页', icon: '🏠' },
  { page: 'history', label: '账单', icon: '📋' },
  { page: 'charts', label: '图表', icon: '📊' },
  { page: 'settings', label: '我的', icon: '⚙️' },
];

export const BottomNav: React.FC<Props> = ({ currentPage, onNavigate }) => (
  <nav className="bottom-nav">
    {TABS.map(t => (
      <button
        key={t.page}
        className={`nav-item${currentPage === t.page ? ' active' : ''}`}
        onClick={() => onNavigate(t.page)}
      >
        <span className="nav-icon">{t.icon}</span>
        <span>{t.label}</span>
      </button>
    ))}
  </nav>
);
