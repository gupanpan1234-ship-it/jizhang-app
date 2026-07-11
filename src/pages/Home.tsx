import React, { useEffect, useState } from 'react';
import { getMonthStats, getTodayTransactions, formatMoney, toDateStr } from '../lib/storage';
import { TransactionItem } from '../components/TransactionItem';
import { MonthStats } from '../types';

interface Props {
  onAdd: () => void;
}

export const Home: React.FC<Props> = ({ onAdd }) => {
  const now = new Date();
  const [stats, setStats] = useState<MonthStats>({
    totalIncome: 0, totalExpense: 0, todayExpense: 0, todayIncome: 0, budgetAlerts: [],
  });
  const [recent, setRecent] = useState<any[]>([]);

  const refresh = () => {
    setStats(getMonthStats(now.getFullYear(), now.getMonth() + 1));
    setRecent(getTodayTransactions().slice(0, 5));
  };

  useEffect(() => { refresh(); }, []);

  // Listen for focus to refresh when returning from add page
  useEffect(() => {
    const onFocus = () => refresh();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  return (
    <div className="fade-in">
      {/* Hero - Today */}
      <div className="stats-hero">
        <div className="stats-label">今日支出</div>
        <div className="stats-amount expense">{formatMoney(stats.todayExpense)}</div>
      </div>

      {/* Month overview */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-label">本月支出</div>
          <div className="stat-value red">{formatMoney(stats.totalExpense)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">本月收入</div>
          <div className="stat-value green">{formatMoney(stats.totalIncome)}</div>
        </div>
      </div>

      {/* Budget Alerts */}
      {stats.budgetAlerts.filter(a => a.percentage >= 80).length > 0 && (
        <div className="card mt-16">
          <div className="section-title">预算提醒</div>
          <div className="alert-list">
            {stats.budgetAlerts
              .filter(a => a.percentage >= 80)
              .map(a => (
                <div key={a.categoryId} className={`alert-item${a.percentage >= 100 ? ' over' : ''}`}>
                  <span>{a.categoryIcon}</span>
                  <span style={{ minWidth: 70, fontSize: 13 }}>{a.categoryName}</span>
                  <div className="alert-bar-wrap">
                    <div className={`alert-bar${a.percentage >= 100 ? ' over' : ''}`} style={{ width: `${Math.min(a.percentage, 100)}%` }} />
                  </div>
                  <span className="text-sm" style={{ minWidth: 50, textAlign: 'right' }}>
                    {a.percentage >= 100 ? (
                      <span className="text-danger">超支!</span>
                    ) : (
                      <span className="text-muted">{a.percentage}%</span>
                    )}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Recent transactions */}
      <div className="mt-16">
        <div className="section-title">今日记录</div>
        {recent.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <div className="empty-text">今天还没有记录</div>
          </div>
        ) : (
          <div className="card">
            {recent.map((tx: any) => (
              <TransactionItem key={tx.id} tx={tx} />
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <button className="fab" onClick={onAdd}>+</button>
    </div>
  );
};
