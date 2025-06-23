const handler = async (m, {
  conn,
  text,
  prefix,
  command,
  fkontak,
  reply
}) => {
  // Input validation
  if (!text?.trim()) {
    return reply(`❗ Usage:\n*${prefix + command} video name*\n\nExample:\n${prefix + command} Alan Walker Faded`)
  }

  const query = text.trim()
  
  try {
    // Step 1: Search for videos
   // reply(`🔍 Searching: *${query}*\n⏳ Please wait...`)
    
    const searchUrl = `https://www.apis-anomaki.zone.id/search/ytsearch?query=${encodeURIComponent(query)}`
    const searchRes = await fetch(searchUrl)
    
    if (!searchRes.ok) {
      return reply('❌ Search service unavailable.')
    }
    
    const searchData = await searchRes.json()
    
    if (!searchData?.status || !searchData.result?.videos?.length) {
      return reply('❌ No videos found for your search.')
    }
    
    // Get the first video
    const video = searchData.result.videos[0]
    
    reply(`🎬 Found: *${video.title}*\n📺 ${video.author.name} | ${video.duration}\n📥 Downloading...`)
    
    // Step 2: Download video using primary API
    let downloadSuccess = false
    let videoBuffer = null
    let videoData = null
    
    try {
      const downloadUrl = `https://www.apis-anomaki.zone.id/downloader/ytv?url=${encodeURIComponent(video.url)}`
      const downloadRes = await fetch(downloadUrl)
      
      if (downloadRes.ok) {
        const downloadData = await downloadRes.json()
        
        if (downloadData?.status && downloadData.result?.status === 'success') {
          const formats = downloadData.result.formats || []
          
          // Use first available format with valid URL
          const selectedFormat = formats.find(f => f.url && f.qualityLabel)
          
          if (selectedFormat) {
           // reply(`📹 Downloading ${selectedFormat.qualityLabel}...`)
            
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 60000) // 60 seconds
            
            const videoRes = await fetch(selectedFormat.url, {
              signal: controller.signal,
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
              }
            })
            
            clearTimeout(timeoutId)
            
            if (videoRes.ok) {
              const arrayBuffer = await videoRes.arrayBuffer()
              
              if (arrayBuffer.byteLength > 5000) { // Minimum 5KB
                videoBuffer = Buffer.from(arrayBuffer)
                videoData = {
                  title: video.title,
                  author: video.author?.name || 'Unknown',
                  duration: video.duration,
                  views: video.views,
                  quality: selectedFormat.qualityLabel,
                  thumbnail: video.thumbnail
                }
                downloadSuccess = true
                //reply(`✅ Download successful! (${(videoBuffer.length / (1024 * 1024)).toFixed(1)}MB)`)
              }
            }
          }
        }
      }
    } catch (error) {
      console.log('Primary download failed:', error.message)
    }
    
    // Step 3: Fallback method if primary failed
    if (!downloadSuccess) {
      try {
       // reply(`🔄 Trying alternative method...`)
        
        const fallbackUrl = `https://zenzzapiofficial.vercel.app/downloader/ytmp4?url=${encodeURIComponent(video.url)}`
        const fallbackRes = await fetch(fallbackUrl)
        
        if (fallbackRes.ok) {
          const fallbackData = await fallbackRes.json()
          
          if (fallbackData?.status && fallbackData.result?.download_url) {
            const directUrl = fallbackData.result.download_url
            
          //  reply(`📹 Downloading from backup server...`)
            
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 90000) // 90 seconds
            
            const videoRes = await fetch(directUrl, {
              signal: controller.signal,
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
              }
            })
            
            clearTimeout(timeoutId)
            
            if (videoRes.ok) {
              const arrayBuffer = await videoRes.arrayBuffer()
              
              if (arrayBuffer.byteLength > 5000) {
                videoBuffer = Buffer.from(arrayBuffer)
                videoData = {
                  title: fallbackData.result.title || video.title,
                  author: fallbackData.result.author || video.author?.name || 'Unknown',
                  duration: fallbackData.result.lengthSeconds ? 
                    `${Math.floor(fallbackData.result.lengthSeconds / 60)}:${(fallbackData.result.lengthSeconds % 60).toString().padStart(2, '0')}` : 
                    video.duration,
                  views: fallbackData.result.views || video.views,
                  quality: 'HD',
                  thumbnail: fallbackData.result.thumbnail || video.thumbnail
                }
                downloadSuccess = true
               // reply(`✅ Backup method successful! (${(videoBuffer.length / (1024 * 1024)).toFixed(1)}MB)`)
              }
            }
          }
        }
      } catch (error) {
        console.log('Fallback download failed:', error.message)
      }
    }
    
    // Step 4: Check if download was successful
  /* if (!downloadSuccess || !videoBuffer || !videoData) {
      return reply(`❌ Download failed.\n\n💡 Possible reasons:\n• Video is private/restricted\n• File too large (>100MB)\n• Server temporarily unavailable\n\n🔄 Try again with a different video.`)
   }*/
    
    // Step 5: Download thumbnail (optional)
  /*  let thumbnail = null
    try {
      if (videoData.thumbnail) {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 15000)
        
        const thumbRes = await fetch(videoData.thumbnail, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        })
        
        clearTimeout(timeoutId)
        
        if (thumbRes.ok) {
          const thumbBuffer = await thumbRes.arrayBuffer()
          if (thumbBuffer.byteLength > 1000) {
            thumbnail = Buffer.from(thumbBuffer)
          }
        }
      }
    } catch (error) {
      console.log('Thumbnail download failed:', error.message)
      // Continue without thumbnail
   */
    
    // Step 6: Send the video
    const fileSizeMB = (videoBuffer.length / (1024 * 1024)).toFixed(1)
    
    // Check file size limit (100MB)
    if (videoBuffer.length > 100 * 1024 * 1024) {
      return reply(`❌ Video too large (${fileSizeMB}MB).\n\n💡 Maximum size is 100MB. Try a shorter video.`)
    }
    
    const caption = `🎬 *${videoData.title}*\n📺 ${videoData.author}\n⏱ ${videoData.duration} | 📱 ${videoData.quality}\n👁 ${videoData.views?.toLocaleString() || 'N/A'} views\n📁 ${fileSizeMB}MB\n\n> © CASPER-X 🤓 | CASPER TECH™ 2025`
    
   // reply(`📤 Sending video (${fileSizeMB}MB)...`)
    
    // Send video with proper mime type and filename
    await conn.sendMessage(m.chat, {
      video: videoBuffer,
      mimetype: 'video/mp4',
      fileName: `${videoData.title.replace(/[^\w\s]/gi, '').substring(0, 50)}.mp4`,
      caption,
    //  ...(thumbnail && { thumbnail })
    }, { quoted: fkontak })
    
  } catch (error) {
    console.error('Handler error:', error)
    
    // Handle specific error types
    if (error.name === 'AbortError') {
      return reply('❌ Request timeout. Server is slow, try again.')
    }
    
    if (error.message.includes('fetch')) {
      return reply('❌ Network connection failed. Check your internet.')
    }
    
    if (error.message.includes('large') || error.message.includes('size')) {
      return reply('❌ Video too large. Try shorter video.')
    }
    
    return reply('⚠️ An error occurred. Please try again.')
  }
}

handler.help = ['video', 'ytv']
handler.tags = ['downloader']
handler.command = ['video', 'ytv', 'ytvideo']

export default handler