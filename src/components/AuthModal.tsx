import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  AlertCircle, 
  Loader2, 
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  ClipboardPaste,
  HelpCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { 
  isInIframe,
  buildGoogleOAuthUrl,
  getSupabaseClient 
} from '../lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: any) => void;
}

// Helper to decode JWT payload safely
function decodeJwtPayload(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [inIframe, setInIframe] = useState(false);
  const [isWaitingForGoogle, setIsWaitingForGoogle] = useState(false);
  const [popupBlocked, setPopupBlocked] = useState(false);
  const [currentAuthUrl, setCurrentAuthUrl] = useState('');
  const [manualTokenInput, setManualTokenInput] = useState('');
  const [showTroubleshoot, setShowTroubleshoot] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      setSuccessMessage(null);
      setIsLoading(false);
      setIsWaitingForGoogle(false);
      setPopupBlocked(false);
      setManualTokenInput('');
      const frameCheck = isInIframe();
      setInIframe(frameCheck);
      const url = buildGoogleOAuthUrl();
      setCurrentAuthUrl(url);
    }
  }, [isOpen]);

  // Complete user login in Supabase and sync with local backend database
  const completeLoginWithSession = async (userEmail: string, userName?: string, userAvatar?: string, userId?: string) => {
    const email = userEmail.toLowerCase().trim();
    const name = userName || email.split('@')[0] || 'ลูกค้า AngusShopX';
    const avatar = userAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(email)}`;
    const id = userId || `usr-${email.replace(/[^a-zA-Z0-9]/g, '_')}`;

    const res = await fetch('/api/user/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, email, name, avatar }),
    });

    const data = await res.json();
    if (data.success && data.user) {
      if (email === 'jtinx97@gmail.com' || data.user.role === 'admin') {
        sessionStorage.setItem('angus_admin_pin', '190850');
      }
      localStorage.setItem('angus_active_user', JSON.stringify(data.user));
      setSuccessMessage(`เข้าสู่ระบบสำเร็จ: ${data.user.email}`);
      setTimeout(() => {
        onLoginSuccess(data.user);
        onClose();
      }, 700);
      return true;
    } else {
      throw new Error(data.message || 'ไม่สามารถบันทึกข้อมูลผู้ใช้ลงฐานข้อมูลได้');
    }
  };

  // Process raw URL or token from localhost:3000 screen
  const processTokenOrUrl = async (rawText: string) => {
    const text = rawText.trim();
    if (!text) return;

    setIsLoading(true);
    setErrorMessage(null);
    const supabaseClient = getSupabaseClient();

    try {
      let accessToken = '';
      let refreshToken = '';

      if (text.includes('access_token=')) {
        // Parse from URL hash or query string
        const hashPart = text.includes('#') ? text.split('#')[1] : text;
        const params = new URLSearchParams(hashPart);
        accessToken = params.get('access_token') || '';
        refreshToken = params.get('refresh_token') || '';
      } else if (text.includes('.')) {
        // Direct JWT string
        accessToken = text;
      }

      if (!accessToken) {
        throw new Error('ไม่พบ access_token ในข้อความที่วาง กรุณาคัดลอกทั้ง URL เช่น http://localhost:3000/#access_token=...');
      }

      // 1. Try decoding directly from JWT
      const jwtPayload = decodeJwtPayload(accessToken);
      const userEmail = jwtPayload?.email || jwtPayload?.user_metadata?.email;
      const userName = jwtPayload?.user_metadata?.full_name || jwtPayload?.user_metadata?.name;
      const userAvatar = jwtPayload?.user_metadata?.avatar_url || jwtPayload?.user_metadata?.picture;
      const userId = jwtPayload?.sub;

      // 2. Set session in Supabase client if possible
      try {
        if (refreshToken) {
          await supabaseClient.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
        }
      } catch (err) {
        console.warn('Supabase setSession non-fatal warning:', err);
      }

      // 3. Fallback to Supabase getSession / getUser
      let finalEmail = userEmail;
      let finalName = userName;
      let finalAvatar = userAvatar;
      let finalId = userId;

      try {
        const { data: { user } } = await supabaseClient.auth.getUser(accessToken);
        if (user) {
          finalEmail = user.email || finalEmail;
          finalName = user.user_metadata?.full_name || user.user_metadata?.name || finalName;
          finalAvatar = user.user_metadata?.avatar_url || user.user_metadata?.picture || finalAvatar;
          finalId = user.id || finalId;
        }
      } catch (e) {
        console.warn('Supabase getUser warning:', e);
      }

      if (!finalEmail) {
        throw new Error('ไม่สามารถดึงอีเมลจาก Token ได้ กรุณาลองใหม่อีกครั้ง');
      }

      await completeLoginWithSession(finalEmail, finalName, finalAvatar, finalId);
    } catch (err: any) {
      setErrorMessage(err.message || 'เกิดข้อผิดพลาดในการตรวจสอบ Token');
    } finally {
      setIsLoading(false);
    }
  };

  // Clipboard paste handler
  const handlePasteFromClipboard = async () => {
    try {
      if (!navigator.clipboard?.readText) {
        setErrorMessage('เบราว์เซอร์ไม่อนุญาตให้อ่านคลิปบอร์ดอัตโนมัติ กรุณากด Ctrl+V หรือคลิกขวาแล้ววางในช่องด้านล่าง');
        return;
      }
      const clipText = await navigator.clipboard.readText();
      if (!clipText) {
        setErrorMessage('ไม่พบข้อความในคลิปบอร์ด กรุณาคัดลอก URL จากหน้า Google ก่อน');
        return;
      }
      setManualTokenInput(clipText);
      await processTokenOrUrl(clipText);
    } catch (err: any) {
      setErrorMessage('กรุณาวาง URL หรือ Token ลงในช่องด้านล่างด้วยตนเอง');
    }
  };

  // Listen for callback postMessage from popup window
  useEffect(() => {
    if (!isOpen) return;

    const handleAuthMessage = async (e: MessageEvent) => {
      if (e.data?.type === 'SUPABASE_GOOGLE_AUTH_SUCCESS') {
        setIsLoading(true);
        const { hash, search } = e.data;
        const supabaseClient = getSupabaseClient();
        try {
          if (hash) {
            await processTokenOrUrl(hash);
            return;
          } else if (search) {
            const params = new URLSearchParams(search.replace(/^\?/, ''));
            const code = params.get('code');
            if (code) {
              await supabaseClient.auth.exchangeCodeForSession(code);
              const { data: { session } } = await supabaseClient.auth.getSession();
              if (session?.user?.email) {
                await completeLoginWithSession(
                  session.user.email,
                  session.user.user_metadata?.full_name || session.user.user_metadata?.name,
                  session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture,
                  session.user.id
                );
                return;
              }
            }
          }
        } catch (err: any) {
          setErrorMessage('ยืนยันตัวตน Google ไม่สำเร็จ: ' + (err.message || ''));
        } finally {
          setIsLoading(false);
          setIsWaitingForGoogle(false);
        }
      }
    };

    window.addEventListener('message', handleAuthMessage);
    return () => window.removeEventListener('message', handleAuthMessage);
  }, [isOpen]);

  if (!isOpen) return null;

  const authUrl = currentAuthUrl || buildGoogleOAuthUrl();

  // Primary Google Login Action (ALWAYS in a popup so the current website is NEVER replaced by a localhost redirect)
  const handleGoogleSignInClick = () => {
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setPopupBlocked(false);

    try {
      const popup = window.open(authUrl, 'google_oauth_login', 'width=520,height=650,menubar=no,toolbar=no,location=no');
      if (!popup || popup.closed || typeof popup.closed === 'undefined') {
        setPopupBlocked(true);
      } else {
        setIsWaitingForGoogle(true);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'ไม่สามารถเปิดหน้าต่าง Google ได้');
      setPopupBlocked(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-lg rounded-3xl bg-gradient-to-b from-[#160c2d] via-[#0e071c] to-[#07030e] border border-purple-500/30 shadow-[0_0_60px_rgba(147,51,234,0.35)] p-6 sm:p-8 text-center text-white max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-purple-950/60 border border-purple-500/30 text-purple-300 hover:text-white transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Icon */}
        <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center shadow-lg mb-4 bg-gradient-to-tr from-purple-600 via-violet-600 to-indigo-600 shadow-[0_0_25px_rgba(168,85,247,0.4)]">
          <Sparkles className="w-8 h-8 text-white" />
        </div>

        <h2 className="text-xl sm:text-2xl font-black text-white">
          เข้าสู่ระบบด้วย Google
        </h2>
        <p className="text-xs text-purple-300/80 mt-1.5 mb-6 leading-relaxed">
          เข้าสู่ระบบปลอดภัยด้วยบัญชี Google อย่างเป็นทางการ บันทึกข้อมูลและซิงค์ฐานข้อมูลอัตโนมัติ
        </p>

        {/* Error notification */}
        {errorMessage && (
          <div className="mb-5 p-3 rounded-xl bg-rose-950/60 border border-rose-500 text-rose-200 text-xs flex items-center gap-2 text-left">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <div className="flex-1">
              <span>{errorMessage}</span>
            </div>
          </div>
        )}

        {/* Success notification */}
        {successMessage && (
          <div className="mb-5 p-3 rounded-xl bg-emerald-950/60 border border-emerald-500 text-emerald-200 text-xs flex items-center gap-2 text-left animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <div className="flex-1">
              <span>{successMessage}</span>
            </div>
          </div>
        )}

        {/* Waiting / In Progress banner */}
        {isWaitingForGoogle && (
          <div className="mb-5 p-3.5 rounded-2xl bg-purple-950/70 border border-purple-500/50 text-purple-200 text-xs flex items-center gap-3 text-left animate-pulse">
            <Loader2 className="w-5 h-5 text-purple-400 animate-spin flex-shrink-0" />
            <div className="flex-1">
              <p className="font-bold text-white">กำลังรอการยืนยันตัวตน Google...</p>
              <p className="text-[11px] text-purple-300/80 mt-0.5">กรุณาเลือกบัญชี Google ในหน้าต่างที่เปิดขึ้นมา</p>
            </div>
          </div>
        )}

        {/* Primary Official Google Login Button */}
        <div className="space-y-4">
          <button
            type="button"
            disabled={isLoading}
            onClick={handleGoogleSignInClick}
            className="w-full py-3.5 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-sm sm:text-base shadow-[0_0_25px_rgba(255,255,255,0.25)] flex items-center justify-center gap-3 transition transform active:scale-95 cursor-pointer disabled:opacity-50 border border-slate-200"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-slate-700" />
            ) : (
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>{isLoading ? 'กำลังประมวลผล...' : 'เข้าสู่ระบบด้วย Google'}</span>
          </button>

          {/* Popup blocked fallback link */}
          {popupBlocked && (
            <div className="pt-1 text-center">
              <a
                href={authUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsWaitingForGoogle(true)}
                className="w-full py-2.5 px-3 rounded-xl bg-purple-950/80 border border-purple-500/40 text-purple-200 hover:text-white hover:bg-purple-900/60 inline-flex items-center justify-center gap-2 text-xs font-semibold transition no-underline cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5 text-purple-400" />
                <span>คลิกที่นี่เพื่อเปิดหน้าต่าง Google (แท็บใหม่)</span>
              </a>
            </div>
          )}

          {/* Solution for localhost:3000 Redirect (Instant One-Click resolver) */}
          <div className="mt-5 p-4 rounded-2xl bg-purple-950/40 border border-purple-500/30 text-left">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>หากเบราว์เซอร์ขึ้น &quot;localhost ปฏิเสธการเชื่อมต่อ&quot;:</span>
              </div>
            </div>
            <p className="text-[11px] text-purple-200/80 mb-3 leading-relaxed">
              เพียงคัดลอก URL จากแถบที่อยู่ด้านบนของหน้านั้น (<code className="text-amber-300/90 bg-black/40 px-1 py-0.5 rounded">http://localhost:3000/#access_token=...</code>) แล้วกดปุ่มด้านล่างเพื่อเข้าสู่ระบบทันที:
            </p>

            <div className="space-y-2">
              <button
                type="button"
                disabled={isLoading}
                onClick={handlePasteFromClipboard}
                className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold text-xs flex items-center justify-center gap-2 shadow-md transition active:scale-98 cursor-pointer disabled:opacity-50"
              >
                <ClipboardPaste className="w-4 h-4 text-black" />
                <span>📋 วางลิงก์จากคลิปบอร์ดและเข้าสู่ระบบทันที</span>
              </button>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="หรือวางลิงก์ localhost:3000 / Token ที่นี่..."
                  value={manualTokenInput}
                  onChange={(e) => setManualTokenInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      processTokenOrUrl(manualTokenInput);
                    }
                  }}
                  className="flex-1 py-2 px-3 rounded-xl bg-black/50 border border-purple-500/30 text-white text-xs placeholder-purple-400/40 focus:outline-none focus:border-purple-400"
                />
                <button
                  type="button"
                  disabled={isLoading || !manualTokenInput.trim()}
                  onClick={() => processTokenOrUrl(manualTokenInput)}
                  className="py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition cursor-pointer disabled:opacity-40"
                >
                  ยืนยัน
                </button>
              </div>
            </div>

            {/* Collapsible Supabase Dashboard permanent configuration guide */}
            <div className="mt-3 pt-2 border-t border-purple-500/20">
              <button
                type="button"
                onClick={() => setShowTroubleshoot(!showTroubleshoot)}
                className="w-full flex items-center justify-between text-[11px] text-purple-300/80 hover:text-purple-200 cursor-pointer"
              >
                <span className="flex items-center gap-1">
                  <HelpCircle className="w-3.5 h-3.5 text-purple-400" />
                  วิธีแก้ปัญหาถาวรใน Supabase Dashboard (ไม่ต้องคัดลอกลิงก์)
                </span>
                {showTroubleshoot ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {showTroubleshoot && (
                <div className="mt-2.5 p-2.5 rounded-xl bg-black/40 text-[11px] text-purple-200/90 space-y-1.5 text-left border border-purple-500/20">
                  <p className="font-semibold text-white">ขั้นตอนตั้งค่า Supabase URL Configuration:</p>
                  <ol className="list-decimal list-inside space-y-1 text-purple-300/90 pl-1">
                    <li>ไปที่เมนู <b>Authentication &gt; URL Configuration</b> ใน Supabase Dashboard</li>
                    <li>แก้ไข <b>Site URL</b> เป็น: <code className="text-amber-300 break-all select-all">{window.location.origin}</code></li>
                    <li>เพิ่มในช่อง <b>Redirect URLs</b>: <code className="text-amber-300 break-all select-all">https://*.run.app/**</code></li>
                    <li>กด Save การตั้งค่า — หลังจากนี้การกดปุ่ม Google จะล็อกอินกลับมาที่เว็บทันทีอัตโนมัติ 100%</li>
                  </ol>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Security badge */}
        <div className="mt-6 pt-4 border-t border-purple-500/20 flex items-center justify-center gap-2 text-[11px] text-purple-300/60">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>ระบบความปลอดภัยมาตรฐาน Google OAuth 2.0 &amp; Supabase Encrypted</span>
        </div>
      </div>
    </div>
  );
};
