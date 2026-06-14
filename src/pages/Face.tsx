// Face.tsx — MediaPipe Pose версия (надёжное определение плеч)
import React, { useRef, useState, useEffect, useCallback } from 'react';
import Webcam from 'react-webcam';

// ─── Типы MediaPipe (CDN загружается динамически) ─────────────────────────────
interface NormalizedLandmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

interface PoseResults {
  poseLandmarks?: NormalizedLandmark[];
}

interface PoseInstance {
  setOptions(options: Record<string, unknown>): Promise<void>;
  onResults(callback: (results: PoseResults) => void): void;
  send(inputs: { image: HTMLVideoElement }): Promise<void>;
  close(): void;
}

// MediaPipe Pose landmark indices
const NOSE        = 0;
const LEFT_SHOULDER  = 11;
const RIGHT_SHOULDER = 12;

// ─── Типы статусов ────────────────────────────────────────────────────────────
type DetectionStatus =
  | 'loading'
  | 'no_face'
  | 'face_only'
  | 'face_and_one_shoulder'
  | 'ready'
  | 'error';

interface FaceProps {
  onSuccess?: (file: File) => void | Promise<void>;
  onBack?: () => void;
  busy?: boolean;
}

// ─── Загрузка MediaPipe через CDN ─────────────────────────────────────────────
function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement('script');
    s.src = src;
    s.crossOrigin = 'anonymous';
    s.onload = () => resolve();
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

