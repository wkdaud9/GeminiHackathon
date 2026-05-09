import React, { useState } from 'react';
import SplitView from './components/SplitView';

function App() {
  return (
    <div className="min-h-screen bg-[var(--color-dark-bg)] text-white p-4 md:p-8 flex flex-col items-center">
      <header className="mb-8 text-center">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-2">
          Ego<span className="neon-text">-Mirror</span>
        </h1>
        <p className="text-gray-400 text-sm md:text-base">자아 데이터 기반 의사결정 에이전트</p>
      </header>
      
      <main className="w-full max-w-6xl flex-grow flex flex-col">
        <SplitView />
      </main>
    </div>
  );
}

export default App;
