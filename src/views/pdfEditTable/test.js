const axios = require('axios');

async function test() {
  try {
    const response = await axios.post(
      'https://ark.cn-beijing.volces.com/api/v3/bots/chat/completions',
      {
        model: "doubao-standard",
        messages: [{ role: "user", content: "你好！请自我介绍" }]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer a5634a1c-cbd6-4508-8566-00102c88f6ff'
        }
      }
    );
    console.log('AI回复:', response.data.choices[0].message.content);
  } catch (error) {
    console.error('错误:', error.response?.data || error.message);
  }
}
test()
