import React from 'react';
import { Transaction } from '../types';
import { getCategoryByIdStored, formatMoney } from '../lib/storage';

interface Props {
  tx: Transaction;
  onDelete?: (id: string) => void;
  showDate?: boolean;
}

export const TransactionItem: React.FC<Props> = ({ tx, onDelete, showDate }) => {
  const cat = getCategoryByIdStored(tx.categoryId);
  const icon = cat?.icon || '📦';

  return (
    <div className="tx-item">
      <div className="tx-icon">{icon}</div>
      <div className="tx-info">
        <div className="tx-category">{cat?.name || '未知'}</div>
        {tx.note ? <div className="tx-note">{tx.note}</div> : null}
        {showDate ? <div className="tx-date">{tx.date}</div> : null}
      </div>
      <div className={`tx-amount ${tx.type}`}>
        {tx.type === 'income' ? '+' : '-'}{formatMoney(tx.amount)}
      </div>
      {onDelete ? (
        <button
          className="btn-ghost"
          style={{ padding: '4px 8px', fontSize: 18 }}
          onClick={() => onDelete(tx.id)}
        >
          🗑
        </button>
      ) : null}
    </div>
  );
};
