/**
 * DeepSeek 公共配置
 * API Key 仅存放在 deepseek.secret.js（已在 .gitignore），请勿提交该文件。
 * 新环境请复制 deepseek.secret.example.js 为 deepseek.secret.js 并填写 apiKey。
 */
const secret = require('./deepseek.secret.js');

module.exports = {
  apiKey: secret.apiKey || '',
  baseUrl: 'https://api.deepseek.com',
  model: 'deepseek-chat',
  chatPath: '/chat/completions'
};
