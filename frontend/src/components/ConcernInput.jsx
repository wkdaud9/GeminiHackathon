import React, { useState } from 'react';
import { HelpCircle, Send, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ConcernInput({ onAnalyze }) {
  const [concern, setConcern] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!concern.trim()) return;
    onAnalyze({ text: concern });
    setConcern('');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="toss-card p-8"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600 shadow-sm">
          <HelpCircle size={24} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-[var(--color-toss-gray-900)]">고민 해결하기</h2>
          <p className="text-sm text-[var(--color-toss-gray-600)] mt-0.5">데이터를 기반으로 최선의 방향을 제시합니다</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          className="w-full bg-[var(--color-toss-gray-100)] border-none rounded-3xl p-6 text-[15px] text-[var(--color-toss-gray-900)] placeholder-[var(--color-toss-gray-300)] focus:ring-2 focus:ring-[var(--color-toss-blue)] transition-all resize-none h-32 leading-relaxed"
          placeholder="해결하고 싶은 고민이나 선택의 순간을 적어 보세요. 에고고가 함께 고민할게요."
          value={concern}
          onChange={(e) => setConcern(e.target.value)}
        />
        <button 
          type="submit" 
          disabled={!concern.trim()}
          className="w-full toss-button-primary disabled:bg-[var(--color-toss-gray-200)] disabled:text-[var(--color-toss-gray-600)] flex items-center justify-center gap-2 group"
        >
          분석 요청하기 
          <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </form>
    </motion.div>
  );
}
