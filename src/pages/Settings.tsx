import React, { useState, useRef } from 'react';
import { exportData, importData } from '../lib/storage';
import { Budget } from './Budget';

export const Settings: React.FC = () => {
  const [tab, setTab] = useState<'settings' | 'budget'>('settings');
  const [msg, setMsg] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const json = exportData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `记账备份_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMsg('数据已导出');
    setTimeout(() => setMsg(''), 2000);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const ok = importData(reader.result as string);
      setMsg(ok ? '数据已导入！请刷新页面' : '导入失败，请检查文件格式');
      setTimeout(() => setMsg(''), 3000);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleClear = () => {
    if (window.confirm('确定要清除所有数据吗？此操作不可恢复！')) {
      localStorage.clear();
      setMsg('数据已清除，请刷新页面');
      setTimeout(() => setMsg(''), 3000);
    }
  };

  if (tab === 'budget') {
    return (
      <div className="fade-in">
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
          <button className="btn btn-ghost" onClick={() => setTab('settings')} style={{ padding: '8px 12px', fontSize: 16 }}>
            ← 返回
          </button>
          <span style={{ fontSize: 16, fontWeight: 600 }}>预算管理</span>
        </div>
        <Budget />
      </div>
    );
  }

  return (
    <div className="fade-in">
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>设置</h2>

      {/* Message */}
      {msg ? (
        <div style={{
          padding: '10px 14px', borderRadius: 8, background: 'var(--c-primary-light)',
          color: 'var(--c-primary-dark)', fontSize: 14, marginBottom: 16, textAlign: 'center',
        }}>
          {msg}
        </div>
      ) : null}

      <div className="settings-group">
        <div className="settings-group-title">功能</div>
        <div className="settings-item" onClick={() => setTab('budget')}>
          <div className="si-left">
            <span className="si-icon">🎯</span>
            <span>预算管理</span>
          </div>
          <span className="si-arrow">›</span>
        </div>
      </div>

      <div className="settings-group">
        <div className="settings-group-title">数据</div>
        <div className="settings-item" onClick={handleExport}>
          <div className="si-left">
            <span className="si-icon">📤</span>
            <span>导出数据</span>
          </div>
          <span className="si-arrow">›</span>
        </div>
        <div className="settings-item" onClick={() => fileRef.current?.click()}>
          <div className="si-left">
            <span className="si-icon">📥</span>
            <span>导入数据</span>
          </div>
          <span className="si-arrow">›</span>
        </div>
        <input type="file" ref={fileRef} accept=".json" style={{ display: 'none' }} onChange={handleImport} />
        <div className="settings-item" onClick={handleClear} style={{ color: 'var(--c-danger)' }}>
          <div className="si-left">
            <span className="si-icon">🗑️</span>
            <span>清除所有数据</span>
          </div>
          <span className="si-arrow" style={{ color: 'var(--c-danger)' }}>›</span>
        </div>
      </div>

      <div className="settings-group">
        <div className="settings-group-title">关于</div>
        <div className="settings-item">
          <div className="si-left">
            <span className="si-icon">📱</span>
            <span>版本</span>
          </div>
          <span className="text-muted">1.0.0</span>
        </div>
      </div>

      <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--c-text-muted)', marginTop: 32 }}>
        家庭记账 · 数据仅存储在本地
      </p>
    </div>
  );
};
