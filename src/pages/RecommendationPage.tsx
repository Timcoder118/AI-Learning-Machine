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
  recommendation_score?: number;
}

interface RecommendationStats {
  totalRecommended: number;
  readRate: number;
  avgScore: number;
  topTags: Array<{ tag: string; count: number }>;
  platformDistribution: Array<{ platform: string; count: number }>;
}

/**
 * 智能推荐页面
 */
export const RecommendationPage: React.FC = () => {
  const navigate = useNavigate();
  const [recommendedContents, setRecommendedContents] = useState<Content[]>([]);
  const [stats, setStats] = useState<RecommendationStats | null>(null);
  const [loading, setLoading] = useState(false);
  // const [preferences, setPreferences] = useState({
  //   keywords: [] as string[],
  //   platforms: [] as string[],
  //   contentType: [] as string[],
  //   minPriority: 1,
  //   maxReadTime: 30
  // });

  const [showPreferences, setShowPreferences] = useState(false);
  const [userPreferences, setUserPreferences] = useState({
    categories: {
      'AI大模型前沿技术': 0.4,
      'AI行业终端应用': 0.35,
      'AI变现': 0.25
    },
    platforms: {
      'wechat': 0.6,
      'bilibili': 0.2,
      'youtube': 0.1,
      'weibo': 0.1
    }
  });

  // 获取推荐内容
  const fetchRecommendedContents = async () => {
    try {
      setLoading(true);
      console.log('正在获取推荐内容...');
      
      // 调用后端推荐API
      const response = await fetch(`${API_ENDPOINTS.RECOMMENDATION}?limit=20`);
      console.log('响应状态:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('获取到的内容数据:', data);
      
      if (data.success) {
        const recommended = data.data.items || [];
        setRecommendedContents(recommended);
        calculateStats(recommended);
        console.log('推荐内容更新成功，共', recommended.length, '条推荐');
      } else {
        console.error('API返回错误:', data.error);
        alert('获取推荐内容失败: ' + data.error);
      }
    } catch (error) {
      console.error('获取推荐内容失败:', error);
      alert('获取推荐内容失败，请检查后端服务是否启动: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // 计算推荐分数 - 已移至后端推荐算法

  // 计算推荐统计
  const calculateStats = (contents: Content[]) => {
    const totalRecommended = contents.length;
    const readCount = contents.filter(c => c.is_read).length;
    const readRate = totalRecommended > 0 ? (readCount / totalRecommended) * 100 : 0;
    const avgScore = totalRecommended > 0 ? 
      contents.reduce((sum, c) => sum + (c.recommendation_score || 0), 0) / totalRecommended : 0;
    
    // 统计标签
    const tagCounts: { [key: string]: number } = {};
    contents.forEach(content => {
      if (content.tags) {
        content.tags.split(',').forEach(tag => {
          const cleanTag = tag.trim();
          if (cleanTag) {
            tagCounts[cleanTag] = (tagCounts[cleanTag] || 0) + 1;
          }
        });
      }
    });
    
    const topTags = Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    // 统计平台分布
    const platformCounts: { [key: string]: number } = {};
    contents.forEach(content => {
      platformCounts[content.platform] = (platformCounts[content.platform] || 0) + 1;
    });
    
    const platformDistribution = Object.entries(platformCounts)
      .map(([platform, count]) => ({ platform, count }))
      .sort((a, b) => b.count - a.count);
    
    setStats({
      totalRecommended,
      readRate: Math.round(readRate),
      avgScore: Math.round(avgScore),
      topTags,
      platformDistribution
    });
  };

  // 标记为已读
  const markAsRead = async (id: number) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.CONTENT}/${id}/read`, {
        method: 'PATCH',
      });

      const data = await response.json();
      if (data.success) {
        // 记录用户行为
        await recordUserBehavior(id, 'read', 1);
        fetchRecommendedContents();
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
        // 记录用户行为
        await recordUserBehavior(id, 'bookmark', data.data.is_bookmarked ? 1 : -1);
        fetchRecommendedContents();
      } else {
        alert(`操作失败: ${data.error}`);
      }
    } catch (error) {
      console.error('切换收藏失败:', error);
      alert('操作失败');
    }
  };

  // 记录用户行为
  const recordUserBehavior = async (contentId: number, actionType: string, actionValue: number = 1) => {
    try {
      await fetch(`${API_ENDPOINTS.RECOMMENDATION}/behavior`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: 'default',
          contentId,
          actionType,
          actionValue
        })
      });
    } catch (error) {
      console.error('记录用户行为失败:', error);
    }
  };

  // 处理标题点击
  const handleTitleClick = (content: Content) => {
    // 记录点击行为
    recordUserBehavior(content.id, 'click', 1);
    
    // 如果是模拟链接，显示提示
    if (content.url.startsWith('#')) {
      alert(`这是模拟内容：${content.title}\n\n在实际应用中，这里会链接到真实的微信公众号文章。\n\n博主：${content.creator_name}\n阅读量：${content.view_count}\n发布时间：${formatDate(content.publish_time)}`);
      return;
    }
    
    // 如果是真实链接，直接打开
    window.open(content.url, '_blank', 'noopener,noreferrer');
  };

  // 保存用户偏好
  const saveUserPreferences = async () => {
    try {
      await fetch(`${API_ENDPOINTS.RECOMMENDATION}/preferences`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: 'default',
          preferences: userPreferences
        })
      });
      
      setShowPreferences(false);
      alert('偏好设置已保存');
      fetchRecommendedContents(); // 重新获取推荐
    } catch (error) {
      console.error('保存用户偏好失败:', error);
      alert('保存失败');
    }
  };

  useEffect(() => {
    fetchRecommendedContents();
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

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
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
            <h1 className="text-3xl font-bold text-gray-900">智能推荐</h1>
            <p className="text-gray-600 mt-2">基于您的偏好和阅读习惯的个性化推荐</p>
          </div>
          <div className="flex gap-3">
            <Button 
              onClick={() => setShowPreferences(true)}
              variant="secondary"
            >
              偏好设置
            </Button>
            <Button 
              onClick={fetchRecommendedContents}
              variant="secondary"
            >
              刷新推荐
            </Button>
          </div>
        </div>

        {/* 推荐统计 */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-600">{stats.totalRecommended}</div>
                <div className="text-sm text-gray-600">推荐内容</div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.readRate}%</div>
                <div className="text-sm text-gray-600">阅读率</div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{stats.avgScore}</div>
                <div className="text-sm text-gray-600">平均分数</div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{stats.topTags.length}</div>
                <div className="text-sm text-gray-600">热门标签</div>
              </div>
            </Card>
          </div>
        )}

        {/* 推荐算法说明 */}
        <Card className="p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">推荐算法说明</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">评分因素：</h4>
              <ul className="space-y-1">
                <li>• 内容优先级 (权重: 20%)</li>
                <li>• 发布时间新鲜度 (权重: 30%)</li>
                <li>• 平台偏好 (权重: 25%)</li>
                <li>• 内容类型 (权重: 15%)</li>
                <li>• 用户行为 (权重: 10%)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">个性化策略：</h4>
              <ul className="space-y-1">
                <li>• 未读内容优先推荐</li>
                <li>• 收藏内容加权推荐</li>
                <li>• 基于标签偏好学习</li>
                <li>• 平台使用习惯分析</li>
                <li>• 阅读时间模式识别</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* 推荐内容列表 */}
        <div className="space-y-4">
          {recommendedContents.map((content) => (
            <Card key={content.id} className="p-6">
              <div className="flex items-start space-x-4">
                {/* 推荐分数 */}
                <div className="flex-shrink-0">
                  <div className={`text-center ${getScoreColor(content.recommendation_score || 0)}`}>
                    <div className="text-2xl font-bold">{content.recommendation_score || 0}</div>
                    <div className="text-xs">推荐分数</div>
                  </div>
                </div>

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
                        {content.tags.split(',').slice(0, 3).map((tag, index) => (
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

        {recommendedContents.length === 0 && !loading && (
          <Card className="p-8 text-center">
            <div className="text-4xl mb-4">⭐</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">暂无推荐内容</h3>
            <p className="text-gray-600 mb-4">请先添加博主并抓取内容，系统将基于您的偏好生成个性化推荐</p>
            <div className="flex gap-3 justify-center">
              <Button 
                onClick={() => navigate('/creators')}
                className="bg-primary-600 hover:bg-primary-700"
              >
                添加博主
              </Button>
              <Button 
                onClick={() => navigate('/content')}
                variant="secondary"
              >
                查看内容
              </Button>
            </div>
          </Card>
        )}

        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p className="text-gray-600 mt-2">正在生成推荐...</p>
          </div>
        )}

        {/* 偏好设置模态框 */}
        {showPreferences && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">偏好设置</h2>
                <button 
                  onClick={() => setShowPreferences(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                {/* 内容分类偏好 */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">内容分类偏好</h3>
                  <div className="space-y-3">
                    {Object.entries(userPreferences.categories).map(([category, weight]) => (
                      <div key={category} className="flex items-center justify-between">
                        <label className="text-gray-700">{category}</label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={weight}
                            onChange={(e) => setUserPreferences(prev => ({
                              ...prev,
                              categories: {
                                ...prev.categories,
                                [category]: parseFloat(e.target.value)
                              }
                            }))}
                            className="w-32"
                          />
                          <span className="text-sm text-gray-600 w-12">
                            {Math.round(weight * 100)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 平台偏好 */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">平台偏好</h3>
                  <div className="space-y-3">
                    {Object.entries(userPreferences.platforms).map(([platform, weight]) => (
                      <div key={platform} className="flex items-center justify-between">
                        <label className="text-gray-700 capitalize">{platform}</label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={weight}
                            onChange={(e) => setUserPreferences(prev => ({
                              ...prev,
                              platforms: {
                                ...prev.platforms,
                                [platform]: parseFloat(e.target.value)
                              }
                            }))}
                            className="w-32"
                          />
                          <span className="text-sm text-gray-600 w-12">
                            {Math.round(weight * 100)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 推荐算法说明 */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">推荐算法说明</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    系统会根据您的偏好设置和阅读行为，综合以下因素进行推荐：
                  </p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• 内容分类偏好（40%）</li>
                    <li>• 发布时间新鲜度（20%）</li>
                    <li>• 平台偏好（15%）</li>
                    <li>• 用户行为历史（15%）</li>
                    <li>• 标签相关性（10%）</li>
                  </ul>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <Button 
                  onClick={() => setShowPreferences(false)}
                  variant="ghost"
                >
                  取消
                </Button>
                <Button onClick={saveUserPreferences}>
                  保存设置
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
