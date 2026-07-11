import React, { useState } from 'react';
import { Category } from '../types';
import { getCategories } from '../lib/storage';

interface Props {
  type: 'income' | 'expense';
  selectedId: string | null;
  onSelect: (category: Category) => void;
  onClose: () => void;
}

export const CategoryPicker: React.FC<Props> = ({ type, selectedId, onSelect, onClose }) => {
  const allCats = getCategories().filter(c => c.type === type);
  const tree = allCats.filter(c => c.parentId === null);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(() => {
    const sel = allCats.find(c => c.id === selectedId);
    return sel?.parentId || null;
  });

  const handleSelect = (cat: Category) => {
    if (cat.parentId === null) {
      const subs = allCats.filter(c => c.parentId === cat.id);
      if (subs.length > 0) {
        setExpandedGroup(expandedGroup === cat.id ? null : cat.id);
        return;
      }
    }
    onSelect(cat);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()}>
        <div className="modal-handle" />
        <h3 style={{ fontSize: 17, fontWeight: 600, marginBottom: 16 }}>
          {type === 'income' ? '选择收入类别' : '选择支出类别'}
        </h3>

        <div className="sub-cat-list">
          {tree.map(cat => {
            const subs = allCats.filter(c => c.parentId === cat.id);
            const isGroup = subs.length > 0;
            const isExpanded = expandedGroup === cat.id;
            const isSelected = cat.id === selectedId;

            return (
              <React.Fragment key={cat.id}>
                <div
                  className={`sub-cat-item${isSelected ? ' selected' : ''}`}
                  style={isSelected ? { background: 'var(--c-primary-light)', color: 'var(--c-primary-dark)' } : {}}
                  onClick={() => handleSelect(cat)}
                >
                  <span style={{ fontSize: 20 }}>{cat.icon}</span>
                  <span style={{ fontSize: 15 }}>{cat.name}</span>
                  {isGroup ? (
                    <span style={{ marginLeft: 'auto', color: 'var(--c-text-muted)' }}>
                      {isExpanded ? '▾' : '▸'}
                    </span>
                  ) : isSelected ? (
                    <span className="check">✓</span>
                  ) : null}
                </div>
                {isGroup && isExpanded && subs.map(sub => (
                  <div
                    key={sub.id}
                    className={`sub-cat-item${sub.id === selectedId ? ' selected' : ''}`}
                    style={{
                      paddingLeft: 40,
                      ...(sub.id === selectedId ? { background: 'var(--c-primary-light)', color: 'var(--c-primary-dark)' } : {}),
                    }}
                    onClick={() => onSelect(sub)}
                  >
                    <span style={{ fontSize: 18 }}>{sub.icon}</span>
                    <span style={{ fontSize: 14 }}>{sub.name}</span>
                    {sub.id === selectedId ? <span className="check">✓</span> : null}
                  </div>
                ))}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};
