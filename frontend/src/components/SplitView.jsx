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

  const messagesEndRef = useRef(null);

  useEffect(() => {
    setTimeline(initialMessages || []);
    setLastViolation(false);
  }, [initialMessages, activeLogId]);

  useEffect(() => {
    // 메시지나 로딩 상태가 추가된 직후와, 프레이머 모션 애니메이션이 완료될 쯤(100ms) 두 번 스크롤
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
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
      <div className="toss-card flex-1 flex flex-col overflow-hidden relative border shadow-2xl bg-white border-[var(--color-toss-gray-100)]">
        
        {/* Floating background messages when angry */}
        {isAngry && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            {timeline.filter(m => m.sender === 'User').slice(-10).map((msg, i) => {
              const pseudoRandomX = ((i * 17) % 70) + 5; // 5% ~ 75%
              const pseudoRandomDelay = ((i * 13) % 10);
              const pseudoRandomDuration = 12 + ((i * 7) % 8);
              return (
                <motion.div
                  key={`float-${msg.id}`}
                  initial={{ opacity: 0, y: '100vh', x: `${pseudoRandomX}vw`, scale: 0.8 }}
                  animate={{ opacity: [0, 0.4, 0.4, 0], y: ['100vh', '40vh', '0vh', '-20vh'], scale: 1 }}
                  transition={{ duration: pseudoRandomDuration, repeat: Infinity, ease: 'linear', delay: pseudoRandomDelay }}
                  className="absolute p-4 max-w-[250px] bg-red-950/40 border border-red-800/50 text-red-100 font-medium text-sm rounded-[2rem] rounded-br-none shadow-xl shadow-red-900/10 backdrop-blur-sm whitespace-pre-wrap leading-relaxed"
                >
                  "{msg.content.slice(0, 40)}{msg.content.length > 40 ? '...' : ''}"
                </motion.div>
              );
            })}
          </div>
        )}

        <div className="px-8 py-5 border-b flex items-center justify-between backdrop-blur-md z-10 bg-white/85 border-[var(--color-toss-gray-100)]">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center flex-shrink-0">
              <img src={isAngry ? ANGRY_IMG : HAPPY_IMG} alt="EgoGo" className={`w-12 h-12 object-cover rounded-full shadow-md ${isAngry ? 'egogo-glitch border-2 border-red-500 shadow-red-500/50' : 'float-animation border-2 border-white'}`} />
            </div>
            <div>
              <h1 className="text-xl font-black flex items-center gap-2 text-[var(--color-toss-gray-900)] tracking-tight">
                EgoGo
                {isAngry && <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded-full animate-pulse shadow-lg shadow-red-500/50 tracking-widest font-black ml-1">WARNING</span>}
              </h1>
              <p className="text-xs font-medium mt-0.5 text-[var(--color-toss-gray-500)]">
                {selectedGoalTitle ? `집중 목표: ${selectedGoalTitle}` : '내 안의 나태함을 끊어내는 거울'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {selectedGoalTitle && (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-[var(--color-toss-blue)] rounded-xl text-xs font-black">
                <Target size={14} /> 목표 {selectedGoalNumber}
              </div>
            )}
            <div className={`px-3 py-1.5 rounded-xl flex items-center gap-2 border ${lazinessScore >= 80 ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'}`}>
              <div className={`w-2 h-2 rounded-full ${lazinessScore >= 80 ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`} />
              <span className={`text-[10px] font-black uppercase tracking-widest ${lazinessScore >= 80 ? 'text-red-600' : 'text-green-600'}`}>
                게으름 지수: {lazinessScore}
              </span>
            </div>
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 lg:p-10 flex flex-col gap-8 custom-scrollbar pb-44 z-10">
          {timeline.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-[var(--color-toss-gray-300)] gap-6">
              <div className={`egogo-character-3d mt-8 ${isAngry ? 'egogo-angry-3d' : ''}`}>
                <img src={isAngry ? ANGRY_IMG : HAPPY_IMG} alt="EgoGo" className="w-32 h-32 md:w-56 md:h-56 object-cover rounded-full shadow-xl float-animation" />
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
                    <img src={msg.isViolation ? ANGRY_IMG : HAPPY_IMG} alt="EgoGo" className={`w-12 h-12 object-cover rounded-full shadow-md ${msg.isViolation ? 'egogo-glitch border-2 border-red-400' : 'float-animation border-2 border-blue-200'}`} />
                  </div>
                )}

                <div className={`flex flex-col ${msg.sender === 'User' ? 'items-end' : 'items-start'}`}>
                  <div className={`p-5 rounded-[2rem] text-[15px] leading-relaxed shadow-sm whitespace-pre-wrap transition-colors duration-500 ${
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
          <div ref={messagesEndRef} className="h-4" />
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

          <form onSubmit={handleGeneralChat} className={`flex gap-2 p-2 backdrop-blur-xl rounded-full shadow-[0_12px_48px_rgba(0,0,0,0.12)] border focus-within:ring-2 transition-all items-center ${isAngry ? 'bg-red-950/90 border-red-800 focus-within:ring-red-500 shadow-red-900/50' : 'bg-white/95 border-[var(--color-toss-gray-100)] focus-within:ring-[var(--color-toss-blue)]'}`}>
            <label className={`w-10 h-10 flex items-center justify-center rounded-full cursor-pointer transition-colors ml-1 ${isAngry ? 'text-red-400 hover:text-red-300 hover:bg-red-900' : 'text-[var(--color-toss-gray-400)] hover:text-[var(--color-toss-blue)] hover:bg-[var(--color-toss-gray-50)]'}`} title="이미지 첨부">
              <ImageIcon size={18} />
              <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            </label>
            <input
              className={`flex-1 bg-transparent px-2 py-2 text-[15px] focus:outline-none font-medium transition-colors ${isAngry ? 'text-red-50 placeholder-red-400/70' : 'text-[var(--color-toss-gray-900)] placeholder-[var(--color-toss-gray-300)]'}`}
              placeholder={isAngry ? '변명은 통하지 않습니다. 솔직하게 적으세요.' : (selectedGoalTitle ? `${selectedGoalTitle}에 대해 말해보세요` : '오늘의 소비 기록이나 생각을 작성하세요')}
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
            />
            <button type="submit" disabled={(!chatInput.trim() && !selectedImage) || isLoading} className={`w-10 h-10 text-white rounded-full flex items-center justify-center hover:scale-105 transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:scale-100 mr-0.5 ${isAngry ? 'bg-red-600 shadow-red-600/40 disabled:bg-red-900 disabled:text-red-400' : 'bg-[var(--color-toss-blue)] disabled:bg-[var(--color-toss-gray-100)] disabled:text-[var(--color-toss-gray-300)]'}`}>
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
