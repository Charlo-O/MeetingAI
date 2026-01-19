const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

const apiKey = process.argv[2];

if (!apiKey) {
    console.error('❌ 请提供 API Key');
    console.log('用法: node test-whisper.js YOUR_API_KEY');
    process.exit(1);
}

console.log('🔍 测试 Groq Whisper API...');
console.log('API Key (前10个字符):', apiKey.substring(0, 10) + '...');
console.log('');

// 创建一个简单的测试音频文件（静音）
const createTestAudio = () => {
    // 创建一个最小的 WAV 文件（44 bytes header + 1 second of silence at 8kHz mono）
    const header = Buffer.from([
        0x52, 0x49, 0x46, 0x46, // "RIFF"
        0x24, 0x00, 0x00, 0x00, // File size - 8
        0x57, 0x41, 0x56, 0x45, // "WAVE"
        0x66, 0x6D, 0x74, 0x20, // "fmt "
        0x10, 0x00, 0x00, 0x00, // Subchunk1Size (16 for PCM)
        0x01, 0x00,             // AudioFormat (1 for PCM)
        0x01, 0x00,             // NumChannels (1 = mono)
        0x40, 0x1F, 0x00, 0x00, // SampleRate (8000 Hz)
        0x40, 0x1F, 0x00, 0x00, // ByteRate
        0x01, 0x00,             // BlockAlign
        0x08, 0x00,             // BitsPerSample (8)
        0x64, 0x61, 0x74, 0x61, // "data"
        0x00, 0x00, 0x00, 0x00  // Subchunk2Size (will be filled)
    ]);

    // 1 second of silence at 8kHz = 8000 samples
    const silenceData = Buffer.alloc(8000, 0x80); // 0x80 is silence for 8-bit audio

    // Update data chunk size
    header.writeUInt32LE(silenceData.length, 40);
    // Update file size
    header.writeUInt32LE(36 + silenceData.length, 4);

    return Buffer.concat([header, silenceData]);
};

console.log('📝 创建测试音频文件...');
const audioBuffer = createTestAudio();
const testAudioPath = './test-audio.wav';
fs.writeFileSync(testAudioPath, audioBuffer);
console.log('✅ 测试音频文件已创建:', testAudioPath);
console.log('');

// 测试 Whisper API
console.log('🔍 测试 Whisper API...');

const form = new FormData();
form.append('file', fs.createReadStream(testAudioPath), {
    filename: 'test.wav',
    contentType: 'audio/wav'
});
form.append('model', 'whisper-large-v3-turbo');

axios.post(
    'https://api.groq.com/openai/v1/audio/transcriptions',
    form,
    {
        headers: {
            ...form.getHeaders(),
            'Authorization': `Bearer ${apiKey}`
        }
    }
)
    .then(response => {
        console.log('✅ Whisper API 调用成功！');
        console.log('转写结果:', response.data.text || '(空)');
        console.log('');
        console.log('🎉 所有测试通过！你的 Groq 账户可以访问 Whisper API');

        // 清理测试文件
        fs.unlinkSync(testAudioPath);
    })
    .catch(error => {
        console.error('❌ Whisper API 调用失败！');
        if (error.response) {
            console.error('状态码:', error.response.status);
            console.error('错误信息:', JSON.stringify(error.response.data, null, 2));

            if (error.response.status === 403) {
                console.error('');
                console.error('💡 403 Forbidden 错误可能的原因:');
                console.error('1. 你的账户没有 Whisper API 访问权限');
                console.error('2. Groq 可能限制了某些地区的访问');
                console.error('3. 你可能在使用 VPN 或被限制的网络');
                console.error('4. 免费账户可能不支持 Whisper API');
                console.error('');
                console.error('📌 建议:');
                console.error('- 检查 Groq Console 中的账户状态和权限');
                console.error('- 尝试关闭 VPN 后重试');
                console.error('- 联系 Groq 支持确认你的账户是否有 Whisper 访问权限');
                console.error('- 考虑使用其他 Whisper API 服务（如 OpenAI）');
            }
        } else {
            console.error('错误:', error.message);
        }

        // 清理测试文件
        try {
            fs.unlinkSync(testAudioPath);
        } catch (e) { }

        process.exit(1);
    });
