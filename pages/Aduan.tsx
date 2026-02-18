import React, { useState } from 'react';
import { refineAduanText } from '../services/geminiService';

const Aduan: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    nim: '',
    category: 'Akademik',
    message: ''
  });
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleEnhance = async () => {
    if (!formData.message.trim()) return;
    setIsEnhancing(true);
    const refined = await refineAduanText(formData.message);
    setFormData(prev => ({ ...prev, message: refined }));
    setIsEnhancing(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate submission
    setTimeout(() => {
        setSubmitted(true);
    }, 1000);
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
                 <button
                    type="button"
                    onClick={handleEnhance}
                    disabled={isEnhancing || !formData.message}
                    className="text-[10px] uppercase tracking-wider text-stone-500 hover:text-white disabled:text-stone-800 transition-colors flex items-center gap-2"
                 >
                    {isEnhancing ? 'Sedang Memproses...' : '[ ✨ AI Refine Text ]'}
                 </button>
            </div>
          </div>

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
    </div>
  );
};

export default Aduan;
