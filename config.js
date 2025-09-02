/**
 * PromptLayer 自动化工具配置文件
 * 如果不使用自定义配置，可删除此文件或直接使用默认值
 */

module.exports = {
  // 运行模式: "register" - 注册新账号, "refresh" - 刷新已有账号的token
  runMode: "register",
  
  // Chrome浏览器可执行文件路径（留空使用系统默认）
  // 示例 Windows: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
  // 示例 Mac: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
  // 示例 Linux: "/usr/bin/google-chrome"
  browserPath: '/data/data/com.termux/files/usr/bin/chromium-browser',
  
  // 是否使用无头模式 (true/false)
  headless: true,
  
  // 操作延迟（毫秒），调试时可增大此值
  slowMo: 0,
  
  // 输出文件保存目录
  defaultOutputDir: './output',
  
  // 自定义用户代理字符串（默认会随机选择）
  customUserAgent: '',
  
  // 是否启用调试日志
  debug: false,
  
  // 注册账号使用的邮箱域名列表
  emailDomains: [
    '@vkgl.keomiao.space',
    '@coat.suitbase.cfd',
    '@gost.suitbase.cfd',
    '@ltd.keomiao.space'
  ],
  
  // 要注册的账号数量
  registrationCount: 5,
  
  // 需要刷新token的账号列表
  refreshAccounts: [
    // 示例格式，请替换为实际需要刷新的账户
    // {email: "example@example.com", password: "yourpassword"},
    {email: "a2522aa3@ltd.keomiao.space", password: "3b1e95d22cdeA1!"},
    {email: "f7236ad0@gost.suitbase.cfd", password: "0a7f93ec5894A1!"},
  ],
  
  // 注册完成后是否自动关闭浏览器
  autoCloseBrowser: true
};
