import React, { useState } from 'react';
import { Save, Target, Edit2, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function GoalManager({ goals, onUpdateGoal, onAddGoal, onDeleteGoal }) {
  const [editingIndex, setEditingIndex] = useState(null);
  const [tempValue, setTempValue] = useState('');

  const handleEdit = (index) => {
    setEditingIndex(index);
    setTempValue(goals[index] || '');
  };

  const handleSave = (index) => {
    onUpdateGoal(index, tempValue);
    setEditingIndex(null);
  };

  return (
    <div className="toss-card p-8 flex flex-col h-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-bold text-[var(--color-toss-gray-900)]">나의 목표 설정</h2>
          <p className="text-sm text-[var(--color-toss-gray-600)] mt-1">에고 미러가 집중할 핵심 가치들</p>
        </div>
        {goals.length < 10 && (
          <button 
            onClick={onAddGoal}
            className="w-10 h-10 rounded-full bg-[var(--color-toss-gray-100)] flex items-center justify-center text-[var(--color-toss-gray-600)] hover:bg-[var(--color-toss-gray-200)] transition-all"
          >
            <Plus size={20} />
          </button>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
        <AnimatePresence initial={false}>
          {goals.map((goal, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`group p-4 rounded-2xl border transition-all ${
                editingIndex === i 
                  ? 'bg-white border-[var(--color-toss-blue)] ring-1 ring-[var(--color-toss-blue)] shadow-lg' 
                  : 'bg-[var(--color-toss-gray-50)] border-transparent hover:border-[var(--color-toss-gray-200)] hover:bg-white'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  goal ? 'bg-blue-50 text-[var(--color-toss-blue)]' : 'bg-gray-100 text-gray-400'
                }`}>
                  {i + 1}
                </div>
                
                {editingIndex === i ? (
                  <input
                    autoFocus
                    className="flex-1 bg-transparent border-none text-[15px] font-medium text-[var(--color-toss-gray-900)] focus:outline-none"
                    value={tempValue}
                    placeholder="목표를 입력해 주세요"
                    onChange={(e) => setTempValue(e.target.value)}
                    onBlur={() => handleSave(i)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSave(i)}
                  />
                ) : (
                  <div 
                    className="flex-1 text-[15px] font-medium text-[var(--color-toss-gray-900)] cursor-text py-1"
                    onClick={() => handleEdit(i)}
                  >
                    {goal || <span className="text-[var(--color-toss-gray-300)] font-normal italic">목표를 입력해 보세요...</span>}
                  </div>
                )}

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => editingIndex === i ? handleSave(i) : handleEdit(i)} className="p-2 text-[var(--color-toss-gray-600)] hover:text-[var(--color-toss-blue)]">
                    {editingIndex === i ? <CheckCircle2 size={18} /> : <Edit2 size={16} />}
                  </button>
                  {goals.length > 3 && (
                    <button onClick={() => onDeleteGoal(i)} className="p-2 text-[var(--color-toss-gray-600)] hover:text-red-500">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      
      <div className="mt-6 p-4 rounded-2xl bg-[var(--color-toss-gray-100)] flex items-center justify-between">
        <span className="text-xs font-bold text-[var(--color-toss-gray-600)]">완성도</span>
        <div className="flex-1 mx-4 h-1.5 bg-white rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-[var(--color-toss-blue)]"
            initial={{ width: 0 }}
            animate={{ width: `${(goals.filter(g => g).length / 10) * 100}%` }}
          />
        </div>
        <span className="text-xs font-bold text-[var(--color-toss-blue)]">{goals.filter(g => g).length}/10</span>
      </div>
    </div>
  );
}
