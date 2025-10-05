import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '../ui';
import { Search, Settings, Bell, Menu, X } from 'lucide-react';

/**
 * 页面头部组件
 * 包含导航、搜索和用户操作功能
 */
export const Header: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const location = useLocation();

  // 临时硬编码数据，避免依赖store
  const unreadCount = 0;
  const bookmarkedCount = 0;

  const navigation = [
    { name: '首页', href: '/', icon: '🏠' },
    { name: '内容', href: '/content', icon: '📰' },
    { name: '博主', href: '/creators', icon: '👥' },
    { name: '推荐', href: '/recommendation', icon: '⭐' },
    { name: '统计', href: '/statistics', icon: '📊' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">AI</span>
              </div>
              <span className="text-xl font-bold text-gray-900">知识聚合</span>
            </Link>
          </div>

          {/* 桌面端导航 */}
          <nav className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.name}</span>
                {item.name === '内容' && unreadCount > 0 && (
                  <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                    {unreadCount}
                  </span>
                )}
                {item.name === '推荐' && bookmarkedCount > 0 && (
                  <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">
                    {bookmarkedCount}
                  </span>
                )}
              </Link>
            ))}
          </nav>

          {/* 搜索框 */}
          <div className="hidden lg:flex items-center flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="搜索内容、博主或标签..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* 用户操作 */}
          <div className="flex items-center space-x-4">
            <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <Bell className="w-5 h-5" />
            </button>
            
            <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <Settings className="w-5 h-5" />
            </button>

            {/* 移动端菜单按钮 */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* 移动端菜单 */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <nav className="space-y-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.name}</span>
                  {item.name === '内容' && unreadCount > 0 && (
                    <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                  {item.name === '推荐' && bookmarkedCount > 0 && (
                    <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">
                      {bookmarkedCount}
                    </span>
                  )}
                </Link>
              ))}
            </nav>
            
            {/* 移动端搜索 */}
            <div className="mt-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="搜索内容、博主或标签..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
