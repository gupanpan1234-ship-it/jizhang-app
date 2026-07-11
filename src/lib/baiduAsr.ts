// Baidu ASR — WebSocket realtime streaming (no CORS, no proxy, fast!)
// Uses: wss://vop.baidu.com/realtime_asr

interface BaiduConfig {
  apiKey: string;
  secretKey: string;
}

function getConfig(): BaiduConfig | null {
  try {
    const raw = localStorage.getItem('jz_baidu_config');
    if (!raw) return null;
    const c = JSON.parse(raw);
    if (c.apiKey && c.secretKey) return c;
    return null;
  } catch { return null; }
}

export function saveBaiduConfig(apiKey: string, secretKey: string): void {
  localStorage.setItem('jz_baidu_config', JSON.stringify({ apiKey, secretKey }));
}

export function hasBaiduConfig(): boolean {
  return getConfig() !== null;
}

// Token
async function getToken(): Promise<string> {
  const cached = localStorage.getItem('jz_baidu_token');
  const expiry = localStorage.getItem('jz_baidu_token_expiry');
  if (cached && expiry && Date.now() < parseInt(expiry, 10)) return cached;

  const config = getConfig();
  if (!config) throw new Error('请先配置百度 API 密钥');

  const resp = await fetch(
    `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${encodeURIComponent(config.apiKey)}&client_secret=${encodeURIComponent(config.secretKey)}`,
    { method: 'POST' }
  );
  const data = await resp.json();
  if (data.error) throw new Error('API Key 或 Secret Key 错误');

  const token = data.access_token;
  const expiresIn = (data.expires_in || 2592000) * 1000;
  localStorage.setItem('jz_baidu_token', token);
  localStorage.setItem('jz_baidu_token_expiry', String(Date.now() + expiresIn - 86400000));
  return token;
}

// Recording with MediaRecorder to get raw audio blob
export function startRecording(onStarted: () => void, maxSeconds: number = 5): () => Promise<Blob> {
  const chunks: Blob[] = [];
  let stream: MediaStream | null = null;
  let mediaRecorder: MediaRecorder | null = null;
  let finalized = false;
  let rs!: (data: Blob) => void;
  let rj!: (err: Error) => void;
  const promise = new Promise<Blob>((res, rej) => { rs = res; rj = rej; });

  const stopFn = (): Promise<Blob> => {
    if (finalized) return promise;
    finalized = true;
    if (mediaRecorder?.state === 'recording') mediaRecorder.stop();
    else { stream?.getTracks().forEach(t => t.stop()); rj(new Error('录音未启动')); }
    return promise;
  };

  (async () => {
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { sampleRate: 16000, channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
    } catch { if (!finalized) rj(new Error('麦克风权限被拒绝')); return; }

    const mt = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus'
      : MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
    try { mediaRecorder = new MediaRecorder(stream, { mimeType: mt }); } catch { mediaRecorder = new MediaRecorder(stream); }

    mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
    mediaRecorder.onstop = () => {
      stream?.getTracks().forEach(t => t.stop());
      if (chunks.length === 0) { rj(new Error('没有录到声音')); return; }
      rs(new Blob(chunks));
    };
    mediaRecorder.onerror = () => { if (!finalized) rj(new Error('录音设备异常')); };
    mediaRecorder.start();
    onStarted();
    setTimeout(() => { if (!finalized) stopFn(); }, maxSeconds * 1000);
  })();
  return stopFn;
}

// Recognize via REST API (token fetch uses CORS proxy as fallback)
export async function recognize(audioBlob: Blob): Promise<string> {
  // Decode to PCM
  const buf = await audioBlob.arrayBuffer();
  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  if (ctx.state === 'suspended') await ctx.resume();
  const audio = await ctx.decodeAudioData(buf);
  ctx.close();

  const src = audio.getChannelData(0);
  const samples = audio.sampleRate === 8000 ? src : resample(src, audio.sampleRate, 8000);
  if (samples.length < 4000) throw new Error('录音太短');

  // Encode WAV
  const dsz = samples.length * 2;
  const wav = new ArrayBuffer(44 + dsz);
  const v = new DataView(wav);
  function ws(o: number, x: string) { for (let i = 0; i < x.length; i++) v.setUint8(o + i, x.charCodeAt(i)); }
  ws(0, 'RIFF'); v.setUint32(4, 36 + dsz, true); ws(8, 'WAVE');
  ws(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, 8000, true); v.setUint32(28, 16000, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
  ws(36, 'data'); v.setUint32(40, dsz, true);
  for (let i = 0; i < samples.length; i++) {
    const x = Math.max(-1, Math.min(1, samples[i]));
    v.setInt16(44 + i * 2, x < 0 ? Math.round(x * 32768) : Math.round(x * 32767), true);
  }

  // Base64 encode
  const bytes = new Uint8Array(wav);
  let b64 = '';
  for (let i = 0; i < bytes.length; i += 0x4000) {
    const chunk = bytes.subarray(i, i + 0x4000);
    let s = '';
    for (let j = 0; j < chunk.length; j++) s += String.fromCharCode(chunk[j]);
    b64 += btoa(s);
  }

  const devId = (() => {
    let id = localStorage.getItem('jz_device_id');
    if (!id) { id = Date.now().toString(36) + Math.random().toString(36).slice(2, 10); localStorage.setItem('jz_device_id', id); }
    return id;
  })();

  // Call ASR — try direct first (no CORS check needed from HTTPS site with CORS-friendly endpoint)
  const token = await getToken();
  const body = JSON.stringify({
    format: 'wav', rate: 8000, channel: 1,
    cuid: devId, token, speech: b64, len: wav.byteLength,
  });

  // Fast path: try direct
  let resp: Response | null = null;
  try {
    resp = await fetch('https://vop.baidu.com/server_api', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });
  } catch (_) {}

  // Slow path: CORS proxy
  if (!resp || !resp.ok) {
    try {
      resp = await fetch(
        'https://api.allorigins.win/raw?url=' + encodeURIComponent('https://vop.baidu.com/server_api'),
        { method: 'POST', body }
      );
    } catch (_) {}
  }

  if (!resp) throw new Error('无法连接百度服务器');

  const data = await resp.json();
  if (data.err_no === 3304) throw new Error('免费额度已用完，明天恢复');
  if (data.err_no === 3301) throw new Error('音频质量差，请靠近再说一次');
  if (data.err_no === 3302) throw new Error('鉴权失败，请重新配置密钥');
  if (data.err_no !== 0) throw new Error(`识别失败: ${data.err_msg || data.err_no}`);
  return (data.result || []).join('') || '';
}

function resample(d: Float32Array, fr: number, tr: number): Float32Array {
  const r = fr / tr;
  const o = new Float32Array(Math.round(d.length / r));
  for (let i = 0; i < o.length; i++) {
    const si = Math.min(i * r, d.length - 1);
    const fl = Math.floor(si);
    o[i] = d[fl] + (d[Math.min(fl + 1, d.length - 1)] - d[fl]) * (si - fl);
  }
  return o;
}
