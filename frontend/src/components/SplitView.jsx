import React, { useState } from 'react';
import ValueForm from './ValueForm';
import ProductInput from './ProductInput';
import { motion } from 'framer-motion';
import { ShieldAlert, User, Zap } from 'lucide-react';

export default function SplitView() {
  const [timeline, setTimeline] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleValueSubmit = async (value) => {
    // Add User input to timeline immediately
    setTimeline(prev => [...prev, {
      id: Date.now(),
      type: 'value',
      content: value,
      sender: 'User'
    }]);

    try {
      // Backend call
      await fetch('http://localhost:8000/api/values', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: value })
      });
      // Optionally notify user of successful save here
    } catch (err) {
      console.error("Failed to save value:", err);
    }
  };

  const handleAnalyze = async (data) => {
    const newInteraction = {
      id: Date.now(),
      type: 'desire',
      content: data.text || '이미지 분석 요청',
      sender: 'User'
    };
    
    setTimeline(prev => [...prev, newInteraction]);
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_desc: data.text })
      });
      const result = await response.json();
      
      setTimeline(prev => [...prev, {
        id: Date.now() + 1,
        type: 'feedback',
        content: result.feedback || "분석을 완료했습니다.",
        sender: 'Ego-Mirror'
      }]);
    } catch (err) {
      console.error("Failed to analyze:", err);
      setTimeline(prev => [...prev, {
        id: Date.now() + 1,
        type: 'feedback',
        content: "분석 중 오류가 발생했습니다. 나중에 다시 시도해주세요.",
        sender: 'Ego-Mirror'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full">
      {/* Left Panel: Inputs */}
      <div className="flex flex-col gap-6">
        <ValueForm onValueSubmit={handleValueSubmit} />
        <ProductInput onAnalyze={handleAnalyze} />
      </div>

      {/* Right Panel: Mirror Feedback Timeline */}
      <div className="glass-panel flex flex-col h-[600px] md:h-auto overflow-hidden">
        <div className="p-4 border-b border-white/10 flex items-center gap-2 bg-black/20">
          <Zap className="text-yellow-400" size={20} />
          <h2 className="text-lg font-semibold">Mirror Timeline</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
          {timeline.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              가치관을 기록하거나 분석을 요청해보세요.
            </div>
          ) : (
            timeline.map((msg) => (
              <motion.div 
                key={msg.id}
                initial={{ opacity: 0, scale: 0.95, x: msg.sender === 'User' ? -20 : 20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                className={`flex flex-col max-w-[80%] ${msg.sender === 'User' ? 'self-start' : 'self-end'}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  {msg.sender === 'User' ? (
                    <User size={14} className="text-neon-blue" />
                  ) : (
                    <ShieldAlert size={14} className="text-neon-purple" />
                  )}
                  <span className={`text-xs font-semibold ${msg.sender === 'User' ? 'text-neon-blue' : 'text-neon-purple'}`}>
                    {msg.sender}
                  </span>
                </div>
                <div className={`p-3 rounded-2xl ${
                  msg.sender === 'User' 
                    ? 'bg-blue-500/10 border border-blue-500/20 text-blue-50 rounded-tl-none' 
                    : 'bg-purple-500/10 border border-purple-500/20 text-purple-50 rounded-tr-none'
                }`}>
                  {msg.content}
                </div>
              </motion.div>
            ))
          )}
          {isLoading && (
            <div className="self-end flex items-center gap-2 text-neon-purple text-sm animate-pulse">
              <ShieldAlert size={14} /> 자아 데이터를 분석 중입니다...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
