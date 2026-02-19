'use client';

import React, { useState, useEffect } from 'react';

type AduanFormData = {
  name: string;
  nim: string;
  category: string;
  message: string;
};

type AutoSaveStatus = 'idle' | 'saving' | 'saved' | 'error';

type StoredAduanState = {
  data: AduanFormData;
  timestamp: number;
  messageHistory?: string[];
};

const STORAGE_KEY = 'aduan_form_state_v1';
const MAX_HISTORY_LENGTH = 10;
const DAY_IN_MS = 24 * 60 * 60 * 1000;

const Aduan: React.FC = () => {
  const [formData, setFormData] = useState<AduanFormData>({
    name: '',
    nim: '',
    category: 'Akademik',
    message: ''
  });
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<AutoSaveStatus>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [showRestoreNotice, setShowRestoreNotice] = useState(false);
  const [hasTouchedForm, setHasTouchedForm] = useState(false);
  const [messageHistory, setMessageHistory] = useState<string[]>([]);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;

      const parsed = JSON.parse(raw) as StoredAduanState | null;
      if (!parsed || typeof parsed !== 'object') {
        window.localStorage.removeItem(STORAGE_KEY);
        return;
      }

      const { data, timestamp, messageHistory: savedHistory } = parsed;

      if (!data || typeof timestamp !== 'number') {
        window.localStorage.removeItem(STORAGE_KEY);
        return;
      }

      if (Date.now() - timestamp > DAY_IN_MS) {
        window.localStorage.removeItem(STORAGE_KEY);
        return;
      }

      const validCategories = ['Akademik', 'Fasilitas', 'Organisasi', 'Lainnya'];
      const isValidCategory = validCategories.includes(data.category);

      if (
        typeof data.name !== 'string' ||
        typeof data.nim !== 'string' ||
        typeof data.message !== 'string' ||
        !isValidCategory
      ) {
        window.localStorage.removeItem(STORAGE_KEY);
        return;
      }

      setFormData({
        name: data.name,
        nim: data.nim,
        category: data.category,
        message: data.message
      });

      const cleanedHistory = Array.isArray(savedHistory)
        ? savedHistory.filter((entry) => typeof entry === 'string').slice(-MAX_HISTORY_LENGTH)
        : [];

      setMessageHistory(cleanedHistory);
      setShowRestoreNotice(true);
      setHasTouchedForm(true);
      setAutoSaveStatus('saved');
      setLastSavedAt(
        new Date(timestamp).toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit'
        })
      );
    } catch {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  useEffect(() => {
    if (!hasTouchedForm || submitted) return;
    if (typeof window === 'undefined') return;

    setAutoSaveStatus('saving');

    const timeoutId = window.setTimeout(() => {
      try {
        const payload: StoredAduanState = {
          data: formData,
          timestamp: Date.now(),
          messageHistory
        };
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));

        setAutoSaveStatus('saved');
        setLastSavedAt(
          new Date(payload.timestamp).toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit'
          })
        );
      } catch {
        setAutoSaveStatus('error');
      }
    }, 2000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [formData, messageHistory, hasTouchedForm, submitted]);

  useEffect(() => {
    if (!hasTouchedForm || submitted) return;
    if (typeof window === 'undefined') return;

    const handleBeforeUnload = () => {
      try {
        const payload: StoredAduanState = {
          data: formData,
          timestamp: Date.now(),
          messageHistory
        };
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      } catch {
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [formData, messageHistory, hasTouchedForm, submitted]);

  const clearStoredState = () => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
    }
  };

  const handleResetDraft = () => {
    setFormData({
      name: '',
      nim: '',
      category: 'Akademik',
      message: ''
    });
    setMessageHistory([]);
    setHasTouchedForm(false);
    setShowRestoreNotice(false);
    setAutoSaveStatus('idle');
    setLastSavedAt(null);
    clearStoredState();
    setShowResetConfirm(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setHasTouchedForm(true);
  };

  const handleEnhance = async () => {
    if (!formData.message.trim()) return;
    setHasTouchedForm(true);
    setMessageHistory((prev) => {
      const next = [...prev, formData.message];
      if (next.length > MAX_HISTORY_LENGTH) {
        next.shift();
      }
      return next;
    });
    setIsEnhancing(true);
    try {
      const response = await fetch('/api/refine-aduan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: formData.message })
      });
      if (!response.ok) {
        setIsEnhancing(false);
        return;
      }
      const data = (await response.json()) as { enhanced?: string };
      const nextMessage =
        typeof data.enhanced === 'string' && data.enhanced.trim()
          ? data.enhanced
          : formData.message;
      setFormData(prev => ({ ...prev, message: nextMessage }));
    } catch {
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleUndoEnhance = () => {
    setMessageHistory((prev) => {
      if (prev.length === 0) return prev;
      const next = [...prev];
      const last = next.pop() as string;
      setFormData((current) => ({ ...current, message: last }));
      return next;
    });
    setHasTouchedForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAutoSaveStatus('saving');

    try {
      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      setSubmitted(true);
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
      }
      setAutoSaveStatus('idle');
      setLastSavedAt(null);
      setMessageHistory([]);
      setHasTouchedForm(false);
      setShowRestoreNotice(false);
      clearStoredState();
    } catch (error) {
      console.error('Submission error:', error);
      setAutoSaveStatus('error');
      alert('Gagal mengirim laporan. Silakan coba sesaat lagi.');
    }
  };

  if (submitted) {
     return (
        <div className="min-h-screen bg-stone-950 flex items-center justify-center px-6">
            <div className="text-center">
                <h2 className="font-serif text-3xl text-white mb-4">Terima Kasih</h2>
                <p className="text-stone-500 max-w-md mx-auto leading-relaxed">
                    Laporan Anda telah kami terima dan akan ditinjau oleh Divisi Advokasi. Privasi identitas Anda terjamin.
                </p>
                <button 
                    onClick={() => { setSubmitted(false); setFormData({...formData, message: ''}); }}
                    className="mt-8 text-xs uppercase tracking-widest text-stone-400 border-b border-stone-700 pb-1 hover:text-white hover:border-white transition-all"
                >
                    Kirim laporan lain
                </button>
            </div>
        </div>
     )
  }

  return (
    <div className="pt-32 pb-20 px-6 min-h-screen bg-stone-950 flex justify-center">
      <div className="w-full max-w-2xl">
        <p className="text-xs uppercase tracking-[0.3em] text-stone-500 mb-8 text-center">Layanan Advokasi</p>
        <h1 className="font-serif text-4xl md:text-5xl text-white mb-4 text-center">Kotak Aduan</h1>
        <p className="text-stone-500 text-center mb-16 text-sm">Sampaikan aspirasi, kritik, atau saran dengan bijak.</p>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="group">
              <label className="block text-xs uppercase tracking-widest text-stone-600 mb-2 group-focus-within:text-white transition-colors">Nama (Opsional)</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full bg-transparent border-b border-stone-800 py-3 text-stone-300 focus:outline-none focus:border-white transition-colors placeholder-stone-800"
                placeholder="Anonim"
              />
            </div>
            <div className="group">
              <label className="block text-xs uppercase tracking-widest text-stone-600 mb-2 group-focus-within:text-white transition-colors">NIM (Opsional)</label>
              <input
                type="text"
                name="nim"
                value={formData.nim}
                onChange={handleChange}
                className="w-full bg-transparent border-b border-stone-800 py-3 text-stone-300 focus:outline-none focus:border-white transition-colors placeholder-stone-800"
                placeholder="12345678"
              />
            </div>
          </div>

          <div className="group">
            <label className="block text-xs uppercase tracking-widest text-stone-600 mb-2 group-focus-within:text-white transition-colors">Kategori</label>
            <div className="relative">
                <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full bg-transparent border-b border-stone-800 py-3 text-stone-300 focus:outline-none focus:border-white transition-colors appearance-none rounded-none"
                >
                    <option className="bg-stone-900" value="Akademik">Akademik</option>
                    <option className="bg-stone-900" value="Fasilitas">Fasilitas Kampus</option>
                    <option className="bg-stone-900" value="Organisasi">Internal Organisasi</option>
                    <option className="bg-stone-900" value="Lainnya">Lainnya</option>
                </select>
                {/* Custom arrow simulation since we can't use icons */}
                <div className="absolute right-0 top-4 pointer-events-none text-[10px] text-stone-600">▼</div>
            </div>
          </div>

          <div className="group">
            <label className="block text-xs uppercase tracking-widest text-stone-600 mb-2 group-focus-within:text-white transition-colors">Pesan</label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              rows={6}
              className="w-full bg-stone-900/30 border border-stone-800 p-4 text-stone-300 focus:outline-none focus:border-white transition-colors resize-none"
              placeholder="Tuliskan keluhan atau saran anda disini..."
              required
            ></textarea>
            
            <div className="flex justify-between items-center mt-3">
                 <span className="text-[10px] text-stone-600 uppercase tracking-wider">
                    {formData.message.length} Karakter
                 </span>
                 <div className="flex items-center gap-4">
                   <button
                      type="button"
                      onClick={handleEnhance}
                      disabled={isEnhancing || !formData.message}
                      className="text-[10px] uppercase tracking-wider text-stone-500 hover:text-white disabled:text-stone-800 transition-colors flex items-center gap-2"
                   >
                      {isEnhancing ? 'Sedang Memproses...' : '[ ✨ AI Refine Text ]'}
                   </button>
                   {messageHistory.length > 0 && (
                     <button
                       type="button"
                       onClick={handleUndoEnhance}
                       className="text-[10px] uppercase tracking-wider text-stone-500 hover:text-white transition-colors border-b border-transparent hover:border-stone-500"
                     >
                       Undo AI
                     </button>
                   )}
                 </div>
            </div>
          </div>

          {(hasTouchedForm || showRestoreNotice || autoSaveStatus === 'error') && (
            <div className="pt-2 text-[10px] text-stone-600 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="flex items-center gap-3">
                {autoSaveStatus === 'saving' && (
                  <span className="tracking-wider text-stone-500">Menyimpan draf...</span>
                )}
                {autoSaveStatus === 'saved' && lastSavedAt && (
                  <span className="tracking-wider text-stone-500">
                    Draf tersimpan otomatis • {lastSavedAt}
                  </span>
                )}
                {autoSaveStatus === 'error' && (
                  <span className="tracking-wider text-red-400">
                    Gagal menyimpan draf. Periksa penyimpanan browser.
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 justify-between md:justify-end">
                {showRestoreNotice && (
                  <span className="tracking-wider text-stone-400">
                    Draf sebelumnya dipulihkan secara otomatis.
                  </span>
                )}
                {hasTouchedForm && (
                  <button
                    type="button"
                    onClick={() => setShowResetConfirm(true)}
                    className="uppercase tracking-widest text-stone-500 hover:text-white transition-colors border-b border-stone-700 hover:border-white"
                  >
                    Reset draf
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="pt-8 text-center">
            <button
              type="submit"
              className="px-12 py-4 bg-white text-black text-xs font-bold uppercase tracking-widest hover:bg-stone-300 transition-colors w-full md:w-auto"
            >
              Kirim Laporan
            </button>
          </div>
        </form>
      </div>

      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6">
          <div className="w-full max-w-sm bg-stone-950 border border-stone-800 p-6">
            <h2 className="font-serif text-lg text-white mb-2">Reset draf?</h2>
            <p className="text-xs text-stone-400 mb-6 leading-relaxed">
              Tindakan ini akan menghapus semua isi kotak aduan yang belum dikirim.
            </p>
            <div className="flex justify-end gap-3 text-[10px] uppercase tracking-widest">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 text-stone-400 hover:text-white border border-stone-700 hover:border-white transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleResetDraft}
                className="px-4 py-2 bg-white text-black font-bold hover:bg-stone-300 transition-colors"
              >
                Ya, reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Aduan;
