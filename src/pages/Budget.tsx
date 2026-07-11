import React, { useState, useMemo } from 'react';
import { getBudgets, setBudget, getCategories, getMonthStats, formatMoney } from '../lib/storage';
import { MonthPicker } from '../components/MonthPicker';
import { Category } from '../types';

export const Budget: React.FC = () => {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const budgets = useMemo(() => getBudgets(), []);
  const allCats = useMemo(() => getCategories().filter(c => c.type === 'expense' && !c.parentId), []);
  const stats = useMemo(() => getMonthStats(year, month), [year, month]);

  const budgetMap = new Map(budgets.map(b => [b.categoryId, b.amount]));
  const alertMap = new Map(stats.budgetAlerts.map(a => [a.categoryId, a]));

  // Only show leaf categories and group categories in budget list
  const budgetableCats = useMemo(() => {
    const cats = getCategories().filter(c => c.type === 'expense');
    const result: Category[] = [];
    for (const cat of cats) {
      const children = cats.filter(c => c.parentId === cat.id);
      if (children.length === 0) {
        result.push(cat);
      } else {
        // Also include the parent (group) for budget setting at group level
        result.push(cat);
      }
    }
    return result;
  }, []);

  const handleSave = (categoryId: string) => {
    const val = parseFloat(editValue);
    if (val >= 0) {
      setBudget(categoryId, val);
    }
    setEditingId(null);
    setEditValue('');
  };

  const startEdit = (categoryId: string, currentAmount: number) => {
    setEditingId(categoryId);
    setEditValue(currentAmount > 0 ? String(currentAmount) : '');
  };

  return (
    <div className="fade-in">
      <MonthPicker year={year} month={month} onChange={(y, m) => { setYear(y); setMonth(m); }} />

      <div className="mt-12">
        <div className="section-title">设置月度预算</div>
        <p className="text-sm text-muted mb-16">为分类设置预算，超支时会收到提醒</p>

        {/* Show only categories that have subcategories or are leaf */}
        {getCategories()
          .filter(c => c.type === 'expense' && c.parentId === null)
          .map(group => {
            const subs = getCategories().filter(c => c.parentId === group.id);
            const isGroup = subs.length > 0;

            return (
              <React.Fragment key={group.id}>
                {/* Group header */}
                <div
                  className="budget-item"
                  style={{ background: 'var(--c-bg)', marginBottom: 2 }}
                >
                  <span style={{ fontSize: 20 }}>{group.icon}</span>
                  <div className="budget-info">
                    <div className="budget-name" style={{ fontWeight: 600 }}>{group.name}</div>
                  </div>
                </div>

                {/* Sub categories */}
                {(isGroup ? subs : [group]).map(cat => {
                  const budget = budgetMap.get(cat.id) || 0;
                  const alert = alertMap.get(cat.id);
                  const isEditing = editingId === cat.id;

                  return (
                    <div key={cat.id} className="budget-item" style={{ paddingLeft: isGroup ? 44 : 14 }}>
                      <span style={{ fontSize: 18 }}>{cat.icon}</span>
                      <div className="budget-info">
                        <div className="budget-name">{cat.name}</div>
                        {alert && (
                          <div className="budget-meta">
                            已花 {formatMoney(alert.spent)} / {formatMoney(alert.budget)}
                            {' '}
                            <span className={alert.percentage >= 100 ? 'text-danger' : alert.percentage >= 80 ? 'text-warning' : ''}>
                              ({alert.percentage}%)
                            </span>
                          </div>
                        )}
                      </div>
                      {isEditing ? (
                        <>
                          <input
                            className="budget-input"
                            type="number"
                            inputMode="decimal"
                            placeholder="0"
                            value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            onBlur={() => handleSave(cat.id)}
                            onKeyDown={e => { if (e.key === 'Enter') handleSave(cat.id); }}
                            autoFocus
                          />
                          <span className="text-xs text-muted">/月</span>
                        </>
                      ) : (
                        <div
                          style={{ cursor: 'pointer', textAlign: 'right', minWidth: 70 }}
                          onClick={() => startEdit(cat.id, budget)}
                        >
                          <div style={{ fontSize: 15, fontWeight: 600, color: budget > 0 ? 'var(--c-text)' : 'var(--c-text-muted)' }}>
                            {budget > 0 ? formatMoney(budget) : '设置'}
                          </div>
                          <div className="text-xs text-muted">/月</div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </React.Fragment>
            );
          })}
      </div>
    </div>
  );
};
