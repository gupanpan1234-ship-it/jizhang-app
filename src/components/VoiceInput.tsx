import React, { useState, useCallback, useRef } from 'react';
import { startRecording, recognize, hasBaiduConfig } from '../lib/baiduAsr';

interface Props {
  onResult: (text: string) => void;
  onNeedConfig: () => void;
}

export const VoiceInput: React.FC<Props> = ({ onResult, onNeedConfig }) => {
  const [state, setState] = useState<'idle' | 'starting' | 'recording' | 'recognizing'>('idle');
  const [error, setError] = useState('');
  const [showText, setShowText] = useState(false);
  const [textInput, setTextInput] = useState('');
  const stopFnRef = useRef<(() => Promise<Blob>) | null>(null);
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  const isConfigured = hasBaiduConfig();

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    if (!isConfigured) { onNeedConfig(); return; }
    if (stopFnRef.current) return;

    setError('');
    setState('starting');

    const stop = startRecording(() => setState('recording'), 6);
    stopFnRef.current = stop;
  }, [isConfigured, onNeedConfig]);

  const handlePointerUp = useCallback(async (e: React.PointerEvent) => {
    e.preventDefault();
    const stop = stopFnRef.current;
    stopFnRef.current = null;
    if (!stop) return;

    setState('recognizing');
    try {
      const blob = await stop();
      if (blob.size < 500) { setState('idle'); setError('录音太短，请按住说话说完再松手'); return; }
      const text = await recognize(blob);
      if (text) { onResultRef.current(text); setState('idle'); }
      else { setState('idle'); setError('未识别到内容，请再说一次'); }
    } catch (e: any) {
      setState('idle');
      setError(e.message || '语音识别失败');
    }
  }, []);

  const handleTextSubmit = () => {
    const val = textInput.trim();
    if (!val) return;
    onResult(val);
    setTextInput('');
    setShowText(false);
  };

  const active = state === 'recording' || state === 'recognizing';

  return (
    <div style={{ textAlign: 'center' }}>
      <button
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onContextMenu={(e) => e.preventDefault()}
        style={{
          width: 80, height: 80, borderRadius: '50%',
          border: active ? '3px solid var(--c-primary)' : '3px solid var(--c-border)',
          background: state === 'recording' ? 'var(--c-danger-light)'
            : state === 'recognizing' ? 'var(--c-primary-light)' : 'var(--c-surface)',
          fontSize: 36, cursor: 'pointer', display: 'flex',
          alignItems: 'center', justifyContent: 'center', margin: '0 auto',
          transition: 'all .15s',
          animation: state === 'recognizing' ? 'spin 1.2s linear infinite'
            : state === 'recording' ? 'pulse 1.2s ease-in-out infinite' : 'none',
          boxShadow: active ? '0 0 0 12px rgba(16,185,129,.2)' : 'var(--shadow)',
          touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none',
        }}
      >
        {state === 'recognizing' ? '⏳' : state === 'recording' ? '🔴' : '🎤'}
      </button>

      <div style={{ marginTop: 10, fontSize: 13, color: 'var(--c-text-secondary)' }}>
        {state === 'recognizing'
          ? <span style={{ color: 'var(--c-primary)', fontWeight: 500 }}>识别中...</span>
          : state === 'recording'
          ? <span style={{ color: 'var(--c-danger)', fontWeight: 500 }}>正在录音，松手结束</span>
          : isConfigured
          ? <span>按住说话，松手识别</span>
          : <span style={{ color: 'var(--c-text-muted)' }}>语音未配置</span>}
      </div>

      {error
        ? <div style={{ marginTop: 6, fontSize: 12, color: 'var(--c-danger)' }} onClick={() => setError('')}>{error}</div>
        : null}

      {!isConfigured
        ? <button onClick={onNeedConfig} style={{ marginTop: 8, background: 'none', border: 'none', color: 'var(--c-primary)', fontSize: 13, cursor: 'pointer', textDecoration: 'underline' }}>
            配置语音服务
          </button>
        : <button onClick={() => setShowText(!showText)} style={{ marginTop: 8, background: 'none', border: 'none', color: 'var(--c-text-muted)', fontSize: 12, cursor: 'pointer' }}>
            {showText ? '收起' : '文字快速输入'}
          </button>}

      {showText && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
          <input className="input" placeholder='例如：7月10号买菜花了50块，备注蔬菜'
            value={textInput} onChange={e => setTextInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleTextSubmit(); }}
            autoFocus style={{ flex: 1, fontSize: 14, padding: '10px 12px' }} />
          <button className="btn btn-primary" onClick={handleTextSubmit}
            style={{ padding: '10px 16px', fontSize: 14, whiteSpace: 'nowrap' }}
            disabled={!textInput.trim()}>确定</button>
        </div>
      )}

      <style>{`
        @keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.06)} }
        @keyframes spin { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
      `}</style>
    </div>
  );
};