async function createPose(): Promise<PoseInstance> {
  await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js');
  await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  const pose: PoseInstance = new w.Pose({
    locateFile: (file: string) =>
      `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
  });

  await pose.setOptions({
    modelComplexity: 1,          // 0=lite, 1=full, 2=heavy — 1 оптимален
    smoothLandmarks: true,       // сглаживание встроено
    enableSegmentation: false,
    smoothSegmentation: false,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5,
  });

  return pose;
}

// ─── Вспомогательные функции ──────────────────────────────────────────────────
function isVisible(lm: NormalizedLandmark | undefined, threshold = 0.65): boolean {
  if (!lm) return false;
  const v = lm.visibility ?? 0;
  return v >= threshold && lm.x >= 0 && lm.x <= 1 && lm.y >= 0 && lm.y <= 1;
}

function shoulderDistanceOk(
  left: NormalizedLandmark,
  right: NormalizedLandmark,
): boolean {
  const dx = left.x - right.x;
  const dy = left.y - right.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  // Нормализованные координаты 0-1: плечи должны быть на расстоянии 0.10–0.50
  return dist >= 0.10 && dist <= 0.50;
}

function shouldersBelowNose(
  nose: NormalizedLandmark,
  left: NormalizedLandmark,
  right: NormalizedLandmark,
): boolean {
  // В MediaPipe y растёт вниз, поэтому "ниже" = больше y
  return left.y > nose.y && right.y > nose.y;
}

// ─── Основной компонент ───────────────────────────────────────────────────────
export default function Face({ onSuccess, onBack, busy = false }: FaceProps) {
  const webcamRef     = useRef<Webcam>(null);
  const poseRef       = useRef<PoseInstance | null>(null);
  const canvasRef     = useRef<HTMLCanvasElement>(null);
  const rafRef        = useRef<number>(0);
  const capturedRef   = useRef(false);

  const [status, setStatus]       = useState<DetectionStatus>('loading');
  const [errorMsg, setErrorMsg]   = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Буфер сглаживания (последние 7 кадров)
  const historyRef = useRef<DetectionStatus[]>([]);
  const smoothStatus = (s: DetectionStatus): DetectionStatus => {
    const h = historyRef.current;
    h.push(s);
    if (h.length > 7) h.shift();
    const counts: Partial<Record<DetectionStatus, number>> = {};
    for (const v of h) counts[v] = (counts[v] ?? 0) + 1;
    let best = s, bestCount = 0;
    for (const [k, c] of Object.entries(counts)) {
      if ((c ?? 0) > bestCount) { bestCount = c!; best = k as DetectionStatus; }
    }
    return best;
  };

  // ─── Обработчик результатов MediaPipe ──────────────────────────────────────
  const onResults = useCallback((results: PoseResults) => {
    const lm = results.poseLandmarks;

    // Отрисовка на canvas (визуальная обратная связь)
    const canvas = canvasRef.current;
    const video  = webcamRef.current?.video;
    if (canvas && video) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.width  = video.videoWidth  || 640;
        canvas.height = video.videoHeight || 480;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (lm) {
          const pts = [NOSE, LEFT_SHOULDER, RIGHT_SHOULDER];
          const colors: Record<number, string> = {
            [NOSE]: '#60a5fa',
            [LEFT_SHOULDER]: '#34d399',
            [RIGHT_SHOULDER]: '#34d399',
          };
          // Линия между плечами
          const ls = lm[LEFT_SHOULDER];
          const rs = lm[RIGHT_SHOULDER];
          if (isVisible(ls, 0.5) && isVisible(rs, 0.5)) {
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(52,211,153,0.7)';
            ctx.lineWidth = 2;
            ctx.moveTo(ls.x * canvas.width, ls.y * canvas.height);
            ctx.lineTo(rs.x * canvas.width, rs.y * canvas.height);
            ctx.stroke();
          }
          // Точки
          for (const idx of pts) {
            const pt = lm[idx];
            if (!pt || (pt.visibility ?? 0) < 0.4) continue;
            ctx.beginPath();
            ctx.arc(pt.x * canvas.width, pt.y * canvas.height, 6, 0, 2 * Math.PI);
            ctx.fillStyle = colors[idx] ?? '#ffffff';
            ctx.fill();
          }
        }
      }
    }

    // Логика определения статуса
    if (!lm) { setStatus(prev => smoothStatus('no_face') !== prev ? smoothStatus('no_face') : prev); return; }

    const nose   = lm[NOSE];
    const lSh    = lm[LEFT_SHOULDER];
    const rSh    = lm[RIGHT_SHOULDER];

    const noseOk = isVisible(nose, 0.5);
    const lOk    = isVisible(lSh, 0.65);
    const rOk    = isVisible(rSh, 0.65);

    let raw: DetectionStatus;

    if (!noseOk) {
      raw = 'no_face';
    } else if (!lOk && !rOk) {
      raw = 'face_only';
    } else if (lOk !== rOk) {
      raw = 'face_and_one_shoulder';
    } else {
      // Оба плеча видны
      const distOk     = shoulderDistanceOk(lSh, rSh);
      const belowNose  = shouldersBelowNose(nose, lSh, rSh);
      raw = distOk && belowNose ? 'ready' : 'face_and_one_shoulder';
    }

    const smoothed = smoothStatus(raw);
    setStatus(prev => {
      if (prev === smoothed) return prev;
      return smoothed;
    });
  }, []);

  // ─── Инициализация MediaPipe ────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const pose = await createPose();
        pose.onResults(onResults);
        if (!cancelled) {
          poseRef.current = pose;
          setStatus('no_face');
        }
      } catch (err) {
        console.error('MediaPipe load error:', err);
        if (!cancelled) {
          setErrorMsg('Не удалось загрузить детектор поз');
          setStatus('error');
        }
      }
    })();
    return () => { cancelled = true; };
  }, [onResults]);

  // ─── Цикл детекции (requestAnimationFrame) ──────────────────────────────────
  useEffect(() => {
    if (status === 'error' || status === 'loading') return;

    let stopped = false;
    let lastSend = 0;
    const INTERVAL_MS = 150; // ~6–7 FPS детекции — баланс скорость/нагрузка

    const loop = async (ts: number) => {
      if (stopped) return;
      rafRef.current = requestAnimationFrame(loop);

      if (ts - lastSend < INTERVAL_MS) return;
      lastSend = ts;

      const video = webcamRef.current?.video;
      const pose  = poseRef.current;
      if (!pose || !video || video.readyState < 4) return;

      try {
        await pose.send({ image: video });
      } catch (err) {
        // Не прерываем цикл при одиночной ошибке
        console.warn('Pose send error:', err);
      }
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      stopped = true;
      cancelAnimationFrame(rafRef.current);
    };
  }, [status]);

  // ─── Автосъёмка при статусе ready ──────────────────────────────────────────
  const capturePhoto = useCallback(async () => {
    if (uploading || busy || capturedRef.current) return;
    capturedRef.current = true;

    setUploading(true);
    try {
      const imageSrc = webcamRef.current?.getScreenshot();
      if (!imageSrc) throw new Error('Screenshot failed');
      const blob = await (await fetch(imageSrc)).blob();
      const file = new File([blob], 'face_shoulders.jpg', { type: 'image/jpeg' });
      await onSuccess?.(file);
    } catch (err) {
      console.error(err);
      setErrorMsg('Ошибка при обработке фото');
      capturedRef.current = false;
      setStatus('no_face');
    } finally {
      setUploading(false);
    }
  }, [onSuccess, uploading, busy]);

  useEffect(() => {
    if (status === 'ready' && !uploading && !busy) {
      capturePhoto();
    } else if (status !== 'ready') {
      capturedRef.current = false; // сбрасываем при потере позиции
    }
  }, [status, capturePhoto, uploading, busy]);

  // ─── UI helpers ─────────────────────────────────────────────────────────────
  const messages: Record<DetectionStatus, string> = {
    loading:               'Загрузка детектора поз...',
    no_face:               '❌ Лицо не обнаружено. Повернитесь лицом к камере',
    face_only:             '⚠️ Голова видна, но плечи не видны. Отойдите назад',
    face_and_one_shoulder: '⚠️ Видно только одно плечо. Повернитесь прямо',
    ready:                 '✅ Лицо и оба плеча видны! Делаем снимок...',
    error:                 '❌ Ошибка детектора',
  };

  const hints: Partial<Record<DetectionStatus, string>> = {
    face_only:             '→ Отступите на 1–2 шага назад',
    face_and_one_shoulder: '→ Встаньте строго лицом к камере, не наклоняйтесь',
    no_face:               '→ Убедитесь, что лицо хорошо освещено',
  };

  const showOverlay = status !== 'ready' && status !== 'loading' && status !== 'error';

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      {onBack && (
        <div className="flex items-center px-4 py-3 border-b" style={{ borderColor: '#e2e8f0' }}>
          <button onClick={onBack} className="text-blue-500 font-medium">← Назад</button>
        </div>
      )}

      <div className="flex-1 p-5 flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold mb-2">Сканер лица и плеч</h2>
        <p className="text-center text-gray-500 mb-6">
          Встаньте прямо лицом к камере, чтобы были видны оба плеча
        </p>

        {/* Видео + canvas overlay */}
        <div className="relative w-full max-w-md aspect-video bg-black rounded-xl overflow-hidden mb-4">
          <Webcam
            ref={webcamRef}
            audio={false}
            mirrored
            screenshotFormat="image/jpeg"
            videoConstraints={{ width: 640, height: 480, facingMode: 'user' }}
            className="w-full h-full object-cover"
          />

          {/* Canvas с keypoints (поверх видео) */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            style={{ transform: 'scaleX(-1)' }} /* mirror совпадает с webcam */
          />

          {/* Статусный оверлей */}
          {showOverlay && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
              <div className="bg-black/70 text-white p-4 rounded-xl text-center max-w-[80%]">
                <p className="text-sm font-medium">{messages[status]}</p>
              </div>
            </div>
          )}

          {status === 'ready' && (
            <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
              Сканирование...
            </div>
          )}

          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <div className="text-white text-lg">Отправка фото...</div>
            </div>
          )}
        </div>

        {/* Статусная плашка */}
        <div className="w-full max-w-md mt-2 p-3 bg-gray-100 rounded-xl text-sm">
          <p className="font-semibold mb-1">Статус:</p>
          <p className={status === 'ready' ? 'text-green-600 font-medium' : 'text-gray-700'}>
            {messages[status]}
          </p>
          {hints[status] && (
            <p className="text-amber-600 text-xs mt-1">{hints[status]}</p>
          )}
        </div>

        {errorMsg && (
          <p className="mt-4 text-red-500 text-sm bg-red-50 px-3 py-2 rounded-xl">
            {errorMsg}
          </p>
        )}
      </div>
    </div>
  );
}