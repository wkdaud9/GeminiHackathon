import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, UserCheck, Key, User } from 'lucide-react';

const QUESTIONS = [
  {
    id: 1,
    text: "평소 소비 결정을 할 때 어떤 점을 가장 중요하게 생각하시나요?",
    options: ["즉각적인 만족", "장기적인 가치", "가격 대비 성능", "사회적 영향"]
  },
  {
    id: 2,
    text: "스트레스를 받을 때 주로 어떻게 해소하시나요?",
    options: ["쇼핑이나 맛있는 음식", "운동이나 취미 활동", "혼자만의 휴식", "친구와의 대화"]
  },
  {
    id: 3,
    text: "미래를 위해 현재의 즐거움을 얼마나 포기할 수 있으신가요?",
    options: ["전혀 포기 못함", "조금은 가능", "상당히 가능", "미래가 최우선"]
  }
];

export default function Onboarding({ onComplete }) {
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'
  const [formData, setFormData] = useState({ username: '', password: '', name: '' });
  const [step, setStep] = useState(-1); // -1: Auth, 0~2: Survey
  const [answers, setAnswers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    if (authMode === 'login') {
      setIsLoading(true);
      try {
        const res = await fetch('http://localhost:8000/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: formData.username, password: formData.password })
        });
        const data = await res.json();
        if (res.ok) {
          onComplete(data.data);
        } else {
          setErrorMsg(data.detail || '로그인 실패');
        }
      } catch (err) {
        setErrorMsg('서버와 연결할 수 없습니다.');
      } finally {
        setIsLoading(false);
      }
    } else {
      // Proceed to survey for signup
      setStep(0);
    }
  };

  const calculateScores = (answers) => {
    // Simple mock logic for hackathon
    let impulse = 50;
    let laziness = 70;
    if (answers[0] === "즉각적인 만족") impulse += 30;
    if (answers[1] === "쇼핑이나 맛있는 음식") impulse += 20;
    return { impulse, laziness };
  };

  const handleNext = async (answer) => {
    const nextAnswers = [...answers, answer];
    setAnswers(nextAnswers);
    
    if (step < QUESTIONS.length - 1) {
      setStep(step + 1);
    } else {
      // Finished Survey -> Call Signup API
      setIsLoading(true);
      const scores = calculateScores(nextAnswers);
      try {
        const res = await fetch('http://localhost:8000/api/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            username: formData.username, 
            password: formData.password, 
            name: formData.name,
            impulse_score: scores.impulse,
            laziness_score: scores.laziness
          })
        });
        const data = await res.json();
        if (res.ok) {
          onComplete(data.data);
        } else {
          setErrorMsg(data.detail || '회원가입 실패');
          setStep(-1); // Go back to auth screen
        }
      } catch (err) {
        setErrorMsg('서버와 연결할 수 없습니다.');
        setStep(-1);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[var(--color-toss-gray-900)]/90 backdrop-blur-xl flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-8 relative overflow-hidden"
      >
        {step === -1 ? (
          // --- Auth Form ---
          <div className="flex flex-col gap-6">
            <div className="text-center mb-4">
              <h2 className="text-2xl font-bold text-[var(--color-toss-gray-900)]">
                {authMode === 'login' ? 'EgoGo 로그인' : '자아 동기화 시작하기'}
              </h2>
              <p className="text-[var(--color-toss-gray-600)] text-sm mt-2">
                {authMode === 'login' ? '다시 오셨군요, 당신의 에고가 기다리고 있습니다.' : '간단한 질문을 통해 당신만의 에고고를 만듭니다.'}
              </p>
            </div>
            
            {errorMsg && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl font-medium">{errorMsg}</div>}

            <form onSubmit={handleAuthSubmit} className="flex flex-col gap-4">
              {authMode === 'signup' && (
                <div>
                  <label className="text-xs font-bold text-[var(--color-toss-gray-600)] uppercase">이름 (닉네임)</label>
                  <input 
                    required
                    className="w-full mt-1 p-4 bg-[var(--color-toss-gray-50)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-toss-blue)]"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder="홍길동"
                  />
                </div>
              )}
              <div>
                <label className="text-xs font-bold text-[var(--color-toss-gray-600)] uppercase">아이디</label>
                <input 
                  required
                  className="w-full mt-1 p-4 bg-[var(--color-toss-gray-50)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-toss-blue)]"
                  value={formData.username}
                  onChange={e => setFormData({...formData, username: e.target.value})}
                  placeholder="ID"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-[var(--color-toss-gray-600)] uppercase">비밀번호</label>
                <input 
                  required
                  type="password"
                  className="w-full mt-1 p-4 bg-[var(--color-toss-gray-50)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-toss-blue)]"
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                  placeholder="Password"
                />
              </div>
              
              <button 
                type="submit" 
                disabled={isLoading}
                className="mt-4 w-full p-4 bg-[var(--color-toss-blue)] text-white rounded-xl font-bold text-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {isLoading ? '처리 중...' : (authMode === 'login' ? '로그인' : '설문조사 시작')}
              </button>
            </form>
            
            <button 
              onClick={() => { setAuthMode(authMode === 'login' ? 'signup' : 'login'); setErrorMsg(''); }}
              className="text-sm font-medium text-[var(--color-toss-blue)] hover:underline text-center"
            >
              {authMode === 'login' ? '처음이신가요? 계정 만들기' : '이미 계정이 있으신가요? 로그인'}
            </button>
          </div>
        ) : (
          // --- Survey Form ---
          <>
            <div className="absolute top-0 left-0 w-full h-1 bg-[var(--color-toss-gray-100)]">
              <motion.div 
                className="h-full bg-[var(--color-toss-blue)]"
                initial={{ width: 0 }}
                animate={{ width: `${((step + 1) / QUESTIONS.length) * 100}%` }}
              />
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col gap-6"
              >
                <div className="flex items-center gap-2 text-[var(--color-toss-blue)] mb-2">
                  <Sparkles size={20} />
                  <span className="text-xs font-bold uppercase tracking-widest">Persona Sync {step + 1}/{QUESTIONS.length}</span>
                </div>
                
                <h2 className="text-2xl font-bold leading-tight text-[var(--color-toss-gray-900)]">
                  {QUESTIONS[step].text}
                </h2>

                <div className="grid grid-cols-1 gap-3">
                  {QUESTIONS[step].options.map((opt) => (
                    <button
                      key={opt}
                      disabled={isLoading}
                      onClick={() => handleNext(opt)}
                      className="w-full p-4 rounded-xl border border-[var(--color-toss-gray-200)] bg-[var(--color-toss-gray-50)] hover:bg-blue-50 hover:border-[var(--color-toss-blue)] hover:text-[var(--color-toss-blue)] transition-all text-left flex items-center justify-between group font-medium"
                    >
                      <span>{opt}</span>
                      <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                    </button>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
            
            {isLoading && <div className="mt-4 text-center text-sm font-medium text-[var(--color-toss-blue)] animate-pulse">자아를 분석하여 에고고를 생성 중입니다...</div>}
          </>
        )}
      </motion.div>
    </div>
  );
}
