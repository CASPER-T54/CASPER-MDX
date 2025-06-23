import fetch from 'node-fetch'
import FormData from 'form-data'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { createWriteStream } from 'fs'
import { pipeline } from 'stream'
import { promisify } from 'util'

const pipelineAsync = promisify(pipeline)

async function pollinations(prompt) {
  try {
    const encodedPrompt = encodeURIComponent(prompt)
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?nologo=true`
    
    const response = await fetch(imageUrl)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const tempPath = path.join(os.tmpdir(), 'temp_image.jpg')
    const writer = createWriteStream(tempPath)
    
    await pipelineAsync(response.body, writer)
    
    const form = new FormData()
    form.append('reqtype', 'fileupload')
    form.append('fileToUpload', fs.createReadStream(tempPath))
    
    const upload = await fetch('https://catbox.moe/user/api.php', {
      method: 'POST',
      body: form,
      headers: form.getHeaders()
    })
    
    const result = await upload.text()
    
    // Clean up temp file
    fs.unlinkSync(tempPath)
    
    return result
  } catch (err) {
    throw new Error(err.message)
  }
}

export default pollinations