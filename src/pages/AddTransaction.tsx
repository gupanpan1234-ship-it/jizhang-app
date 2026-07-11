import React, { useState, useCallback } from 'react';
import { CategoryPicker } from '../components/CategoryPicker';
import { VoiceInput } from '../components/VoiceInput';
import { BaiduConfig } from '../components/BaiduConfig';
import { addTransaction, toDateStr, getCategoryByIdStored, getCategories } from '../lib/storage';
import { parseVoiceInput } from '../lib/voiceParser';
import { Category } from '../types';

interface Props {
  onDone: () => void;
}

export const AddTransaction: React.FC<Props> = ({ onDone }) => {
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [category, setCategory] = useState<Category | null>(null);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(toDateStr(new Date()));
  const [showPicker, setShowPicker] = useState(false);
  const [saved, setSaved] = useState(false);
  const [voiceText, setVoiceText] = useState('');
  const [voiceFill, setVoiceFill] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const handleVoiceResult = useCallback((text: string) => {
    setVoiceText(text);
    const result = parseVoiceInput(text);
    if (!result) return;

    setVoiceFill(true);

    // Determine type from category
    const cats = getCategories();
    const matchedCat = cats.find(c => c.id === result.categoryId);
    if (matchedCat) {
      setType(matchedCat.type);
      setCategory(matchedCat);
    }
    setAmount(String(result.amount));
    setDate(result.date);
    if (result.note) setNote(result.note);
  }, []);

  const handleSave = () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0 || !category) return;

    addTransaction({
      categoryId: category.id,
      amount: amt,
      type,
      note: note.trim(),
      date,
    });

    setSaved(true);
    setTimeout(() => onDone(), 400);
  };

  const canSave = amount && parseFloat(amount) > 0 && category;

  if (saved) {
    return (
      <div className="fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 56 }}>✅</div>
          <div style={{ fontSize: 18, fontWeight: 600, marginTop: 12 }}>已记录</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      {/* Voice Input */}
      <div style={{ marginBottom: 16 }}>
        <VoiceInput onResult={handleVoiceResult} onNeedConfig={() => setShowSettings(true)} />
        {voiceFill ? (
          <div style={{
            marginTop: 10,
            padding: '10px 14px',
            borderRadius: 8,
            background: 'var(--c-primary-light)',
            fontSize: 13,
            color: 'var(--c-primary-dark)',
            textAlign: 'center',
          }}>
            🎙️ 识别结果：{voiceText}
            <br />
            <span style={{ fontSize: 12, color: 'var(--c-text-secondary)' }}>
              {category?.icon} {category?.name} · {amount}元 · {date}
            </span>
          </div>
        ) : null}
      </div>

      {/* Type toggle */}
      <div className="type-toggle mb-16">
        <button className={type === 'expense' ? 'active' : ''} onClick={() => { setType('expense'); setCategory(null); }}>
          支出
        </button>
        <button className={type === 'income' ? 'active' : ''} onClick={() => { setType('income'); setCategory(null); }}>
          收入
        </button>
      </div>

      {/* Category */}
      <div className="form-group">
        <label className="form-label">类别</label>
        <div
          className="input"
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
          onClick={() => setShowPicker(true)}
        >
          {category ? (
            <>
              <span style={{ fontSize: 20 }}>{category.icon}</span>
              <span>{category.parentId && getCategoryByIdStored(category.parentId)?.name ? (
                <>{getCategoryByIdStored(category.parentId)!.name} &gt; {category.name}</>
              ) : category.name}</span>
            </>
          ) : (
            <span className="text-muted">请选择{type === 'expense' ? '支出' : '收入'}类别</span>
          )}
        </div>
      </div>

      {/* Amount */}
      <div className="form-group">
        <input
          className="amount-input"
          type="number"
          inputMode="decimal"
          placeholder="0.00"
          value={amount}
          onChange={e => setAmount(e.target.value)}
        />
      </div>

      {/* Note */}
      <div className="form-group">
        <input
          className="input"
          placeholder="备注（选填）"
          value={note}
          onChange={e => setNote(e.target.value)}
          maxLength={100}
        />
      </div>

      {/* Date */}
      <div className="form-group">
        <input
          className="input"
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
        />
      </div>

      {/* Save */}
      <button
        className={`btn btn-primary btn-block btn-lg mt-16${!canSave ? ' disabled' : ''}`}
        disabled={!canSave}
        onClick={handleSave}
        style={!canSave ? { opacity: .4 } : {}}
      >
        记录
      </button>

      <button className="btn btn-ghost btn-block mt-8" onClick={onDone}>
        取消
      </button>

      {showPicker && (
        <CategoryPicker
          type={type}
          selectedId={category?.id || null}
          onSelect={cat => { setCategory(cat); setShowPicker(false); }}
          onClose={() => setShowPicker(false)}
        />
      )}

      {showSettings && (
        <BaiduConfig onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
};
