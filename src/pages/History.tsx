import React, { useState, useEffect, useMemo } from 'react';
import { getTransactions, deleteTransaction, getCategories, formatMoney } from '../lib/storage';
import { TransactionItem } from '../components/TransactionItem';
import { MonthPicker } from '../components/MonthPicker';
import { Transaction } from '../types';

export const History: React.FC = () => {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [filter, setFilter] = useState<'all' | 'expense' | 'income'>('all');
  const [txs, setTxs] = useState<Transaction[]>([]);

  const refresh = () => {
    setTxs(getTransactions());
  };

  useEffect(() => { refresh(); }, []);
  useEffect(() => {
    const onFocus = () => refresh();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  const filtered = useMemo(() => {
    const prefix = `${year}-${String(month).padStart(2, '0')}`;
    return txs.filter(t => {
      if (!t.date.startsWith(prefix)) return false;
      if (filter !== 'all' && t.type !== filter) return false;
      return true;
    });
  }, [txs, year, month, filter]);

  const handleDelete = (id: string) => {
    if (window.confirm('确定删除这条记录吗？')) {
      deleteTransaction(id);
      refresh();
    }
  };

  // Group by date
  const grouped = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    for (const tx of filtered) {
      const list = map.get(tx.date) || [];
      list.push(tx);
      map.set(tx.date, list);
    }
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filtered]);

  const totalExpense = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const totalIncome = filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);

  return (
    <div className="fade-in">
      <MonthPicker year={year} month={month} onChange={(y, m) => { setYear(y); setMonth(m); }} />

      {/* Summary */}
      <div className="stats-row mb-16">
        <div className="stat-card">
          <div className="stat-label">支出</div>
          <div className="stat-value red">{formatMoney(totalExpense)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">收入</div>
          <div className="stat-value green">{formatMoney(totalIncome)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">结余</div>
          <div className="stat-value" style={{ color: 'var(--c-text)' }}>{formatMoney(totalIncome - totalExpense)}</div>
        </div>
      </div>

      {/* Filter */}
      <div className="filter-row">
        {(['all', 'expense', 'income'] as const).map(f => (
          <button
            key={f}
            className={`filter-chip${filter === f ? ' active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? '全部' : f === 'expense' ? '支出' : '收入'}
          </button>
        ))}
      </div>

      {/* List */}
      {grouped.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <div className="empty-text">本月暂无记录</div>
        </div>
      ) : (
        grouped.map(([date, items]) => (
          <div key={date} className="card" style={{ marginBottom: 12 }}>
            <div className="date-sep">{date} {formatDayOfWeek(date)}</div>
            {items.map(tx => (
              <TransactionItem key={tx.id} tx={tx} onDelete={handleDelete} />
            ))}
          </div>
        ))
      )}
    </div>
  );
};

function formatDayOfWeek(dateStr: string): string {
  const d = new Date(dateStr);
  const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return days[d.getDay()];
}
