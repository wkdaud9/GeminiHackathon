import React from 'react';
import { Book, MessageCircle, PlusCircle, Target, User, X } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Sidebar({
  history,
  goals,
  selectedGoalNumber,
  activeLogId,
  onDeleteGoal,
  onSelectGoal,
  onSelectDiary,
  onOpenGoalPanel,
  onNavigate,
  activeView,
}) {
  const diaryEntries = Object.values(
    history.reduce((acc, item) => {
      const logId = item.logId || `local-${item.date}`;
      const date = item.logDate
        ? new Date(item.logDate).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
        : new Date(item.timestamp || Date.now()).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });

      if (!acc[logId]) {
        acc[logId] = {
          logId,
          date,
          keyword: item.content?.slice(0, 18) || '대화 기록',
          timestamp: item.timestamp || 0,
          count: 0,
        };
      }
      acc[logId].timestamp = Math.max(acc[logId].timestamp, item.timestamp || 0);
      acc[logId].count += 1;
      return acc;
    }, {})
  ).sort((a, b) => b.timestamp - a.timestamp);

  const activeGoals = goals
    .map((title, index) => ({ title, goalNumber: index + 1 }))
    .filter((goal) => goal.title.trim());

  return (
    <aside className="w-80 bg-[var(--color-toss-gray-100)] border-r border-[var(--color-toss-gray-200)] flex-col h-full hidden md:flex overflow-hidden">
      <button className="p-6 flex items-center gap-3 bg-white border-b border-[var(--color-toss-gray-200)] text-left" onClick={() => onNavigate('chat')}>
        <div className="w-8 h-8 bg-[var(--color-toss-blue)] rounded-xl flex items-center justify-center text-white font-black">E</div>
        <h1 className="text-xl font-black text-[var(--color-toss-blue)]">Egogo</h1>
      </button>

      <div className="p-6 bg-white/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-[var(--color-toss-gray-900)]">
            <Target size={18} className="text-[var(--color-toss-blue)]" />
            <h2 className="font-bold text-sm">나의 나침반</h2>
          </div>
          <button
            onClick={onOpenGoalPanel}
            className="text-[var(--color-toss-blue)] hover:bg-blue-50 p-1.5 rounded-full transition-all active:scale-90"
            title="새 목표 추가"
          >
            <PlusCircle size={20} />
          </button>
        </div>

        <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar pr-1">
          {activeGoals.map((goal) => (
            <motion.div
              key={goal.goalNumber}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className={`group relative bg-white p-4 rounded-2xl border shadow-sm transition-all ${
                selectedGoalNumber === goal.goalNumber
                  ? 'border-[var(--color-toss-blue)] ring-2 ring-blue-100'
                  : 'border-[var(--color-toss-gray-200)] hover:border-[var(--color-toss-blue)]'
              }`}
            >
              <button className="w-full flex items-center gap-3 text-left" onClick={() => onSelectGoal(goal.goalNumber)}>
                <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center text-[var(--color-toss-blue)] text-[10px] font-black">
                  {goal.goalNumber}
                </div>
                <p className="flex-1 text-xs font-bold text-[var(--color-toss-gray-900)] truncate">{goal.title}</p>
              </button>
              <button
                onClick={() => onDeleteGoal(goal.goalNumber - 1)}
                className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 p-1 text-red-300 hover:text-red-500 transition-all"
                title="목표 삭제"
              >
                <X size={14} />
              </button>
            </motion.div>
          ))}

          {activeGoals.length === 0 && (
            <div className="bg-white/50 border-2 border-dashed border-[var(--color-toss-gray-200)] rounded-3xl p-6 text-center">
              <p className="text-[10px] font-bold text-[var(--color-toss-gray-400)]">목표를 설정하고<br />나침반을 가동하세요</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        <div className="px-6 pt-6 pb-2">
          <div className="flex items-center gap-2 text-[var(--color-toss-gray-900)]">
            <Book size={18} className="text-[var(--color-toss-gray-600)]" />
            <h2 className="font-bold text-sm">에고 다이어리</h2>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-3 custom-scrollbar">
          {diaryEntries.map((entry) => (
            <button
              key={entry.logId}
              onClick={() => onSelectDiary(entry.logId)}
              className={`w-full text-left bg-white p-4 rounded-2xl shadow-sm border transition-all active:scale-[0.98] ${
                activeLogId === entry.logId ? 'border-[var(--color-toss-blue)]' : 'border-transparent hover:border-[var(--color-toss-blue)]'
              }`}
            >
              <p className="text-[10px] font-bold text-[var(--color-toss-blue)] uppercase">{entry.date}</p>
              <p className="text-xs font-bold text-[var(--color-toss-gray-900)] truncate mt-1">{entry.keyword}...</p>
              <p className="text-[10px] text-[var(--color-toss-gray-400)] mt-2">{entry.count}개 메시지</p>
            </button>
          ))}

          {diaryEntries.length === 0 && (
            <div className="text-center text-xs text-[var(--color-toss-gray-400)] font-bold py-8">DB에 저장된 대화가 아직 없습니다.</div>
          )}
        </div>
      </div>

      <div className="p-4 border-t border-[var(--color-toss-gray-200)] bg-white">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onNavigate('chat')}
            className={`flex flex-col items-center gap-1 py-3 rounded-2xl transition-all ${activeView === 'chat' ? 'bg-blue-50 text-[var(--color-toss-blue)]' : 'text-gray-400 hover:bg-gray-50'}`}
          >
            <MessageCircle size={20} />
            <span className="text-[10px] font-bold">에고 채팅</span>
          </button>
          <button
            onClick={() => onNavigate('mypage')}
            className={`flex flex-col items-center gap-1 py-3 rounded-2xl transition-all ${activeView === 'mypage' ? 'bg-blue-50 text-[var(--color-toss-blue)]' : 'text-gray-400 hover:bg-gray-50'}`}
          >
            <User size={20} />
            <span className="text-[10px] font-bold">마이 에고</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
