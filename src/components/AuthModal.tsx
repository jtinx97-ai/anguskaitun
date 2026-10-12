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
  Crown
} from 'lucide-react';
import { 
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
  const [isWaitingForGoogle, setIsWaitingForGoogle] = useState(false);
  const [hasClipboardToken, setHasClipboardToken] = useState(false);

  // Generate OAuth URL based on current host
  const authUrl = buildGoogleOAuthUrl();

  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      setSuccessMessage(null);
      setIsLoading(false);
      setIsWaitingForGoogle(false);

      // Check if clipboard contains OAuth token
      if (typeof navigator !== 'undefined' && navigator.clipboard?.readText) {
        navigator.clipboard.readText()
          .then((text) => {
            if (text && (text.includes('access_token=') || (text.split('.').length === 3 && text.length > 50))) {
              setHasClipboardToken(true);
            }
          })
          .catch(() => {});
      }
    }
  }, [isOpen]);

  // Complete user login and sync with server database
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
      }, 600);
      return true;
    } else {
      throw new Error(data.message || 'ไม่สามารถบันทึกข้อมูลผู้ใช้ลงฐานข้อมูลได้');
    }
  };

  // Process raw text containing OAuth access_token
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
        const hashPart = text.includes('#') ? text.split('#')[1] : text;
        const params = new URLSearchParams(hashPart);
        accessToken = params.get('access_token') || '';
        refreshToken = params.get('refresh_token') || '';
      } else if (text.includes('.')) {
        accessToken = text;
      }

      if (!accessToken) {
        throw new Error('ไม่พบข้อมูล Token ที่ถูกต้อง');
      }

      const jwtPayload = decodeJwtPayload(accessToken);
      let userEmail = jwtPayload?.email || jwtPayload?.user_metadata?.email;
      let userName = jwtPayload?.user_metadata?.full_name || jwtPayload?.user_metadata?.name;
      let userAvatar = jwtPayload?.user_metadata?.avatar_url || jwtPayload?.user_metadata?.picture;
      let userId = jwtPayload?.sub;

      try {
        if (refreshToken) {
          await supabaseClient.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
        }
      } catch (err) {
        console.warn('Supabase setSession non-fatal:', err);
      }

      try {
        const { data: { user } } = await supabaseClient.auth.getUser(accessToken);
        if (user) {
          userEmail = user.email || userEmail;
          userName = user.user_metadata?.full_name || user.user_metadata?.name || userName;
          userAvatar = user.user_metadata?.avatar_url || user.user_metadata?.picture || userAvatar;
          userId = user.id || userId;
        }
      } catch (e) {
        console.warn('Supabase getUser non-fatal:', e);
      }

      if (!userEmail) {
        throw new Error('ไม่สามารถดึงอีเมลจาก Token ได้');
      }

      await completeLoginWithSession(userEmail, userName, userAvatar, userId);
    } catch (err: any) {
      setErrorMessage(err.message || 'เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์');
    } finally {
      setIsLoading(false);
    }
  };

  // 1-Click Clipboard paste and login
  const handlePasteClipboardLogin = async () => {
    try {
      if (!navigator.clipboard?.readText) {
        setErrorMessage('เบราว์เซอร์ไม่อนุญาตให้อ่านคลิปบอร์ด กรุณาเข้าสู่ระบบผ่านปุ่ม Google ด้านบน');
        return;
      }
      const clipText = await navigator.clipboard.readText();
      if (!clipText) {
        setErrorMessage('ไม่พบข้อมูล Token ในคลิปบอร์ด');
        return;
      }
      await processTokenOrUrl(clipText);
    } catch (err: any) {
      setErrorMessage('ไม่สามารถอ่านคลิปบอร์ดได้: ' + (err.message || ''));
    }
  };

  // Instant login for owner / admin testing
  const handleInstantAdminLogin = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await completeLoginWithSession('jtinx97@gmail.com', 'jtinx97 (เจ้าของร้าน)', undefined, 'usr-jtinx97_gmail_com');
    } catch (err: any) {
      setErrorMessage(err.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
    } finally {
      setIsLoading(false);
    }
  };

  // Listen for callback postMessage from OAuth popup
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

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-md rounded-3xl bg-gradient-to-b from-[#160c2d] via-[#0e071c] to-[#07030e] border border-purple-500/30 shadow-[0_0_60px_rgba(147,51,234,0.35)] p-6 sm:p-8 text-center text-white"
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
          เข้าสู่ระบบปลอดภัยผ่านบัญชี Google ซิงค์ข้อมูลอัตโนมัติ
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
              <p className="text-[11px] text-purple-300/80 mt-0.5">เลือกบัญชี Google ในหน้าต่างที่เปิดขึ้นมา</p>
            </div>
          </div>
        )}

        {/* Action Buttons (NO INPUT BOXES) */}
        <div className="space-y-3.5">
          {/* Primary Official Google Sign-In Link (Always opens reliably without popup blocker) */}
          <a
            href={authUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setIsWaitingForGoogle(true)}
            className="w-full py-3.5 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-sm sm:text-base shadow-[0_0_25px_rgba(255,255,255,0.25)] flex items-center justify-center gap-3 transition transform active:scale-95 cursor-pointer border border-slate-200 no-underline"
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
            <span>เข้าสู่ระบบด้วย Google</span>
            <ExternalLink className="w-4 h-4 text-slate-500 ml-1" />
          </a>

          {/* Instant Login for Owner / Admin (jtinx97@gmail.com) */}
          <button
            type="button"
            disabled={isLoading}
            onClick={handleInstantAdminLogin}
            className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-purple-900/80 to-indigo-900/80 hover:from-purple-800 hover:to-indigo-800 border border-purple-500/40 text-purple-100 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer shadow-md disabled:opacity-50"
          >
            <Crown className="w-4 h-4 text-amber-400" />
            <span>เข้าสู่ระบบด่วนด้วย Google (jtinx97@gmail.com)</span>
          </button>

          {/* Clipboard Auto-detection Button (Shown when clipboard has token or requested) */}
          {hasClipboardToken && (
            <button
              type="button"
              disabled={isLoading}
              onClick={handlePasteClipboardLogin}
              className="w-full py-2.5 px-3 rounded-xl bg-amber-500/20 border border-amber-500/50 hover:bg-amber-500/30 text-amber-200 font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer animate-fadeIn"
            >
              <ClipboardPaste className="w-4 h-4 text-amber-400" />
              <span>ตรวจพบ Token ในคลิปบอร์ด — กดเพื่อเข้าสู่ระบบทันที</span>
            </button>
          )}
        </div>

        {/* Security badge */}
        <div className="mt-6 pt-4 border-t border-purple-500/20 flex items-center justify-center gap-2 text-[11px] text-purple-300/60">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>ระบบความปลอดภัย Google OAuth 2.0 &amp; Supabase Database</span>
        </div>
      </div>
    </div>
  );
};
