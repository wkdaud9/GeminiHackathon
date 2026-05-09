import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, UserCheck } from 'lucide-react';

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
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState([]);

  const handleNext = (answer) => {
    const nextAnswers = [...answers, answer];
    setAnswers(nextAnswers);
    if (step < QUESTIONS.length - 1) {
      setStep(step + 1);
    } else {
      onComplete(nextAnswers);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-dark-bg/90 backdrop-blur-xl flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-panel max-w-lg w-full p-8 relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-white/10">
          <motion.div 
            className="h-full bg-gradient-to-r from-neon-blue to-neon-purple"
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
            <div className="flex items-center gap-2 text-neon-blue mb-2">
              <Sparkles size={20} />
              <span className="text-xs font-bold uppercase tracking-widest">Persona Analysis {step + 1}/{QUESTIONS.length}</span>
            </div>
            
            <h2 className="text-2xl font-bold leading-tight">
              {QUESTIONS[step].text}
            </h2>

            <div className="grid grid-cols-1 gap-3">
              {QUESTIONS[step].options.map((opt) => (
                <button
                  key={opt}
                  onClick={() => handleNext(opt)}
                  className="w-full p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-neon-blue/50 transition-all text-left flex items-center justify-between group"
                >
                  <span className="text-gray-300 group-hover:text-white transition-colors">{opt}</span>
                  <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-neon-blue" />
                </button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="mt-8 flex justify-between items-center text-[10px] text-gray-500 font-bold uppercase tracking-widest">
          <div className="flex items-center gap-1">
            <UserCheck size={12} /> Personality Sync Active
          </div>
          <div>Ego-Mirror v1.0</div>
        </div>
      </motion.div>
    </div>
  );
}
