import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, Send, MessageSquare } from 'lucide-react';

export default function SplitView({ onHistoryUpdate, goals }) {
  const [timeline, setTimeline] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [chatInput, setChatInput] = useState('');

  const handleGeneralChat = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = { id: Date.now(), type: 'chat', content: chatInput, sender: 'User' };
    setTimeline(prev => [...prev, userMsg]);
    onHistoryUpdate(userMsg);
    setChatInput('');
    setIsLoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      const aiMsg = {
        id: Date.now() + 1,
        type: 'feedback',
        content: `네, 말씀해 주세요. 현재 설정하신 ${goals.filter(g => g).length}개의 목표를 바탕으로 오늘의 기록을 도와드릴게요.`,
        sender: 'Ego-Mirror'
      };
      setTimeline(prev => [...prev, aiMsg]);
      onHistoryUpdate(aiMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="toss-card flex-1 flex flex-col overflow-hidden relative bg-white border border-[var(--color-toss-gray-100)] shadow-2xl">
        {/* Header */}
        <div className="px-8 py-6 border-b border-[var(--color-toss-gray-100)] flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-[var(--color-toss-blue)] shadow-inner">
              <MessageSquare size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[var(--color-toss-gray-900)]">에고 싱크</h2>
              <p className="text-xs text-[var(--color-toss-gray-600)] font-medium">당신의 오늘을 기록하고 분석합니다</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-[10px] font-bold text-green-600">실시간 동기화 중</span>
          </div>
        </div>
        
        {/* Chat Timeline */}
        <div className="flex-1 overflow-y-auto p-10 flex flex-col gap-8 custom-scrollbar pb-36">
          {timeline.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-[var(--color-toss-gray-300)] gap-8 opacity-50">
              <div className="w-24 h-24 rounded-full bg-[var(--color-toss-gray-50)] flex items-center justify-center border border-[var(--color-toss-gray-100)]">
                <Zap size={48} />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-bold text-[var(--color-toss-gray-900)]">오늘의 기록을 시작하세요</h3>
                <p className="text-sm mt-2">당신의 생각, 기분, 혹은 질문을 자유롭게 남겨보세요</p>
              </div>
            </div>
          ) : (
            timeline.map((msg) => (
              <motion.div 
                key={msg.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex flex-col max-w-[80%] ${msg.sender === 'User' ? 'self-end items-end' : 'self-start'}`}
              >
                <div className={`p-5 rounded-[2.5rem] text-[15px] leading-relaxed shadow-sm ${
                  msg.sender === 'User' 
                    ? 'bg-[var(--color-toss-blue)] text-white rounded-tr-none' 
                    : 'bg-[var(--color-toss-gray-100)] text-[var(--color-toss-gray-900)] rounded-tl-none border border-[var(--color-toss-gray-200)]'
                }`}>
                  {msg.content}
                </div>
                <span className="text-[10px] text-[var(--color-toss-gray-300)] font-bold mt-2 uppercase tracking-widest px-2">
                  {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </motion.div>
            ))
          )}
          {isLoading && (
            <div className="self-start flex items-center gap-2 p-4 bg-[var(--color-toss-gray-100)] rounded-full text-[var(--color-toss-gray-600)] text-[10px] font-black uppercase tracking-widest animate-pulse">
              에고 분석 중...
            </div>
          )}
        </div>

        {/* Bottom Floating Chat Input */}
        <div className="absolute bottom-10 left-0 w-full px-10">
          <form 
            onSubmit={handleGeneralChat} 
            className="flex gap-4 p-3 bg-white/90 backdrop-blur-xl rounded-[2.5rem] shadow-[0_12px_48px_rgba(0,0,0,0.12)] border border-[var(--color-toss-gray-100)] focus-within:ring-2 focus-within:ring-[var(--color-toss-blue)] transition-all"
          >
            <input
              className="flex-1 bg-transparent px-8 py-4 text-[16px] text-[var(--color-toss-gray-900)] focus:outline-none placeholder-[var(--color-toss-gray-300)] font-medium"
              placeholder="오늘의 생각을 기록해 보세요..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
            />
            <button 
              type="submit"
              disabled={!chatInput.trim()}
              className="w-14 h-14 bg-[var(--color-toss-blue)] text-white rounded-full flex items-center justify-center hover:scale-105 transition-all disabled:bg-[var(--color-toss-gray-100)] disabled:text-[var(--color-toss-gray-300)] shadow-lg active:scale-95"
            >
              <Send size={24} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
