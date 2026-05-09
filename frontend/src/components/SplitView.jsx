import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, Send, MessageSquare } from 'lucide-react';

export default function SplitView({ userId, onHistoryUpdate, goals, onScoreUpdate, lazinessScore }) {
  const [timeline, setTimeline] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGeneralChat = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() && !selectedImage) return;

    const userMsg = { 
      id: Date.now(), 
      type: 'chat', 
      content: chatInput, 
      image: selectedImage,
      sender: 'User' 
    };
    
    setTimeline(prev => [...prev, userMsg]);
    onHistoryUpdate(userMsg);
    
    const payload = { user_id: userId, message: chatInput, image_base64: selectedImage };
    
    setChatInput('');
    setSelectedImage(null);
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      
      const aiMsg = {
        id: result.data?.assistant_message_id || Date.now() + 1,
        type: 'feedback',
        content: result.data?.roast || "응답을 불러오지 못했습니다.",
        sender: 'Ego-Mirror',
        relatedGoal: result.data?.related_goal_number
      };
      
      setTimeline(prev => [...prev, aiMsg]);
      onHistoryUpdate(aiMsg);

      if (result.data?.laziness_score !== undefined && onScoreUpdate) {
        onScoreUpdate(result.data.laziness_score);
      }
    } catch (err) {
      console.error("Failed to connect to backend:", err);
      const aiMsg = {
        id: Date.now() + 1,
        type: 'feedback',
        content: `서버 연결에 실패했습니다. 백엔드가 켜져있는지 확인해주세요.`,
        sender: 'Ego-Mirror'
      };
      setTimeline(prev => [...prev, aiMsg]);
      onHistoryUpdate(aiMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const isHighDebt = lazinessScore >= 80;

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className={`toss-card flex-1 flex flex-col overflow-hidden relative border shadow-2xl transition-colors duration-1000 ${isHighDebt ? 'bg-red-50/90 border-red-200' : 'bg-white border-[var(--color-toss-gray-100)]'}`}>
        {/* Header */}
        <div className={`px-8 py-6 border-b flex items-center justify-between transition-colors duration-1000 ${isHighDebt ? 'border-red-200' : 'border-[var(--color-toss-gray-100)]'}`}>
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
        <div className="flex-1 overflow-y-auto p-10 flex flex-col gap-8 custom-scrollbar pb-48">
          {timeline.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-[var(--color-toss-gray-300)] gap-8 opacity-50">
              <div className="w-24 h-24 rounded-full bg-[var(--color-toss-gray-50)] flex items-center justify-center border border-[var(--color-toss-gray-100)]">
                <Zap size={48} />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-bold text-[var(--color-toss-gray-900)]">오늘의 기록을 시작하세요</h3>
                <p className="text-sm mt-2">당신의 생각, 기분, 혹은 질문을 자유롭게 남겨보세요<br/>영수증이나 사진을 첨부해도 분석해 드립니다.</p>
                <button
                  onClick={async () => {
                    setIsLoading(true);
                    try {
                      const response = await fetch('http://localhost:8000/api/chat/morning', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ user_id: userId, message: '' })
                      });
                      const result = await response.json();
                      const aiMsg = {
                        id: result.data?.assistant_message_id || Date.now(),
                        type: 'feedback',
                        content: result.data?.roast || "응답을 불러오지 못했습니다.",
                        sender: 'Ego-Mirror'
                      };
                      setTimeline([aiMsg]);
                      onHistoryUpdate(aiMsg);
                    } catch (err) {
                      console.error("Morning briefing error:", err);
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  className="mt-6 px-6 py-3 bg-[var(--color-toss-blue)] text-white font-bold rounded-full hover:scale-105 active:scale-95 transition-transform shadow-lg"
                >
                  🌅 아침 플랜 브리핑 받기
                </button>
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
                  {msg.image && (
                    <img src={msg.image} alt="첨부 이미지" className="max-w-[200px] rounded-xl mb-3 object-cover" />
                  )}
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
        <div className="absolute bottom-6 left-0 w-full px-10 flex flex-col gap-2">
          {selectedImage && (
            <div className="relative w-20 h-20 bg-gray-100 rounded-xl overflow-hidden border border-[var(--color-toss-gray-200)] ml-4 shadow-sm">
              <img src={selectedImage} alt="Preview" className="w-full h-full object-cover opacity-80" />
              <button 
                onClick={() => setSelectedImage(null)}
                className="absolute top-1 right-1 bg-white/80 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shadow"
              >
                X
              </button>
            </div>
          )}
          <form 
            onSubmit={handleGeneralChat} 
            className="flex gap-4 p-3 bg-white/90 backdrop-blur-xl rounded-[2.5rem] shadow-[0_12px_48px_rgba(0,0,0,0.12)] border border-[var(--color-toss-gray-100)] focus-within:ring-2 focus-within:ring-[var(--color-toss-blue)] transition-all items-center"
          >
            <label className="w-12 h-12 flex items-center justify-center rounded-full text-[var(--color-toss-gray-400)] hover:text-[var(--color-toss-blue)] hover:bg-[var(--color-toss-gray-50)] cursor-pointer transition-colors ml-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
              <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            </label>
            <input
              className="flex-1 bg-transparent px-4 py-4 text-[16px] text-[var(--color-toss-gray-900)] focus:outline-none placeholder-[var(--color-toss-gray-300)] font-medium"
              placeholder="오늘의 소비 기록이나 생각을 작성하세요..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
            />
            <button 
              type="submit"
              disabled={(!chatInput.trim() && !selectedImage) || isLoading}
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
