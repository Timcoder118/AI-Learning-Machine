const BilibiliScraper = require('./scrapers/bilibili');
const YouTubeScraper = require('./scrapers/youtube');

async function testScrapers() {
  console.log('🧪 开始测试抓取器...\n');
  
  // 测试Bilibili抓取器
  console.log('='.repeat(50));
  console.log('📺 测试Bilibili抓取器');
  console.log('='.repeat(50));
  
  try {
    const bilibiliScraper = new BilibiliScraper();
    const bilibiliVideos = await bilibiliScraper.getUserVideos('475013101', 3);
    
    console.log(`\n✅ Bilibili测试结果: 获取到 ${bilibiliVideos.length} 个视频`);
    
    if (bilibiliVideos.length > 0) {
      console.log('\n第一个视频详情:');
      const firstVideo = bilibiliVideos[0];
      console.log(`标题: ${firstVideo.title}`);
      console.log(`链接: ${firstVideo.url}`);
      console.log(`BV号: ${firstVideo.url.split('/').pop()}`);
      console.log(`发布时间: ${firstVideo.publishTime}`);
      console.log(`标签: ${JSON.stringify(firstVideo.tags)}`);
    }
  } catch (error) {
    console.error('❌ Bilibili测试失败:', error.message);
  }
  
  // 测试YouTube抓取器
  console.log('\n' + '='.repeat(50));
  console.log('🎥 测试YouTube抓取器');
  console.log('='.repeat(50));
  
  try {
    const youtubeScraper = new YouTubeScraper();
    
    // 检查API Key
    if (!process.env.YOUTUBE_API_KEY) {
      console.log('⚠️ YouTube API Key未配置');
      console.log('💡 请设置环境变量 YOUTUBE_API_KEY 来测试YouTube抓取');
    } else {
      console.log('✅ YouTube API Key已配置');
      
      const youtubeVideos = await youtubeScraper.getChannelVideos('UCwAnu01qlnVg1Ai2AbtTMaA', 3);
      
      console.log(`\n✅ YouTube测试结果: 获取到 ${youtubeVideos.length} 个视频`);
      
      if (youtubeVideos.length > 0) {
        console.log('\n第一个视频详情:');
        const firstVideo = youtubeVideos[0];
        console.log(`标题: ${firstVideo.title}`);
        console.log(`链接: ${firstVideo.url}`);
        console.log(`发布时间: ${firstVideo.publishTime}`);
        console.log(`观看次数: ${firstVideo.viewCount}`);
        console.log(`标签: ${JSON.stringify(firstVideo.tags)}`);
      }
    }
  } catch (error) {
    console.error('❌ YouTube测试失败:', error.message);
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('🏁 测试完成');
  console.log('='.repeat(50));
}

// 运行测试
testScrapers().catch(console.error);
