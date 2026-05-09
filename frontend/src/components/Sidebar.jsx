import React, { useState } from 'react';
import { MessageCircle, Target, Clock, Calendar, Plus, Edit2, Save, Trash2, Book } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Sidebar({ history, goals, onUpdateGoal, onAddGoal, onDeleteGoal }) {
  const [editingGoalIndex, setEditingGoalIndex] = useState(null);
  const [tempGoal, setTempGoal] = useState('');

  const activeGoals = goals;

  // Group history by date into "Diary Entries"
  // Each day gets ONE entry: "YYYY년 M월 D일 (키워드)"
  const diaryEntries = history.reduce((acc, item) => {
    const date = new Date(item.timestamp || Date.now()).toLocaleDateString('ko-KR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    if (!acc[date]) {
      acc[date] = {
        date,
        keyword: item.content.slice(0, 10), // Simple keyword extraction (first 10 chars)
        timestamp: item.timestamp
      };
    }
    return acc;
  }, {});

  const handleEditGoal = (index) => {
    setEditingGoalIndex(index);
    setTempGoal(goals[index] || '');
  };

  const handleSaveGoal = (index) => {
    onUpdateGoal(index, tempGoal);
    setEditingGoalIndex(null);
  };

  return (
    <aside className="w-80 bg-[var(--color-toss-gray-100)] border-r border-[var(--color-toss-gray-200)] flex flex-col h-full hidden md:flex overflow-hidden">
      {/* 1. Goal Setting (Moved to Sidebar) */}
      <div className="p-6 bg-white border-b border-[var(--color-toss-gray-200)]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-[var(--color-toss-gray-900)]">
            <Target size={18} className="text-[var(--color-toss-blue)]" />
            <h2 className="font-bold text-sm">나의 목표</h2>
          </div>
          {goals.length < 10 && (
            <button onClick={onAddGoal} className="text-[var(--color-toss-blue)] hover:bg-blue-50 p-1 rounded-full transition-colors">
              <Plus size={16} />
            </button>
          )}
        </div>
        
        <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
          {goals.map((goal, i) => (
            <div key={i} className="group relative bg-[var(--color-toss-gray-50)] p-2.5 rounded-xl border border-transparent hover:border-[var(--color-toss-gray-200)] transition-all">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-[var(--color-toss-gray-300)] w-4">{i + 1}</span>
                {editingGoalIndex === i ? (
                  <input
                    autoFocus
                    className="flex-1 bg-transparent text-xs font-medium focus:outline-none"
                    value={tempGoal}
                    onChange={(e) => setTempGoal(e.target.value)}
                    onBlur={() => handleSaveGoal(i)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveGoal(i)}
                  />
                ) : (
                  <p 
                    className="flex-1 text-xs font-medium text-[var(--color-toss-gray-900)] truncate cursor-text"
                    onClick={() => handleEditGoal(i)}
                  >
                    {goal || <span className="text-gray-300 italic">목표 입력...</span>}
                  </p>
                )}
                <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => editingGoalIndex === i ? handleSaveGoal(i) : handleEditGoal(i)} className="p-1 text-gray-400 hover:text-blue-500">
                    {editingGoalIndex === i ? <Save size={12} /> : <Edit2 size={12} />}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Diary History (Redesigned) */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="px-6 pt-6 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[var(--color-toss-gray-900)]">
            <Book size={18} className="text-[var(--color-toss-gray-600)]" />
            <h2 className="font-bold text-sm">에고 다이어리</h2>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-3 custom-scrollbar">
          {Object.values(diaryEntries).sort((a, b) => b.timestamp - a.timestamp).map((entry) => (
            <div 
              key={entry.date}
              className="group bg-white p-4 rounded-2xl shadow-sm border border-transparent hover:border-[var(--color-toss-blue)] cursor-pointer transition-all active:scale-[0.98]"
            >
              <div className="flex flex-col gap-1">
                <p className="text-[10px] font-bold text-[var(--color-toss-blue)] uppercase tracking-tighter">
                  {entry.date}
                </p>
                <p className="text-xs font-bold text-[var(--color-toss-gray-900)] truncate">
                  ({entry.keyword}...)
                </p>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-[10px] text-gray-400 font-medium">기록 확인하기</span>
                <Clock size={10} className="text-gray-300" />
              </div>
            </div>
          ))}
          
          {history.length === 0 && (
            <div className="text-center py-20 opacity-30 flex flex-col items-center gap-4">
              <Book size={32} className="text-gray-400" />
              <p className="text-xs font-bold">첫 번째 기록을 남겨보세요</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-6 border-t border-[var(--color-toss-gray-200)] bg-white/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[var(--color-toss-blue)] flex items-center justify-center text-white font-bold text-sm">
            U
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-[var(--color-toss-gray-900)]">사용자님</p>
            <p className="text-[10px] text-[var(--color-toss-gray-600)] font-medium">다이어리 {Object.keys(diaryEntries).length}개 기록됨</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
