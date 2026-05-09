import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import Sidebar from './components/Sidebar';
import SplitView from './components/SplitView';
import Onboarding from './components/Onboarding';
import MyPage from './components/MyPage';

const API_BASE = 'http://localhost:8000';

function formatMessage(msg) {
  return {
    id: msg.id,
    logId: msg.log_id,
    logDate: msg.log_date,
    date: new Date(msg.created_at).toLocaleDateString(),
    type: msg.role === 'user' ? 'chat' : 'feedback',
    sender: msg.role === 'user' ? 'User' : 'Egogo',
    content: msg.content,
    timestamp: new Date(msg.created_at).getTime(),
    relatedGoal: msg.related_goal_number,
  };
}

function App() {
  const [isRegistered, setIsRegistered] = useState(false);
  const [activeView, setActiveView] = useState('chat');
  const [user, setUser] = useState(null);
  const [history, setHistory] = useState([]);
  const [currentMessages, setCurrentMessages] = useState([]);
  const [activeLogId, setActiveLogId] = useState(null);
  const [selectedGoalNumber, setSelectedGoalNumber] = useState(null);
  const [goals, setGoals] = useState(Array(10).fill(''));
  const [lazinessScore, setLazinessScore] = useState(50);
  const [isGoalPanelOpen, setIsGoalPanelOpen] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState('');

  useEffect(() => {
    const savedReg = localStorage.getItem('ego_mirror_registered');
    const savedUser = localStorage.getItem('ego_mirror_user');

    if (savedReg && savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setIsRegistered(true);
      setUser(parsedUser);
      fetchUserData(parsedUser.id);
    }
  }, []);

  const fetchUserData = async (uid) => {
    try {
      const [userRes, goalRes, historyRes] = await Promise.all([
        fetch(`${API_BASE}/api/user?user_id=${uid}`),
        fetch(`${API_BASE}/api/goals?user_id=${uid}`),
        fetch(`${API_BASE}/api/chat/history?user_id=${uid}`),
      ]);

      const userData = await userRes.json();
      if (userData.data) {
        setUser(userData.data);
        setLazinessScore(userData.data.laziness_score);
      }

      const goalData = await goalRes.json();
      if (goalData.data) {
        const nextGoals = Array(10).fill('');
        goalData.data.forEach((goal) => {
          if (goal.goal_number >= 1 && goal.goal_number <= 10 && goal.is_active !== false) {
            nextGoals[goal.goal_number - 1] = goal.title;
          }
        });
        setGoals(nextGoals);
      }

      const historyData = await historyRes.json();
      const messages = (historyData.data || []).map(formatMessage);
      const newestFirst = [...messages].sort((a, b) => b.timestamp - a.timestamp);
      setHistory(newestFirst);

      const latestLogId = newestFirst[0]?.logId || null;
      setActiveLogId(latestLogId);
      setCurrentMessages(
        latestLogId
          ? messages.filter((msg) => msg.logId === latestLogId).sort((a, b) => a.timestamp - b.timestamp)
          : []
      );
    } catch (err) {
      console.error('Failed to sync with backend:', err);
    }
  };

  const handleOnboardingComplete = (userData) => {
    localStorage.setItem('ego_mirror_registered', 'true');
    localStorage.setItem('ego_mirror_user', JSON.stringify(userData));
    setUser(userData);
    setIsRegistered(true);
    setLazinessScore(userData.laziness_score);
    fetchUserData(userData.id);
  };

  const handleLogout = () => {
    localStorage.removeItem('ego_mirror_registered');
    localStorage.removeItem('ego_mirror_user');
    setIsRegistered(false);
    setUser(null);
    setHistory([]);
    setCurrentMessages([]);
    setActiveLogId(null);
    setSelectedGoalNumber(null);
    setActiveView('chat');
  };

  const addToHistory = (item) => {
    const timestamp = item.timestamp || Date.now();
    const enriched = { ...item, timestamp, logId: item.logId || activeLogId };
    setHistory((prev) => [enriched, ...prev]);
    setCurrentMessages((prev) => [...prev, enriched]);
    if (item.logId && item.logId !== activeLogId) {
      setActiveLogId(item.logId);
    }
  };

  const handleSelectDiary = async (logId) => {
    if (!user?.id || !logId) return;
    try {
      const res = await fetch(`${API_BASE}/api/chat/logs/${logId}/messages?user_id=${user.id}`);
      const data = await res.json();
      const messages = (data.data || []).map(formatMessage).sort((a, b) => a.timestamp - b.timestamp);
      setCurrentMessages(messages);
      setActiveLogId(logId);
      setSelectedGoalNumber(null);
      setActiveView('chat');
    } catch (err) {
      console.error('Failed to load diary conversation:', err);
    }
  };

  const handleSelectGoal = (goalNumber) => {
    setSelectedGoalNumber(goalNumber);
    setActiveView('chat');
  };

  const handleUpdateGoal = async (index, newValue) => {
    const nextGoals = [...goals];
    nextGoals[index] = newValue;
    setGoals(nextGoals);

    if (user?.id) {
      try {
        await fetch(`${API_BASE}/api/goals`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: user.id,
            goal_number: index + 1,
            title: newValue,
            description: '',
          }),
        });
      } catch (err) {
        console.error('Failed to save goal:', err);
      }
    }
  };

  const handleDeleteGoal = (index) => {
    handleUpdateGoal(index, '');
    if (selectedGoalNumber === index + 1) {
      setSelectedGoalNumber(null);
    }
  };

  const handleAddGoal = () => {
    const title = newGoalTitle.trim();
    if (!title) return;
    const nextIndex = goals.findIndex((goal) => !goal.trim());
    if (nextIndex === -1) return;
    handleUpdateGoal(nextIndex, title);
    setNewGoalTitle('');
    setIsGoalPanelOpen(false);
  };

  const goalStats = useMemo(() => {
    return goals.map((title, index) => {
      const goalNumber = index + 1;
      const related = history.filter((item) => item.relatedGoal === goalNumber);
      const userTurns = related.filter((item) => item.sender === 'User').length;
      const assistantTurns = related.filter((item) => item.sender === 'Egogo').length;
      const enoughData = userTurns >= 3 && assistantTurns >= 3;
      return {
        title,
        goalNumber,
        relatedCount: related.length,
        enoughData,
        score: enoughData ? Math.min(100, Math.round((related.length / 10) * 100)) : 0,
      };
    });
  }, [goals, history]);

  return (
    <div className="flex h-screen bg-[var(--color-toss-gray-50)] text-[var(--color-toss-gray-900)] overflow-hidden">
      {!isRegistered && <Onboarding onComplete={handleOnboardingComplete} />}

      <Sidebar
        history={history}
        goals={goals}
        selectedGoalNumber={selectedGoalNumber}
        activeLogId={activeLogId}
        onDeleteGoal={handleDeleteGoal}
        onSelectGoal={handleSelectGoal}
        onSelectDiary={handleSelectDiary}
        onOpenGoalPanel={() => setIsGoalPanelOpen(true)}
        onNavigate={setActiveView}
        activeView={activeView}
      />

      <div className="flex-1 flex flex-col min-w-0 bg-white shadow-inner">
        <header className="px-8 py-6 flex items-center justify-between border-b border-[var(--color-toss-gray-100)] bg-white/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[var(--color-toss-blue)] rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg">E</div>
            <div>
              <h1 className="text-xl font-black text-[var(--color-toss-blue)]">Egogo Mirror</h1>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Self-Data Intelligence</p>
            </div>
          </div>
          <div className={`px-4 py-2 rounded-2xl flex items-center gap-2 border ${lazinessScore >= 80 ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'}`}>
            <div className={`w-2 h-2 rounded-full ${lazinessScore >= 80 ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`} />
            <span className={`text-xs font-black uppercase tracking-widest ${lazinessScore >= 80 ? 'text-red-600' : 'text-green-600'}`}>
              Debt Level: {lazinessScore}
            </span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 lg:p-8 custom-scrollbar bg-[var(--color-toss-gray-50)]">
          <div className="max-w-6xl mx-auto h-full">
            {activeView === 'chat' ? (
              <SplitView
                apiBase={API_BASE}
                userId={user?.id}
                activeLogId={activeLogId}
                initialMessages={currentMessages}
                selectedGoalNumber={selectedGoalNumber}
                selectedGoalTitle={selectedGoalNumber ? goals[selectedGoalNumber - 1] : ''}
                onHistoryUpdate={addToHistory}
                goals={goals}
                onScoreUpdate={setLazinessScore}
                lazinessScore={lazinessScore}
              />
            ) : (
              <MyPage user={user} goalStats={goalStats} onLogout={handleLogout} />
            )}
          </div>
        </main>
      </div>

      <AnimatePresence>
        {isGoalPanelOpen && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-start justify-center px-6 pt-24"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ opacity: 0, y: -24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.98 }}
              className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-[var(--color-toss-gray-100)] p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-black">새로운 나침반 추가</h3>
                  <p className="text-sm text-[var(--color-toss-gray-600)] mt-1">목표는 전체 화면에서 입력하고, 사이드바에서는 바로 대화로 이어집니다.</p>
                </div>
                <button onClick={() => setIsGoalPanelOpen(false)} className="p-2 bg-[var(--color-toss-gray-100)] rounded-full">
                  <X size={18} />
                </button>
              </div>
              <input
                autoFocus
                className="w-full toss-input mb-5"
                placeholder="예: 매일 만보 걷기"
                value={newGoalTitle}
                onChange={(e) => setNewGoalTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddGoal()}
              />
              <button onClick={handleAddGoal} disabled={!newGoalTitle.trim()} className="w-full toss-button-primary disabled:opacity-40">
                나침반 확정하기
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
