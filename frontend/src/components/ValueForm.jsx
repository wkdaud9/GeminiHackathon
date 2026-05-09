import React, { useState } from 'react';
import { Send, BookHeart } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ValueForm({ onValueSubmit }) {
  const [value, setValue] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!value.trim()) return;
    onValueSubmit(value);
    setValue('');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel p-6 mb-6"
    >
      <div className="flex items-center gap-2 mb-4 text-neon-blue">
        <BookHeart size={24} />
        <h2 className="text-xl font-semibold">Ego-Sync (가치관 기록)</h2>
      </div>
      <p className="text-sm text-gray-400 mb-4">
        당신의 목표, 가치관, 혹은 다짐을 기록해두세요. AI가 이를 기억하고 의사결정의 기준으로 삼습니다.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <textarea
          className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-neon-blue transition-all resize-none"
          rows="3"
          placeholder="예: 올해는 월 50만원씩 꼭 저축할 거야. 야식은 일주일에 한 번만 먹자!"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <button 
          type="submit" 
          className="self-end px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
        >
          기록하기 <Send size={16} />
        </button>
      </form>
    </motion.div>
  );
}
