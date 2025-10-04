import React from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * 首页组件
 * 显示概览信息、最新内容和推荐博主
 */
export const HomePage: React.FC = () => {
  const navigate = useNavigate();

  const handleStartUsing = () => {
    alert('欢迎使用AI知识聚合平台！\n\n请先添加您关注的博主，然后开始智能抓取内容。\n\n功能说明：\n1. 添加博主 - 支持Bilibili、YouTube、微博、微信公众号\n2. 内容聚合 - 自动抓取最新内容\n3. 智能推荐 - 基于您的偏好推荐相关内容');
  };

  const handleAddCreator = () => {
    navigate('/creators');
  };

  const handleFeatureClick = (feature: string) => {
    if (feature === '博主管理') {
      navigate('/creators');
      return;
    }
    
    if (feature === '内容聚合') {
      navigate('/content');
      return;
    }
    
    if (feature === '智能推荐') {
      navigate('/recommendation');
      return;
    }
    
    alert('功能开发中...');
  };

  const handlePlatformClick = (platform: string) => {
    const messages = {
      'Bilibili': 'Bilibili支持\n\n• 获取UP主最新视频\n• 支持播放量、点赞数统计\n• 自动提取视频标签\n• 智能内容过滤',
      '微信公众号': '微信公众号支持\n\n• 搜索公众号文章\n• 获取最新发布内容\n• 支持文章摘要提取\n• 智能关键词匹配',
      '微博': '微博支持\n\n• 获取用户最新微博\n• 支持文本和图片内容\n• 实时动态监控\n• 智能内容分析',
      'YouTube': 'YouTube支持\n\n• 获取频道最新视频\n• 支持观看次数统计\n• 自动提取视频信息\n• 智能推荐排序'
    };
    alert(messages[platform as keyof typeof messages] || '平台支持开发中...');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* 欢迎信息 */}
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          🎉 欢迎使用AI知识聚合平台
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          智能追踪AI行业最新动态，让知识触手可及
        </p>
      </div>

      {/* 功能卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div 
          className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6 text-center cursor-pointer hover:shadow-medium transition-shadow"
          onClick={() => handleFeatureClick('博主管理')}
        >
          <div className="text-4xl mb-4">👥</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">博主管理</h3>
          <p className="text-gray-600">添加和管理您关注的AI博主</p>
        </div>
        
        <div 
          className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6 text-center cursor-pointer hover:shadow-medium transition-shadow"
          onClick={() => handleFeatureClick('内容聚合')}
        >
          <div className="text-4xl mb-4">📰</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">内容聚合</h3>
          <p className="text-gray-600">自动收集和整理最新内容</p>
        </div>
        
        <div 
          className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6 text-center cursor-pointer hover:shadow-medium transition-shadow"
          onClick={() => handleFeatureClick('智能推荐')}
        >
          <div className="text-4xl mb-4">⭐</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">智能推荐</h3>
          <p className="text-gray-600">基于偏好的个性化推荐</p>
        </div>
      </div>

      {/* 平台支持 */}
      <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">支持的平台</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div 
            className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
            onClick={() => handlePlatformClick('Bilibili')}
          >
            <span className="text-2xl">🎬</span>
            <span className="font-medium">Bilibili</span>
          </div>
          <div 
            className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
            onClick={() => handlePlatformClick('微信公众号')}
          >
            <span className="text-2xl">💬</span>
            <span className="font-medium">微信公众号</span>
          </div>
          <div 
            className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
            onClick={() => handlePlatformClick('微博')}
          >
            <span className="text-2xl">📱</span>
            <span className="font-medium">微博</span>
          </div>
          <div 
            className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
            onClick={() => handlePlatformClick('YouTube')}
          >
            <span className="text-2xl">📺</span>
            <span className="font-medium">YouTube</span>
          </div>
        </div>
      </div>

      {/* 快速开始 */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-700 rounded-2xl shadow-soft p-8 text-white text-center">
        <h2 className="text-2xl font-bold mb-4">开始使用</h2>
        <p className="text-primary-100 mb-6">
          添加您关注的博主，开始智能追踪AI行业动态
        </p>
        <div className="space-y-3">
          <button 
            className="bg-white text-primary-600 px-6 py-3 rounded-xl font-medium hover:bg-gray-100 transition-colors block mx-auto"
            onClick={handleStartUsing}
          >
            开始使用
          </button>
          <button 
            className="bg-white/20 text-white px-6 py-3 rounded-xl font-medium hover:bg-white/30 transition-colors block mx-auto"
            onClick={handleAddCreator}
          >
            添加第一个博主
          </button>
        </div>
      </div>
      </div>
    </div>
  );
};
