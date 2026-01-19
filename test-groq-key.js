const axios = require('axios');

// 从命令行参数获取 API Key
const apiKey = process.argv[2];

if (!apiKey) {
    console.error('❌ 请提供 API Key');
    console.log('用法: node test-groq-key.js YOUR_API_KEY');
    process.exit(1);
}

console.log('🔍 测试 Groq API Key...');
console.log('API Key (前10个字符):', apiKey.substring(0, 10) + '...');
console.log('');

// 测试 1: 检查 API Key 格式
console.log('✅ 步骤 1: 检查 API Key 格式');
if (!apiKey.startsWith('gsk_')) {
    console.error('❌ API Key 格式错误，应该以 gsk_ 开头');
    process.exit(1);
}
console.log('✅ API Key 格式正确');
console.log('');

// 测试 2: 测试 Chat Completions API（验证 Key 是否有效）
console.log('🔍 步骤 2: 测试 Chat API (验证 Key 有效性)');
axios.post(
    'https://api.groq.com/openai/v1/chat/completions',
    {
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 5
    },
    {
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        }
    }
)
    .then(response => {
        console.log('✅ API Key 有效！Chat API 调用成功');
        console.log('响应:', response.data.choices[0].message.content);
        console.log('');

        // 测试 3: 测试 Whisper API（需要音频文件）
        console.log('🔍 步骤 3: 检查 Whisper 访问权限');
        console.log('⚠️  无法完整测试 Whisper API (需要音频文件)');
        console.log('');
        console.log('✅ API Key 基本验证通过！');
        console.log('');
        console.log('📌 建议：');
        console.log('1. 登录 https://console.groq.com/settings/limits 检查配额');
        console.log('2. 确认账户已激活 Whisper 服务');
        console.log('3. 如果问题持续，尝试创建新的 API Key');
    })
    .catch(error => {
        console.error('❌ API Key 验证失败！');
        if (error.response) {
            console.error('状态码:', error.response.status);
            console.error('错误信息:', error.response.data);

            if (error.response.status === 401) {
                console.error('');
                console.error('💡 401 错误表示 API Key 无效或已过期');
                console.error('请在 https://console.groq.com/keys 检查或创建新的 Key');
            } else if (error.response.status === 403) {
                console.error('');
                console.error('💡 403 错误表示 API Key 有效但没有访问权限');
                console.error('可能的原因:');
                console.error('- 账户未激活');
                console.error('- 配额已用完');
                console.error('- 服务未启用');
            }
        } else {
            console.error('错误:', error.message);
        }
        process.exit(1);
    });
