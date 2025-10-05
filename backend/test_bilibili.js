const BilibiliScraper = require('./scrapers/bilibili');

async function testBilibili() {
  try {
    console.log('🧪 测试Bilibili API调用...');
    const scraper = new BilibiliScraper();
    
    // 测试获取UP主475013101的视频
    const videos = await scraper.getUserVideos('475013101', 3);
    
    console.log('\n📊 返回的视频数据:');
    console.log(`获取到 ${videos.length} 个视频`);
    
    if (videos.length > 0) {
      console.log('\n第一个视频详情:');
      console.log(JSON.stringify(videos[0], null, 2));
      
      console.log('\n🔗 视频链接:');
      videos.forEach((video, index) => {
        console.log(`${index + 1}. ${video.title}`);
        console.log(`   链接: ${video.url}`);
        console.log(`   BV号: ${video.url.split('/').pop()}`);
      });
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.error('详细错误:', error);
  }
}

testBilibili();
