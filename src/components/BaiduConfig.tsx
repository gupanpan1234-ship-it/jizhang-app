import React, { useState } from 'react';
import { saveBaiduConfig } from '../lib/baiduAsr';

interface Props {
  onClose: () => void;
}

export const BaiduConfig: React.FC<Props> = ({ onClose }) => {
  const [apiKey, setApiKey] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [msg, setMsg] = useState('');

  const handleSave = () => {
    if (!apiKey.trim() || !secretKey.trim()) {
      setMsg('请填写 API Key 和 Secret Key');
      return;
    }
    saveBaiduConfig(apiKey.trim(), secretKey.trim());
    setMsg('配置成功！现在可以使用语音功能了');
    setTimeout(() => onClose(), 1000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()}>
        <div className="modal-handle" />
        <h3 style={{ fontSize: 17, fontWeight: 600, marginBottom: 16 }}>配置语音识别</h3>

        <div style={{ fontSize: 13, color: 'var(--c-text-secondary)', marginBottom: 16, lineHeight: 1.6 }}>
          <p>使用百度语音识别，需注册免费账号获取密钥：</p>
          <ol style={{ paddingLeft: 18, marginTop: 8 }}>
            <li>打开 <strong>console.bce.baidu.com</strong></li>
            <li>注册/登录百度账号</li>
            <li>左侧菜单 → <strong>语音技术</strong> → 创建应用</li>
            <li>获取 <strong>API Key</strong> 和 <strong>Secret Key</strong></li>
            <li>选择"语音识别"接口并领取免费额度</li>
          </ol>
        </div>

        <div className="form-group">
          <label className="form-label">API Key</label>
          <input
            className="input"
            placeholder="粘贴 API Key"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Secret Key</label>
          <input
            className="input"
            type="password"
            placeholder="粘贴 Secret Key"
            value={secretKey}
            onChange={e => setSecretKey(e.target.value)}
          />
        </div>

        {msg ? (
          <div style={{
            padding: '8px 12px',
            borderRadius: 6,
            background: msg.includes('成功') ? 'var(--c-primary-light)' : 'var(--c-warning-light)',
            color: msg.includes('成功') ? 'var(--c-primary-dark)' : 'var(--c-text)',
            fontSize: 13,
            marginBottom: 12,
            textAlign: 'center',
          }}>
            {msg}
          </div>
        ) : null}

        <button className="btn btn-primary btn-block btn-lg" onClick={handleSave}>
          保存配置
        </button>

        <button className="btn btn-ghost btn-block mt-8" onClick={onClose}>
          取消
        </button>
      </div>
    </div>
  );
};
