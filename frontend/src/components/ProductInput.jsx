import React, { useState } from 'react';
import { ShoppingBag, Search, ImagePlus } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ProductInput({ onAnalyze }) {
  const [productDesc, setProductDesc] = useState('');
  const [imageFile, setImageFile] = useState(null);

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!productDesc && !imageFile) return;
    onAnalyze({ text: productDesc, image: imageFile });
    setProductDesc('');
    setImageFile(null);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="glass-panel p-6 neon-border"
    >
      <div className="flex items-center gap-2 mb-4 text-neon-purple">
        <ShoppingBag size={24} />
        <h2 className="text-xl font-semibold">Conflict Analysis (소비 욕구)</h2>
      </div>
      <p className="text-sm text-gray-400 mb-4">
        사고 싶은 물건이 있나요? 링크, 설명, 혹은 사진을 올려보세요. 과거의 당신이 뭐라고 할지 들어봅시다.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <textarea
          className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-neon-purple transition-all resize-none"
          rows="2"
          placeholder="예: 최신형 아이패드 프로 사고 싶다..."
          value={productDesc}
          onChange={(e) => setProductDesc(e.target.value)}
        />
        
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
            <ImagePlus size={18} className="text-gray-300" />
            <span className="text-sm text-gray-300">
              {imageFile ? imageFile.name : '사진 첨부 (선택)'}
            </span>
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={handleImageChange}
            />
          </label>
          
          <button 
            type="submit" 
            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-fuchsia-500 rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            분석하기 <Search size={16} />
          </button>
        </div>
      </form>
    </motion.div>
  );
}
