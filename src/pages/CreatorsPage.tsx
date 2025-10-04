import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui';
import { API_ENDPOINTS } from '@/config/api';

interface Creator {
  id: number;
  name: string;
  platform: string;
  platform_id: string;
  avatar?: string;
  description?: string;
  followers?: number;
  is_active: boolean;
  tags?: string;
  url?: string;
  created_at: string;
}

/**
 * 博主管理页面
 */
export const CreatorsPage: React.FC = () => {
  const navigate = useNavigate();
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCreator, setNewCreator] = useState({
    name: '',
    platform: 'bilibili',
    platform_id: '',
    description: '',
    tags: ''
  });

  // 获取博主列表
  const fetchCreators = async () => {
    try {
      setLoading(true);
      console.log('正在获取博主列表...');
      const response = await fetch(API_ENDPOINTS.CREATORS);
      console.log('响应状态:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('获取到的数据:', data);
      
      if (data.success) {
        setCreators(data.data);
        console.log('博主列表更新成功，共', data.data.length, '个博主');
      } else {
        console.error('API返回错误:', data.error);
        alert('获取博主列表失败: ' + data.error);
      }
    } catch (error) {
      console.error('获取博主列表失败:', error);
      alert('获取博主列表失败，请检查后端服务是否启动: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // 添加博主
  const addCreator = async () => {
    if (!newCreator.name || !newCreator.platform_id) {
      alert('请填写博主名称和平台ID');
      return;
    }

    try {
      setLoading(true);
      console.log('正在添加博主:', newCreator);
      
      const response = await fetch(API_ENDPOINTS.CREATORS, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newCreator),
      });

      console.log('添加博主响应状态:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('添加博主响应数据:', data);
      
      if (data.success) {
        alert('添加博主成功！');
        setNewCreator({ name: '', platform: 'bilibili', platform_id: '', description: '', tags: '' });
        setShowAddForm(false);
        // 立即刷新列表
        await fetchCreators();
      } else {
        alert(`添加失败: ${data.error}`);
      }
    } catch (error) {
      console.error('添加博主失败:', error);
      alert('添加博主失败，请检查后端服务是否启动: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // 删除博主
  const deleteCreator = async (id: number) => {
    if (!confirm('确定要删除这个博主吗？这将同时删除相关的所有内容。')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:3001/api/creators/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        alert('删除博主成功！');
        fetchCreators();
      } else {
        alert(`删除失败: ${data.error}`);
      }
    } catch (error) {
      console.error('删除博主失败:', error);
      alert('删除博主失败');
    }
  };

  // 切换激活状态
  const toggleActive = async (id: number) => {
    try {
      const response = await fetch(`http://localhost:3001/api/creators/${id}/toggle-active`, {
        method: 'PATCH',
      });

      const data = await response.json();
      if (data.success) {
        fetchCreators();
      } else {
        alert(`操作失败: ${data.error}`);
      }
    } catch (error) {
      console.error('切换状态失败:', error);
      alert('操作失败');
    }
  };

  useEffect(() => {
    fetchCreators();
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
            <h1 className="text-3xl font-bold text-gray-900">博主管理</h1>
            <p className="text-gray-600 mt-2">管理您关注的AI博主，自动抓取最新内容</p>
          </div>
          <Button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-primary-600 hover:bg-primary-700"
          >
            {showAddForm ? '取消添加' : '添加博主'}
          </Button>
        </div>

      {/* 添加博主表单 */}
      {showAddForm && (
        <Card className="p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">添加新博主</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">博主名称</label>
              <Input
                value={newCreator.name}
                onChange={(value) => setNewCreator({ ...newCreator, name: value })}
                placeholder="请输入博主名称"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">平台</label>
              <select
                value={newCreator.platform}
                onChange={(e) => setNewCreator({ ...newCreator, platform: e.target.value })}
                className="input"
              >
                <option value="bilibili">Bilibili</option>
                <option value="youtube">YouTube</option>
                <option value="weibo">微博</option>
                <option value="wechat">微信公众号</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">平台ID</label>
              <Input
                value={newCreator.platform_id}
                onChange={(value) => setNewCreator({ ...newCreator, platform_id: value })}
                placeholder="请输入平台ID"
              />
              <p className="text-xs text-gray-500 mt-1">
                {newCreator.platform === 'bilibili' && 'Bilibili UP主ID，如：15627787'}
                {newCreator.platform === 'youtube' && 'YouTube频道ID，如：UCXZCJLdBC09xxGZ6gcdrc6A'}
                {newCreator.platform === 'weibo' && '微博用户ID，如：1234567890'}
                {newCreator.platform === 'wechat' && '微信公众号名称，如：机器之心'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">标签</label>
              <Input
                value={newCreator.tags}
                onChange={(value) => setNewCreator({ ...newCreator, tags: value })}
                placeholder="用逗号分隔，如：AI,机器学习,深度学习"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">描述</label>
              <textarea
                value={newCreator.description}
                onChange={(e) => setNewCreator({ ...newCreator, description: e.target.value })}
                placeholder="请输入博主描述"
                className="input"
                rows={3}
              />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <Button 
              onClick={addCreator}
              disabled={loading}
              className="bg-primary-600 hover:bg-primary-700"
            >
              {loading ? '添加中...' : '添加博主'}
            </Button>
            <Button 
              onClick={() => setShowAddForm(false)}
              variant="secondary"
            >
              取消
            </Button>
          </div>
        </Card>
      )}

      {/* 博主列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {creators.map((creator) => (
          <Card key={creator.id} className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="text-2xl">{getPlatformIcon(creator.platform)}</div>
                <div>
                  <h3 className="font-semibold text-gray-900">{creator.name}</h3>
                  <p className="text-sm text-gray-600">{getPlatformName(creator.platform)}</p>
                </div>
              </div>
              <div className={`w-3 h-3 rounded-full ${creator.is_active ? 'bg-green-500' : 'bg-gray-400'}`} />
            </div>

            {creator.description && (
              <p className="text-sm text-gray-600 mb-3">{creator.description}</p>
            )}

            {creator.tags && (
              <div className="flex flex-wrap gap-1 mb-3">
                {creator.tags.split(',').map((tag, index) => (
                  <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                    {tag.trim()}
                  </span>
                ))}
              </div>
            )}

            <div className="text-xs text-gray-500 mb-4">
              <p>平台ID: {creator.platform_id}</p>
              {creator.followers && <p>关注者: {creator.followers.toLocaleString()}</p>}
              <p>添加时间: {new Date(creator.created_at).toLocaleDateString('zh-CN')}</p>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => toggleActive(creator.id)}
                variant={creator.is_active ? "secondary" : "primary"}
                size="sm"
              >
                {creator.is_active ? '停用' : '启用'}
              </Button>
              <Button
                onClick={() => deleteCreator(creator.id)}
                variant="ghost"
                size="sm"
                className="text-red-600 hover:text-red-700"
              >
                删除
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {creators.length === 0 && !loading && (
        <Card className="p-8 text-center">
          <div className="text-4xl mb-4">👥</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">还没有添加博主</h3>
          <p className="text-gray-600 mb-4">添加您关注的AI博主，开始智能抓取内容</p>
          <Button 
            onClick={() => setShowAddForm(true)}
            className="bg-primary-600 hover:bg-primary-700"
          >
            添加第一个博主
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
