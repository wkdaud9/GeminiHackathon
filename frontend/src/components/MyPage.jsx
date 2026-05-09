import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3, ChevronRight, FileText, HelpCircle, Info, LogOut, Mail, Shield } from 'lucide-react';

export default function MyPage({ user, goalStats, onLogout }) {
  const visibleGoals = goalStats.filter((goal) => goal.title);

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col gap-8 pb-12">
      <div className="toss-card p-8 flex items-center gap-6">
        <div className="w-20 h-20 rounded-[2rem] bg-[var(--color-toss-blue)] flex items-center justify-center text-white text-3xl font-black shadow-lg">
          {user?.name?.[0] || 'U'}
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-[var(--color-toss-gray-900)]">{user?.name || '사용자'}</h2>
          <p className="text-[var(--color-toss-gray-600)] font-medium mt-1 flex items-center gap-2">
            <Mail size={14} /> {user?.username || 'user@example.com'}
          </p>
        </div>
        <button onClick={onLogout} className="p-4 rounded-2xl bg-red-50 text-red-500 hover:bg-red-100 transition-colors flex items-center gap-2 font-bold text-sm">
          <LogOut size={18} /> 로그아웃
        </button>
      </div>

      <div className="toss-card p-8">
        <div className="flex items-center gap-3 mb-8">
          <BarChart3 className="text-[var(--color-toss-blue)]" />
          <h3 className="text-lg font-bold">목표별 AI 분석 달성도</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {visibleGoals.length > 0 ? visibleGoals.map((goal) => (
            <div key={goal.goalNumber} className="bg-[var(--color-toss-gray-50)] p-5 rounded-2xl border border-[var(--color-toss-gray-100)]">
              <div className="flex justify-between items-center gap-4 mb-3">
                <span className="text-sm font-bold text-[var(--color-toss-gray-900)] truncate">{goal.title}</span>
                <span className={`text-sm font-black ${goal.enoughData ? 'text-[var(--color-toss-blue)]' : 'text-[var(--color-toss-gray-400)]'}`}>
                  {goal.enoughData ? `${goal.score}%` : '분석 전'}
                </span>
              </div>
              <div className="h-2 bg-white rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${goal.score}%` }}
                  className={`h-full rounded-full ${goal.enoughData ? 'bg-[var(--color-toss-blue)]' : 'bg-[var(--color-toss-gray-300)]'}`}
                />
              </div>
              <p className="text-[11px] text-[var(--color-toss-gray-600)] mt-3">
                {goal.enoughData
                  ? `관련 대화 ${goal.relatedCount}개를 바탕으로 계산했습니다.`
                  : `충분한 대화가 쌓이면 분석이 시작됩니다. 현재 ${goal.relatedCount}개`}
              </p>
            </div>
          )) : (
            <p className="col-span-2 text-center py-8 text-[var(--color-toss-gray-400)] font-medium italic">설정된 목표가 없습니다.</p>
          )}
        </div>
      </div>

      <div className="toss-card overflow-hidden">
        <div className="p-4 border-b border-[var(--color-toss-gray-100)] bg-[var(--color-toss-gray-50)]">
          <span className="text-xs font-bold text-[var(--color-toss-gray-600)] uppercase tracking-widest px-4">시스템 설정</span>
        </div>
        <div className="divide-y divide-[var(--color-toss-gray-100)]">
          <SettingItem icon={<HelpCircle size={20} />} label="고객 센터" />
          <SettingItem icon={<FileText size={20} />} label="이용약관" />
          <SettingItem icon={<Shield size={20} />} label="개인정보 처리방침" />
          <SettingItem icon={<Info size={20} />} label="버전 정보" value="v1.4.2 stable" />
        </div>
      </div>
    </motion.div>
  );
}

function SettingItem({ icon, label, value }) {
  return (
    <div className="flex items-center justify-between p-6 hover:bg-[var(--color-toss-gray-50)] transition-colors cursor-pointer group">
      <div className="flex items-center gap-4 text-[var(--color-toss-gray-900)]">
        <div className="text-[var(--color-toss-gray-400)] group-hover:text-[var(--color-toss-blue)] transition-colors">{icon}</div>
        <span className="font-bold">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {value && <span className="text-sm font-medium text-[var(--color-toss-gray-400)]">{value}</span>}
        <ChevronRight size={18} className="text-[var(--color-toss-gray-300)]" />
      </div>
    </div>
  );
}
