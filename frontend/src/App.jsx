import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import SplitView from './components/SplitView';
import Onboarding from './components/Onboarding';

function App() {
  const [isRegistered, setIsRegistered] = useState(false);
  const [history, setHistory] = useState([]);
  const [goals, setGoals] = useState(Array(3).fill(''));
  
  useEffect(() => {
    const saved = localStorage.getItem('ego_mirror_registered');
    if (saved) setIsRegistered(true);
    
    // Initial history mock with distinct timestamps for diary grouping demo
    setHistory([
      { id: 1, date: new Date().toLocaleDateString(), type: 'chat', content: '오늘 나의 소비 습관은 어땠어?', timestamp: Date.now() - 86400000 },
      { id: 2, date: new Date().toLocaleDateString(), type: 'feedback', content: '커피 지출이 평소보다 20% 많았습니다.', timestamp: Date.now() - 86400000 + 1000 },
      { id: 3, date: new Date().toLocaleDateString(), type: 'chat', content: '내일 일정에 대해 조언해줘', timestamp: Date.now() }
    ]);
  }, []);

  const handleOnboardingComplete = (answers) => {
    localStorage.setItem('ego_mirror_registered', 'true');
    setIsRegistered(true);
  };

  const addToHistory = (item) => {
    setHistory(prev => [{ ...item, timestamp: Date.now() }, ...prev]);
  };

  const handleUpdateGoal = (index, newValue) => {
    const newGoals = [...goals];
    newGoals[index] = newValue;
    setGoals(newGoals);
  };

  const handleAddGoal = () => {
    if (goals.length < 10) setGoals([...goals, '']);
  };

  const handleDeleteGoal = (index) => {
    if (goals.length > 3) setGoals(goals.filter((_, i) => i !== index));
  };

  return (
    <div className="flex h-screen bg-[var(--color-toss-gray-50)] text-[var(--color-toss-gray-900)] overflow-hidden">
      {!isRegistered && <Onboarding onComplete={handleOnboardingComplete} />}
      
      {/* Sidebar - Left (Includes Goals and Diary) */}
      <Sidebar 
        history={history} 
        goals={goals} 
        onUpdateGoal={handleUpdateGoal}
        onAddGoal={handleAddGoal}
        onDeleteGoal={handleDeleteGoal}
      />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        <header className="px-8 py-6 flex items-center justify-between border-b border-[var(--color-toss-gray-100)] bg-white/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[var(--color-toss-blue)] rounded-xl flex items-center justify-center text-white font-black text-lg">M</div>
            <h1 className="text-xl font-bold tracking-tight">Ego Mirror Diary</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs font-semibold text-[var(--color-toss-gray-600)] bg-[var(--color-toss-gray-100)] px-3 py-1.5 rounded-full">Personal Assistant</span>
          </div>
        </header>
        
        <main className="flex-1 overflow-y-auto p-8 lg:p-12 custom-scrollbar">
          <div className="max-w-4xl mx-auto h-full">
            <SplitView 
              onHistoryUpdate={addToHistory} 
              goals={goals}
            />
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
