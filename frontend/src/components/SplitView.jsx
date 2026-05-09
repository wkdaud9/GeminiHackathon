import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Image as ImageIcon, Send, Sparkles, Target, X, Zap } from 'lucide-react';

export default function SplitView({
  apiBase,
  userId,
  activeLogId,
  initialMessages,
  selectedGoalNumber,
  selectedGoalTitle,
  onHistoryUpdate,
  goals,
  onScoreUpdate,
  lazinessScore,
}) {
  const [timeline, setTimeline] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [lastViolation, setLastViolation] = useState(false);
  const scrollRef = useRef(null);

  const HAPPY_IMG = '/egogo_happy.png';
  const ANGRY_IMG = '/egogo_angry.png';
  const isAngry = lazinessScore >= 80 || lastViolation;

  useEffect(() => {
    setTimeline(initialMessages || []);
    setLastViolation(false);
  }, [initialMessages, activeLogId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [timeline, isLoading]);

  useEffect(() => {
    if (selectedGoalTitle) {
      setChatInput((current) => current || `${selectedGoalTitle}에 대해 더 깊게 이야기해보자. `);
    }
  }, [selectedGoalTitle]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setSelectedImage(reader.result);
    reader.readAsDataURL(file);
  };

  const handleGeneralChat = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() && !selectedImage) return;

    const timestamp = Date.now();
    const userMsg = {
      id: `local-${timestamp}`,
      type: 'chat',
      content: chatInput,
      image: selectedImage,
      sender: 'User',
      logId: activeLogId,
      relatedGoal: selectedGoalNumber,
      timestamp,
    };

    setTimeline((prev) => [...prev, userMsg]);
    onHistoryUpdate(userMsg);

    const payload = {
      user_id: userId,
      message: chatInput,
      image_base64: selectedImage,
      log_id: activeLogId,
      goal_number: selectedGoalNumber,
    };

    setChatInput('');
    setSelectedImage(null);
    setIsLoading(true);

    try {
      const response = await fetch(`${apiBase}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      const serverLogId = result.data?.log_id || activeLogId;
      const isViolation = Boolean(result.data?.is_violation);

      const aiMsg = {
        id: result.data?.assistant_message_id || `ai-${Date.now()}`,
        type: 'feedback',
        content: result.data?.roast || '응답을 가져오지 못했어. 백엔드 로그를 확인해봐야 해.',
        sender: 'Egogo',
        isViolation,
        relatedGoal: result.data?.related_goal_number,
        logId: serverLogId,
        timestamp: Date.now(),
      };

      setLastViolation(isViolation);
      setTimeline((prev) => [...prev, aiMsg]);
      onHistoryUpdate(aiMsg);

      if (result.data?.laziness_score !== undefined && onScoreUpdate) {
        onScoreUpdate(result.data.laziness_score);
      }
    } catch (err) {
      console.error('Failed to connect to backend:', err);
      const aiMsg = {
        id: `error-${Date.now()}`,
        type: 'feedback',
        content: '서버 연결에 실패했습니다. 백엔드가 켜져 있는지 확인해 주세요.',
        sender: 'Egogo',
        isViolation: true,
        timestamp: Date.now(),
      };
      setLastViolation(true);
      setTimeline((prev) => [...prev, aiMsg]);
      onHistoryUpdate(aiMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className={`toss-card flex-1 flex flex-col overflow-hidden relative border shadow-2xl transition-all duration-700 ${isAngry ? 'bg-red-50/60 border-red-200' : 'bg-white border-[var(--color-toss-gray-100)]'}`}>
        <div className="absolute right-4 top-16 hidden lg:block pointer-events-none z-0">
          <div className={`egogo-character-3d ${isAngry ? 'egogo-angry-3d egogo-glitch' : ''}`}>
            <img src={isAngry ? ANGRY_IMG : HAPPY_IMG} alt="Egogo" className="w-64 h-64 xl:w-80 xl:h-80 object-contain" />
          </div>
        </div>

        <div className="px-8 py-6 border-b border-[var(--color-toss-gray-100)] flex items-center justify-between bg-white/85 backdrop-blur-md z-10">
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-lg transition-all ${isAngry ? 'bg-red-600 egogo-glitch' : 'bg-[var(--color-toss-blue)]'}`}>
              <img src={isAngry ? ANGRY_IMG : HAPPY_IMG} alt="Egogo" className="w-14 h-14 object-contain float-animation" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[var(--color-toss-gray-900)] flex items-center gap-2">
                에고고 동기화
                {isAngry && <span className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-full animate-pulse">ANGER MODE</span>}
              </h2>
              <p className="text-xs text-[var(--color-toss-gray-600)] font-medium">
                {selectedGoalTitle ? `집중 목표: ${selectedGoalTitle}` : '오늘의 대화를 감시하는 중입니다'}
              </p>
            </div>
          </div>

          {selectedGoalTitle && (
            <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-blue-50 text-[var(--color-toss-blue)] rounded-2xl text-xs font-black">
              <Target size={14} /> 목표 {selectedGoalNumber}
            </div>
          )}
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 lg:p-10 flex flex-col gap-8 custom-scrollbar pb-44 z-10">
          {timeline.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-[var(--color-toss-gray-300)] gap-6">
              <div className={`egogo-character-3d ${isAngry ? 'egogo-angry-3d' : ''}`}>
                <img src={isAngry ? ANGRY_IMG : HAPPY_IMG} alt="Egogo" className="w-56 h-56 object-contain float-animation" />
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold text-[var(--color-toss-gray-900)]">에고고가 기다리고 있어요</h3>
                <p className="text-sm mt-3 leading-relaxed">오늘의 행동과 목표를 솔직하게 던져보세요.</p>
                <button
                  onClick={async () => {
                    setIsLoading(true);
                    try {
                      const response = await fetch(`${apiBase}/api/chat/morning`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ user_id: userId, message: '', log_id: activeLogId }),
                      });
                      const result = await response.json();
                      const aiMsg = {
                        id: result.data?.assistant_message_id || `morning-${Date.now()}`,
                        type: 'feedback',
                        content: result.data?.roast || '좋아. 오늘 계획부터 보자.',
                        sender: 'Egogo',
                        logId: result.data?.log_id || activeLogId,
                        timestamp: Date.now(),
                      };
                      setTimeline([aiMsg]);
                      onHistoryUpdate(aiMsg);
                    } catch (err) {
                      console.error('Morning briefing error:', err);
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  className="mt-8 px-8 py-4 bg-[var(--color-toss-blue)] text-white font-bold rounded-[2rem] hover:scale-105 active:scale-95 transition-all shadow-xl flex items-center gap-2 mx-auto"
                >
                  <Sparkles size={18} /> 아침 플랜 브리핑 받기
                </button>
              </div>
            </div>
          ) : (
            timeline.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-4 ${msg.sender === 'User' ? 'flex-row-reverse self-end max-w-[85%]' : 'self-start max-w-[85%]'}`}
              >
                {msg.sender === 'Egogo' && (
                  <div className="flex-shrink-0 mt-1">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-md border overflow-hidden ${msg.isViolation ? 'bg-red-100 border-red-200' : 'bg-blue-50 border-blue-100'}`}>
                      <img src={msg.isViolation ? ANGRY_IMG : HAPPY_IMG} alt="Egogo" className={`w-12 h-12 object-contain ${msg.isViolation ? 'egogo-glitch' : 'float-animation'}`} />
                    </div>
                  </div>
                )}

                <div className={`flex flex-col ${msg.sender === 'User' ? 'items-end' : 'items-start'}`}>
                  <div className={`p-5 rounded-[2rem] text-[15px] leading-relaxed shadow-sm whitespace-pre-wrap ${
                    msg.sender === 'User'
                      ? 'bg-[var(--color-toss-blue)] text-white rounded-tr-none'
                      : 'bg-white text-[var(--color-toss-gray-900)] rounded-tl-none border border-[var(--color-toss-gray-200)]'
                  }`}>
                    {msg.image && <img src={msg.image} alt="Upload" className="max-w-[200px] rounded-2xl mb-4 border" />}
                    {msg.content}
                    {msg.relatedGoal && goals[msg.relatedGoal - 1] && (
                      <div className="mt-3 pt-3 border-t border-black/5 flex items-center gap-2 text-[10px] font-bold text-[var(--color-toss-blue)]">
                        <Zap size={10} /> 관련 목표: {goals[msg.relatedGoal - 1]}
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-[var(--color-toss-gray-300)] font-bold mt-2 uppercase tracking-widest px-2">
                    {new Date(msg.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </motion.div>
            ))
          )}

          {isLoading && (
            <div className="self-start flex items-center gap-3 p-4 bg-[var(--color-toss-gray-100)] rounded-full text-[var(--color-toss-gray-600)] text-[10px] font-black uppercase tracking-widest animate-pulse border border-[var(--color-toss-gray-200)]">
              <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-[var(--color-toss-blue)] rounded-full animate-ping" />
              </div>
              응답 생성 중...
            </div>
          )}
        </div>

        <div className="absolute bottom-6 left-0 w-full px-6 lg:px-10 flex flex-col gap-2 z-20">
          {selectedImage && (
            <div className="relative w-20 h-20 bg-gray-100 rounded-xl overflow-hidden border border-[var(--color-toss-gray-200)] ml-4 shadow-sm">
              <img src={selectedImage} alt="Preview" className="w-full h-full object-cover opacity-80" />
              <button onClick={() => setSelectedImage(null)} className="absolute top-1 right-1 bg-white/80 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shadow">
                <X size={12} />
              </button>
            </div>
          )}

          <form onSubmit={handleGeneralChat} className="flex gap-3 p-3 bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-[0_12px_48px_rgba(0,0,0,0.12)] border border-[var(--color-toss-gray-100)] focus-within:ring-2 focus-within:ring-[var(--color-toss-blue)] transition-all items-center">
            <label className="w-12 h-12 flex items-center justify-center rounded-full text-[var(--color-toss-gray-400)] hover:text-[var(--color-toss-blue)] hover:bg-[var(--color-toss-gray-50)] cursor-pointer transition-colors ml-1" title="이미지 첨부">
              <ImageIcon size={22} />
              <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            </label>
            <input
              className="flex-1 bg-transparent px-3 py-4 text-[16px] text-[var(--color-toss-gray-900)] focus:outline-none placeholder-[var(--color-toss-gray-300)] font-medium"
              placeholder={selectedGoalTitle ? `${selectedGoalTitle}에 대해 말해보세요` : '오늘의 소비 기록이나 생각을 작성하세요'}
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
            />
            <button type="submit" disabled={(!chatInput.trim() && !selectedImage) || isLoading} className="w-14 h-14 bg-[var(--color-toss-blue)] text-white rounded-full flex items-center justify-center hover:scale-105 transition-all disabled:bg-[var(--color-toss-gray-100)] disabled:text-[var(--color-toss-gray-300)] shadow-lg active:scale-95">
              <Send size={24} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
