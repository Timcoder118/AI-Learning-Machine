import { } from 'react';
import { Routes, Route } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { CreatorsPage } from './pages/CreatorsPage';
import { ContentPage } from './pages/ContentPage';
import { RecommendationPage } from './pages/RecommendationPage';

/**
 * 主应用组件
 * 设置路由和整体布局
 */
function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <main>
             <Routes>
               <Route path="/" element={<HomePage />} />
               <Route path="/creators" element={<CreatorsPage />} />
               <Route path="/content" element={<ContentPage />} />
               <Route path="/recommendation" element={<RecommendationPage />} />
             </Routes>
      </main>
    </div>
  );
}

export default App;
