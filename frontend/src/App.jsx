import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import SplitView from './components/SplitView';
import Onboarding from './components/Onboarding';

function App() {
  const [userId, setUserId] = useState(null);
  const [history, setHistory] = useState([]);
  const [goals, setGoals] = useState(Array(3).fill(''));
  const [lazinessScore, setLazinessScore] = useState(50);
  
  useEffect(() => {
    const savedId = localStorage.getItem('ego_mirror_user_id');
    if (savedId) {
      setUserId(savedId);
      
      // 백엔드에서 사용자 정보(점수) 불러오기
      fetch(`http://localhost:8000/api/user?user_id=${savedId}`)
        .then(res => res.json())
        .then(data => {
          if (data.status === 'success' && data.data) {
            setLazinessScore(data.data.laziness_score || 50);
          }
        })
        .catch(err => console.error("Failed to fetch user:", err));

      // 백엔드에서 사용자 목표 불러오기
      fetch(`http://localhost:8000/api/goals?user_id=${savedId}`)
        .then(res => res.json())
        .then(data => {
          if (data.status === 'success' && data.data.length > 0) {
            const fetchedGoals = Array(10).fill('');
            let maxIndex = 2; // 최소 3칸 유지 (인덱스 2)
            data.data.forEach(g => {
               fetchedGoals[g.goal_number - 1] = g.title;
               if (g.goal_number - 1 > maxIndex) maxIndex = g.goal_number - 1;
            });
            setGoals(fetchedGoals.slice(0, maxIndex + 1));
          }
        })
        .catch(err => console.error("Failed to fetch goals:", err));

      // 백엔드에서 사용자 채팅 내역(다이어리) 불러오기
      fetch(`http://localhost:8000/api/chat/history?user_id=${savedId}`)
        .then(res => res.json())
        .then(data => {
          if (data.status === 'success' && data.data.length > 0) {
             const formattedHistory = data.data.map(msg => ({
                id: msg.id,
                date: new Date(msg.created_at).toLocaleDateString(),
                type: msg.role === 'user' ? 'chat' : 'feedback',
                content: msg.content,
                timestamp: new Date(msg.created_at).getTime()
             }));
             setHistory(formattedHistory.reverse());
          }
        })
        .catch(err => console.error("Failed to fetch history:", err));

    } else {
      // 로그인 안된 상태의 Mock Data
      setHistory([
        { id: 1, date: new Date().toLocaleDateString(), type: 'chat', content: '오늘 나의 소비 습관은 어땠어?', timestamp: Date.now() - 86400000 },
        { id: 2, date: new Date().toLocaleDateString(), type: 'feedback', content: '커피 지출이 평소보다 20% 많았습니다.', timestamp: Date.now() - 86400000 + 1000 },
        { id: 3, date: new Date().toLocaleDateString(), type: 'chat', content: '내일 일정에 대해 조언해줘', timestamp: Date.now() }
      ]);
    }
  }, []);

  const handleOnboardingComplete = (newUserId) => {
    localStorage.setItem('ego_mirror_user_id', newUserId);
    setUserId(newUserId);
    window.location.reload(); // 새 유저 데이터 로드를 위해 새로고침
  };

  const addToHistory = (item) => {
    setHistory(prev => [{ ...item, timestamp: Date.now() }, ...prev]);
  };

  const handleUpdateGoal = async (index, newValue) => {
    const newGoals = [...goals];
    newGoals[index] = newValue;
    setGoals(newGoals);

    // 백엔드에 목표 저장
    if (userId && newValue.trim() !== '') {
      try {
        await fetch('http://localhost:8000/api/goals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: userId,
            goal_number: index + 1,
            title: newValue,
            description: ''
          })
        });
      } catch (err) {
        console.error("Failed to save goal:", err);
      }
    }
  };

  const handleAddGoal = () => {
    if (goals.length < 10) setGoals([...goals, '']);
  };

  const handleDeleteGoal = async (index) => {
    if (goals.length > 3) {
      const newGoals = goals.filter((_, i) => i !== index);
      setGoals(newGoals);
    }
  };

  // 나태함 수치에 따른 배경색 클래스 (Ego-Debt 시각화)
  const isHighDebt = lazinessScore >= 80;
  const containerClass = isHighDebt 
    ? "flex h-screen bg-red-50 text-red-900 overflow-hidden transition-colors duration-1000" 
    : "flex h-screen bg-[var(--color-toss-gray-50)] text-[var(--color-toss-gray-900)] overflow-hidden transition-colors duration-1000";
    
  const headerClass = isHighDebt
    ? "px-8 py-6 flex items-center justify-between border-b border-red-200 bg-red-100/80 backdrop-blur-md sticky top-0 z-10 transition-colors duration-1000"
    : "px-8 py-6 flex items-center justify-between border-b border-[var(--color-toss-gray-100)] bg-white/80 backdrop-blur-md sticky top-0 z-10 transition-colors duration-1000";

  return (
    <div className={containerClass}>
      {!userId && <Onboarding onComplete={handleOnboardingComplete} />}
      
      {/* Sidebar - Left (Includes Goals and Diary) */}
      <Sidebar 
        history={history} 
        goals={goals} 
        onUpdateGoal={handleUpdateGoal}
        onAddGoal={handleAddGoal}
        onDeleteGoal={handleDeleteGoal}
      />
      
      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-w-0 ${isHighDebt ? 'bg-red-50' : 'bg-white'} transition-colors duration-1000`}>
        <header className={headerClass}>
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white font-black text-lg ${isHighDebt ? 'bg-red-600 animate-pulse' : 'bg-[var(--color-toss-blue)]'}`}>M</div>
            <h1 className="text-xl font-bold tracking-tight">Ego Mirror Diary</h1>
          </div>
          <div className="flex items-center gap-4">
            {isHighDebt && (
              <span className="text-xs font-bold text-red-600 bg-red-100 px-3 py-1.5 rounded-full animate-bounce">
                ⚠️ Ego-Debt 위험 수준 (나태함: {lazinessScore})
              </span>
            )}
            <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${isHighDebt ? 'text-red-700 bg-red-200' : 'text-[var(--color-toss-gray-600)] bg-[var(--color-toss-gray-100)]'}`}>Personal Assistant</span>
          </div>
        </header>
        
        <main className="flex-1 overflow-y-auto p-8 lg:p-12 custom-scrollbar">
          <div className="max-w-4xl mx-auto h-full">
            <SplitView 
              userId={userId}
              onHistoryUpdate={addToHistory} 
              goals={goals}
              onScoreUpdate={setLazinessScore}
              lazinessScore={lazinessScore}
            />
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
