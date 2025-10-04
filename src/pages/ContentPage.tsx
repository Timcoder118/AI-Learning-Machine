import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui';
import { Button } from '@/components/ui';
import { API_ENDPOINTS } from '@/config/api';

interface Content {
  id: number;
  title: string;
  description: string;
  url: string;
  thumbnail?: string;
  platform: string;
  creator_id: number;
  creator_name: string;
  content_type: string;
  publish_time: string;
  read_time?: number;
  view_count?: number;
  tags?: string;
  is_read: boolean;
  is_bookmarked: boolean;
  is_recommended: boolean;
  priority: number;
  summary?: string;
  created_at: string;
}

/**
 * 内容聚合页面
 */
interface ContentStats {
  total: number;
  read: number;
  bookmarked: number;
  recommended: number;
}

export const ContentPage: React.FC = () => {
  const navigate = useNavigate();
  const [contents, setContents] = useState<Content[]>([]);
  const [loading, setLoading] = useState(false);
  const [scraping, setScraping] = useState(false);
  const [stats, setStats] = useState<ContentStats>({ total: 0, read: 0, bookmarked: 0, recommended: 0 });

  // 获取内容列表
  const fetchContents = async () => {
    try {
      setLoading(true);
      console.log('正在获取内容列表...');
      const response = await fetch(API_ENDPOINTS.CONTENT);
      console.log('响应状态:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('获取到的内容数据:', data);
      
      if (data.success) {
        setContents(data.data.items || []);
        console.log('内容列表更新成功，共', data.data.items?.length || 0, '条内容');
        
        // 计算统计信息
        const items = data.data.items || [];
        const newStats = {
          total: items.length,
          read: items.filter((item: Content) => item.is_read).length,
          bookmarked: items.filter((item: Content) => item.is_bookmarked).length,
          recommended: items.filter((item: Content) => item.is_recommended).length
        };
        setStats(newStats);
      } else {
        console.error('API返回错误:', data.error);
        alert('获取内容列表失败: ' + data.error);
      }
    } catch (error) {
      console.error('获取内容列表失败:', error);
      alert('获取内容列表失败，请检查后端服务是否启动: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // 手动触发抓取
  const triggerScraping = async () => {
    try {
      setScraping(true);
      console.log('正在触发内容抓取...');
      
      const response = await fetch(`${API_ENDPOINTS.SCRAPE}/trigger`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('抓取响应状态:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('抓取响应数据:', data);
      
      if (data.success) {
        alert('内容抓取已启动！请稍等片刻后刷新页面查看结果。');
        // 等待一段时间后自动刷新
        setTimeout(() => {
          fetchContents();
        }, 5000);
      } else {
        alert(`抓取失败: ${data.error}`);
      }
    } catch (error) {
      console.error('触发抓取失败:', error);
      alert('触发抓取失败，请检查后端服务是否启动: ' + (error as Error).message);
    } finally {
      setScraping(false);
    }
  };

  // 标记为已读
  const markAsRead = async (id: number) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.CONTENT}/${id}/read`, {
        method: 'PATCH',
      });

      const data = await response.json();
      if (data.success) {
        fetchContents();
      } else {
        alert(`操作失败: ${data.error}`);
      }
    } catch (error) {
      console.error('标记已读失败:', error);
      alert('操作失败');
    }
  };

  // 切换收藏状态
  const toggleBookmark = async (id: number) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.CONTENT}/${id}/bookmark`, {
        method: 'PATCH',
      });

      const data = await response.json();
      if (data.success) {
        fetchContents();
      } else {
        alert(`操作失败: ${data.error}`);
      }
    } catch (error) {
      console.error('切换收藏失败:', error);
      alert('操作失败');
    }
  };

  // 处理标题点击
  const handleTitleClick = (content: Content) => {
    // 如果是模拟链接，显示提示
    if (content.url.startsWith('#')) {
      alert(`这是模拟内容：${content.title}\n\n在实际应用中，这里会链接到真实的微信公众号文章。\n\n博主：${content.creator_name}\n阅读量：${content.view_count}\n发布时间：${formatDate(content.publish_time)}`);
      return;
    }
    
    // 如果是真实链接，直接打开
    window.open(content.url, '_blank', 'noopener,noreferrer');
  };

  useEffect(() => {
    fetchContents();
  }, []);

  const getPlatformIcon = (platform: string) => {
    const icons = {
      bilibili: '🎬',
      youtube: '📺',
      weibo: '📱',
      wechat: '💬'
    };
    return icons[platform as keyof typeof icons] || '📄';
  };

  const getPlatformName = (platform: string) => {
    const names = {
      bilibili: 'Bilibili',
      youtube: 'YouTube',
      weibo: '微博',
      wechat: '微信公众号'
    };
    return names[platform as keyof typeof names] || platform;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 返回按钮 */}
        <div className="mb-6">
          <Button 
            onClick={() => navigate('/')}
            variant="ghost"
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
          >
            <span>←</span>
            <span>返回首页</span>
          </Button>
        </div>

        {/* 页面标题 */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">内容聚合</h1>
            <p className="text-gray-600 mt-2">查看和管理抓取的内容</p>
          </div>
          <div className="flex gap-3">
            <Button 
              onClick={triggerScraping}
              disabled={scraping}
              className="bg-primary-600 hover:bg-primary-700"
            >
              {scraping ? '抓取中...' : '手动抓取'}
            </Button>
            <Button 
              onClick={fetchContents}
              variant="secondary"
            >
              刷新
            </Button>
          </div>
        </div>

        {/* 内容统计 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600">{stats.total}</div>
              <div className="text-sm text-gray-600">总内容</div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.read}</div>
              <div className="text-sm text-gray-600">已读</div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.bookmarked}</div>
              <div className="text-sm text-gray-600">收藏</div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.recommended}</div>
              <div className="text-sm text-gray-600">推荐</div>
            </div>
          </Card>
        </div>

        {/* 内容列表 */}
        <div className="space-y-4">
          {contents.map((content) => (
            <Card key={content.id} className="p-6">
              <div className="flex items-start space-x-4">
                {/* 缩略图 */}
                <div className="flex-shrink-0">
                  {content.thumbnail ? (
                    <img 
                      src={content.thumbnail} 
                      alt={content.title}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                      <span className="text-2xl">{getPlatformIcon(content.platform)}</span>
                    </div>
                  )}
                </div>

                {/* 内容信息 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        <span 
                          className="hover:text-primary-600 hover:underline transition-colors cursor-pointer"
                          onClick={() => handleTitleClick(content)}
                        >
                          {content.title}
                        </span>
                      </h3>
                      {content.description && (
                        <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                          {content.description}
                        </p>
                      )}
                      {content.summary && (
                        <p className="text-gray-500 text-xs mb-2">
                          {content.summary}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        onClick={() => markAsRead(content.id)}
                        variant={content.is_read ? "secondary" : "primary"}
                        size="sm"
                      >
                        {content.is_read ? '已读' : '标记已读'}
                      </Button>
                      <Button
                        onClick={() => toggleBookmark(content.id)}
                        variant={content.is_bookmarked ? "primary" : "ghost"}
                        size="sm"
                      >
                        {content.is_bookmarked ? '已收藏' : '收藏'}
                      </Button>
                    </div>
                  </div>

                  {/* 元信息 */}
                  <div className="flex items-center space-x-4 text-xs text-gray-500 mt-3">
                    <div className="flex items-center space-x-1">
                      <span>{getPlatformIcon(content.platform)}</span>
                      <span>{getPlatformName(content.platform)}</span>
                    </div>
                    <div>博主: {content.creator_name}</div>
                    <div>发布时间: {formatDate(content.publish_time)}</div>
                    {content.read_time && <div>阅读时间: {content.read_time}分钟</div>}
                    {content.view_count && <div>阅读量: {content.view_count}</div>}
                    {content.tags && (
                      <div className="flex items-center space-x-1">
                        <span>标签:</span>
                        {content.tags.split(',').map((tag, index) => (
                          <span key={index} className="px-1 py-0.5 bg-gray-100 rounded text-xs">
                            {tag.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              </div>
            </Card>
          ))}
        </div>

        {contents.length === 0 && !loading && (
          <Card className="p-8 text-center">
            <div className="text-4xl mb-4">📰</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">还没有抓取到内容</h3>
            <p className="text-gray-600 mb-4">点击"手动抓取"按钮开始抓取您关注的博主内容</p>
            <Button 
              onClick={triggerScraping}
              disabled={scraping}
              className="bg-primary-600 hover:bg-primary-700"
            >
              {scraping ? '抓取中...' : '开始抓取'}
            </Button>
          </Card>
        )}

        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p className="text-gray-600 mt-2">加载中...</p>
          </div>
        )}
      </div>
    </div>
  );
};
