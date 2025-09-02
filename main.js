const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { randomBytes } = require('crypto');
const fs = require('fs').promises;
const path = require('path');

// 使用Stealth插件提高隐蔽性
puppeteer.use(StealthPlugin());

// 默认配置
const DEFAULT_CONFIG = {
  // 可以指定Chrome浏览器路径，例如：'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  browserPath: '',
  headless: false,
  slowMo: 0, // 放慢操作速度，便于调试
  defaultOutputDir: './output'
};

// 尝试从配置文件加载配置
async function loadConfig() {
  try {
    const configPath = path.join(__dirname, 'config.js');
    const configExists = await fs.access(configPath).then(() => true).catch(() => false);
    
    if (configExists) {
      // 动态导入配置
      const userConfig = require('./config.js');
      return { ...DEFAULT_CONFIG, ...userConfig };
    }
  } catch (error) {
    console.log('未找到配置文件或加载配置出错，使用默认配置');
  }
  
  return DEFAULT_CONFIG;
}

// ========== 辅助函数 ==========
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 生成随机字符串
const generateRandomString = (length = 8) => {
  return randomBytes(length).toString('hex').slice(0, length);
};

// 生成随机公司名称
function generateCompanyName() {
  const prefixes = ['Tech', 'Digital', 'Smart', 'Global', 'Future', 'Next', 'Prime', 'Alpha', 'Beta', 'Meta'];
  const suffixes = ['Solutions', 'Systems', 'Labs', 'Works', 'Co', 'Group', 'Tech', 'Soft', 'Net', 'Hub'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
  return `${prefix} ${suffix}`;
}

// 生成随机用户信息
function generateUserInfo(config = {}) {
  // 使用配置文件中的邮箱域名，如果不存在则使用默认值
  const emailDomains = config.emailDomains || ['@vkgl.keomiao.space', '@coat.suitbase.cfd', '@gost.suitbase.cfd', '@ltd.keomiao.space'];
  const firstNames = ['John', 'Mike', 'Sarah', 'Emily', 'Alex', 'David', 'Emma', 'Linda', 'Robert', 'William', 'Thomas', 'James'];
  const lastNames = ['Smith', 'Johnson', 'Brown', 'Davis', 'Wilson', 'Miller', 'Taylor', 'Clark', 'White', 'Moore', 'Harris', 'Martin'];
  
  const randomDomain = emailDomains[Math.floor(Math.random() * emailDomains.length)];
  const username = generateRandomString(8).toLowerCase();
  const email = `${username}${randomDomain}`;
  
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  const fullName = `${firstName} ${lastName}`;
  
  const password = generateRandomString(12) + 'A1!';
  
  return { email, fullName, password };
}

// 查找并点击按钮（通用函数）
async function findAndClickButton(page, buttonText, useXPath = false) {
  const button = await page.evaluateHandle((text) => {
    const buttons = Array.from(document.querySelectorAll('button'));
    return buttons.find(btn => btn.textContent && btn.textContent.includes(text));
  }, buttonText);

  if (button && button.asElement()) {
    await button.asElement().click();
    console.log(`点击了 ${buttonText} 按钮`);
    return true;
  } else if (useXPath) {
    // 备用方法：使用 XPath
    const [xpathBtn] = await page.$x(`//button[contains(text(), "${buttonText}")]`);
    if (xpathBtn) {
      await xpathBtn.click();
      console.log(`点击了 ${buttonText} 按钮 (XPath)`);
      return true;
    }
  }
  return false;
}

// 配置浏览器
async function setupBrowser() {
  // 加载配置
  const config = await loadConfig();
  
  const launchOptions = {
    headless: config.headless,
    slowMo: config.slowMo,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process',
      '--disable-blink-features=AutomationControlled',
      '--window-size=1366,768'
    ],
    ignoreHTTPSErrors: true
  };
  
  // 如果指定了自定义浏览器路径，则使用
  if (config.browserPath) {
    launchOptions.executablePath = config.browserPath;
    console.log(`使用自定义浏览器路径: ${config.browserPath}`);
  }
  
  const browser = await puppeteer.launch(launchOptions);
  return browser;
}

// 配置页面
async function setupPage(browser) {
  const page = await browser.newPage();
  
  // 设置视口
  const screenWidth = 1280 + Math.floor(Math.random() * 200);
  const screenHeight = 800 + Math.floor(Math.random() * 200);
  await page.setViewport({
    width: screenWidth,
    height: screenHeight,
    deviceScaleFactor: 1 + Math.random() * 0.5
  });
  
  // 设置用户代理
  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.71 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.2 Safari/605.1.15'
  ];
  const userAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
  await page.setUserAgent(userAgent);
  
  // 隐藏自动化特征
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
    Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
    Object.defineProperty(navigator, 'plugins', {
      get: () => [
        { name: "Chrome PDF Plugin", filename: "internal-pdf-viewer" },
        { name: "Chrome PDF Viewer", filename: "mhjfbmdgcfjbbpaeojofohoefgiehjai" },
        { name: "Native Client", filename: "internal-nacl-plugin" }
      ]
    });
  });
  
  // 设置HTTP头
  await page.setExtraHTTPHeaders({
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br'
  });
  
  // 拦截请求（阻止图片和字体加载）
  await page.setRequestInterception(true);
  page.on('request', (req) => {
    if (req.resourceType() === 'image' || req.resourceType() === 'font') {
      req.abort();
    } else {
      req.continue();
    }
  });
  
  return page;
}

// 填写注册表单
async function fillRegistrationForm(page, userInfo) {
  const { email, fullName, password } = userInfo;
  
  console.log('填写邮箱...');
  await page.click('#email', { delay: 100 });
  await page.type('#email', email, { delay: 50 + Math.random() * 50 });
  await delay(300 + Math.random() * 500);
  
  console.log('填写姓名...');
  await page.click('#name', { delay: 100 });
  await page.type('#name', fullName, { delay: 70 + Math.random() * 50 });
  await delay(300 + Math.random() * 500);
  
  console.log('填写密码...');
  await page.click('#password', { delay: 100 });
  await page.type('#password', password, { delay: 60 + Math.random() * 50 });
  await delay(300 + Math.random() * 500);
  
  console.log('确认密码...');
  await page.click('#verifyPassword', { delay: 100 });
  await page.type('#verifyPassword', password, { delay: 65 + Math.random() * 50 });
  await delay(500 + Math.random() * 500);
}

// 处理 Onboarding 流程
async function handleOnboarding(page, companyName) {
  console.log('进入 Onboarding 流程...');
  
  // 步骤 1: 选择第一个 input 并点击 Continue
  console.log('步骤 1: 处理第一个 onboarding 页面...');
  await delay(2000);
  
  const firstInput = await page.$('input');
  if (firstInput) {
    await firstInput.click();
    await delay(500);
  }
  
  await findAndClickButton(page, 'Continue', true);
  await delay(3000);
  
  // 步骤 2: 选择角色
  console.log('步骤 2: 选择角色...');
  const selectRoleButton = await page.evaluateHandle(() => {
    const spans = Array.from(document.querySelectorAll('span'));
    const span = spans.find(s => s.textContent === 'Select role');
    return span ? span.closest('button') : null;
  });
  
  if (selectRoleButton && selectRoleButton.asElement()) {
    await selectRoleButton.asElement().click();
    console.log('点击了 Select role 按钮');
    await delay(1000);
    
    const promptEngineerOption = await page.evaluateHandle(() => {
      const divs = Array.from(document.querySelectorAll('div[role="menuitem"]'));
      return divs.find(d => d.textContent && d.textContent.includes('Prompt Engineer'));
    });
    
    if (promptEngineerOption && promptEngineerOption.asElement()) {
      await promptEngineerOption.asElement().click();
      console.log('选择了 Prompt Engineer');
    }
  }
  
  await delay(2000);
  
  // 步骤 3: 选择公司规模
  console.log('步骤 3: 选择公司规模...');
  const selectSizeButton = await page.evaluateHandle(() => {
    const spans = Array.from(document.querySelectorAll('span'));
    const span = spans.find(s => s.textContent === 'Select company size');
    return span ? span.closest('button') : null;
  });
  
  if (selectSizeButton && selectSizeButton.asElement()) {
    await selectSizeButton.asElement().click();
    console.log('点击了 Select company size 按钮');
    await delay(1000);
    
    const sizeOption = await page.evaluateHandle(() => {
      const divs = Array.from(document.querySelectorAll('div[role="menuitem"]'));
      return divs.find(d => d.textContent && d.textContent.trim() === '2-10');
    });
    
    if (sizeOption && sizeOption.asElement()) {
      await sizeOption.asElement().click();
      console.log('选择了 2-10');
    }
  }
  
  await delay(2000);
  
  // 步骤 4: 输入公司名称
  console.log('步骤 4: 输入公司名称...');
  console.log(`生成的公司名称: ${companyName}`);
  
  const companyInput = await page.$('input[placeholder="Enter company name"]');
  if (companyInput) {
    await companyInput.click();
    await companyInput.type(companyName, { delay: 60 + Math.random() * 40 });
    console.log('输入了公司名称');
  }
  
  await delay(1500);
  
  // 步骤 5: 点击最后的 Continue 按钮
  console.log('步骤 5: 点击最后的 Continue 按钮...');
  await findAndClickButton(page, 'Continue', true);
  await delay(5000);
  
  // 步骤 6: 选择圆形选择框（合并的步骤）
  console.log('步骤 6: 选择圆形选择框...');
  await delay(2000);
  
  const circleSpan = await page.$('span.h-4.w-4.rounded-full.border.border-gray-300.bg-white');
  if (circleSpan) {
    await circleSpan.click();
    console.log('点击了圆形选择框');
    await delay(1000);
  }
  
  console.log('Onboarding 流程完成！');
}

// 处理后续步骤
async function handlePostOnboarding(page) {
  console.log('继续执行后续步骤...');
  
  // 步骤 1: 点击 Finish 按钮
  console.log('步骤 1: 点击 Finish 按钮...');
  await delay(1000);
  
  const finishButton = await page.evaluateHandle(() => {
    const buttons = Array.from(document.querySelectorAll('button[type="submit"]'));
    return buttons.find(btn => btn.textContent && btn.textContent.includes('Finish'));
  });
  
  if (finishButton && finishButton.asElement()) {
    await finishButton.asElement().click();
    console.log('点击了 Finish 按钮');
  } else {
    const finishBtn = await page.$('button[type="submit"].bg-primary');
    if (finishBtn) {
      await finishBtn.click();
      console.log('点击了 Finish 按钮（备用方法）');
    }
  }
  
  await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {});
  await delay(3000);
  
  // 验证 workspace 页面
  const currentUrlAfterFinish = page.url();
  let workspaceId = null;
  if (currentUrlAfterFinish.includes('/workspace/') && currentUrlAfterFinish.includes('/home')) {
    console.log(`成功跳转到 workspace 页面: ${currentUrlAfterFinish}`);
    const workspaceMatch = currentUrlAfterFinish.match(/workspace\/(\d+)/);
    workspaceId = workspaceMatch ? workspaceMatch[1] : null;
    console.log(`Workspace ID: ${workspaceId}`);
  }
  
  // 步骤 2: 关闭第一个弹窗
  console.log('步骤 2: 关闭第一个弹窗...');
  await delay(2000);
  
  const closeButton1 = await page.$('svg[width="15"][height="15"][viewBox="0 0 15 15"]');
  if (closeButton1) {
    const parentButton = await page.evaluateHandle(el => el.closest('button'), closeButton1);
    if (parentButton && parentButton.asElement()) {
      await parentButton.asElement().click();
      console.log('关闭了第一个弹窗');
    } else {
      await closeButton1.click();
      console.log('直接点击了关闭图标');
    }
    await delay(1000);
  }
  
  // 步骤 3: 点击 Skip 按钮
  console.log('步骤 3: 点击 Skip 按钮...');
  await delay(1000);
  await findAndClickButton(page, 'Skip');
  await delay(1500);
  
  // 步骤 4: 点击 "Create a prompt" 按钮
  console.log('步骤 4: 点击 Create a prompt 按钮...');
  await delay(2000);
  
  const createPromptButton = await page.evaluateHandle(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    return buttons.find(btn =>
      btn.textContent &&
      btn.textContent.includes('Create a prompt') &&
      btn.classList.contains('bg-primary')
    );
  });
  
  if (createPromptButton && createPromptButton.asElement()) {
    await createPromptButton.asElement().click();
    console.log('点击了 Create a prompt 按钮');
  } else {
    // 备用方法：通过class特征寻找
    const createBtn = await page.$('button.inline-flex.items-center.justify-center.rounded-md.font-medium.bg-primary');
    if (createBtn) {
      await createBtn.click();
      console.log('点击了 Create a prompt 按钮（备用方法）');
    }
  }
  
  await delay(2000);
  
  // 步骤 7: 点击 Run 按钮
  console.log('步骤 7: 点击 Run 按钮...');
  await delay(2000);
  await findAndClickButton(page, 'Run');
  await delay(2000);
  
  // 步骤 8: 关闭弹窗并再次点击 Run
  console.log('步骤 8: 关闭弹窗并再次点击 Run...');
  await delay(1000);
  
  const closeButton2 = await page.$('svg[width="15"][height="15"] path[d*="M11.7816 4.03157"]');
  if (closeButton2) {
    const parentButton = await page.evaluateHandle(el => el.closest('button'), closeButton2);
    if (parentButton && parentButton.asElement()) {
      await parentButton.asElement().click();
      console.log('关闭了弹窗');
    }
    await delay(1000);
    
    console.log('再次点击 Run 按钮...');
    await findAndClickButton(page, 'Run');
  }
  
  return workspaceId;
}

// 捕获 API Token
async function captureToken(page) {
  console.log('步骤 9: 等待并捕获 API 请求...');
  
  let authToken = null;
  let tokenCaptured = false;
  
  // 创建一个Promise，当捕获到token或超时时解决
  const tokenPromise = new Promise((resolve) => {
    const requestListener = request => {
      const url = request.url();
      if (url.includes('api.promptlayer.com/api/dashboard/v2/workspaces') && url.includes('/run_groups')) {
        const headers = request.headers();
        if (headers['authorization']) {
          const auth = headers['authorization'];
          authToken = auth.replace('Bearer ', '').trim();
          console.log('捕获到 Authorization Token!');
          tokenCaptured = true;
          resolve();
        }
      }
    };
    
    page.on('request', requestListener);
  });
  
  // 设置超时
  const timeoutPromise = delay(2000).then(() => {
    console.log('等待捕获token超时，继续执行...');
  });
  
  // 等待token捕获或超时，谁先发生就先继续
  await Promise.race([tokenPromise]);
  
  // 如果未捕获到，尝试主动触发
  if (!tokenCaptured) {
    console.log('未能捕获到 Token，尝试主动触发...');
    await page.evaluate(() => {
      const buttons = document.querySelectorAll('button');
      buttons.forEach(btn => {
        if (btn.textContent && (btn.textContent.includes('Run') || btn.textContent.includes('Test'))) {
          btn.click();
        }
      });
    });
    
    await delay(3000);
  }
  
  return authToken;
}

// 保存账户信息
async function saveAccountInfo(userInfo, companyName, authToken, workspaceId) {
  const { email, fullName, password } = userInfo;
  
  if (authToken) {
    const accountData = {
      email,
      password,
      name: fullName,
      company: companyName,
      token: authToken,
      workspaceId,
      timestamp: new Date().toISOString()
    };
    
    // // 保存为 JSON 格式
    // const jsonData = JSON.stringify(accountData, null, 2);
    // await fs.appendFile('accounts_with_tokens.json', jsonData + ',\n');
    
    // 保存为文本格式
    const textData = `
===============================
Email: ${email}
Password: ${password}
Name: ${fullName}
Company: ${companyName}
Token: ${authToken}
Workspace ID: ${workspaceId}
Timestamp: ${new Date().toISOString()}
===============================
`;
    await fs.appendFile('accounts_with_tokens.txt', textData);
    
    console.log('账户信息和 Token 已保存！');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('Token:', authToken);
  } 
//   else {
//     // 仅保存基本信息
//     const accountInfo = `
// Email: ${email}
// Name: ${fullName}
// Password: ${password}
// Company: ${companyName}
// Role: Prompt Engineer
// Company Size: 2-10
// Timestamp: ${new Date().toISOString()}
// ----------------------------
// `;
//     await fs.appendFile('successful_accounts.txt', accountInfo);
//     console.log('账户信息已保存（未获取到Token）');
//   }
}

// 刷新token时保存账户信息
async function saveRefreshedToken(email, newToken) {
  const accountData = {
    email,
    token: newToken,
    refreshed_at: new Date().toISOString()
  };
  
  // 保存为 JSON 格式
  // const jsonData = JSON.stringify(accountData, null, 2);
  // await fs.appendFile('refreshed_tokens.json', jsonData + ',\n');
  
  // 保存为文本格式
  const textData = `
===============================
Email: ${email}
Token: ${newToken}
Refreshed At: ${new Date().toISOString()}
===============================
`;
  await fs.appendFile('refreshed_tokens.txt', textData);
  
  console.log('刷新的 Token 已保存！');
  console.log('Email:', email);
  console.log('Token:', newToken);
}

// 刷新token函数
async function refreshTokens() {
  // 加载配置
  const config = await loadConfig();
  
  // 检查是否有需要刷新的账号
  const refreshAccounts = config.refreshAccounts || [];
  if (refreshAccounts.length === 0) {
    console.log('没有需要刷新的账号，请在config.js中配置refreshAccounts');
    return;
  }
  
  console.log(`计划刷新 ${refreshAccounts.length} 个账号的token...`);
  
  for (let i = 0; i < refreshAccounts.length; i++) {
    const account = refreshAccounts[i];
    
    console.log(`\n开始刷新第 ${i+1}/${refreshAccounts.length} 个账号的token...\n`);
    console.log(`账号: ${account.email}`);
    
    const browser = await setupBrowser();
    
    try {
      const page = await setupPage(browser);
      
      // 访问登录页面
      console.log('访问登录页面...');
      await page.goto('https://dashboard.promptlayer.com/login', {
        waitUntil: 'networkidle2',
        timeout: 60000
      });
      
      await page.waitForSelector('#email', { visible: true });
      await delay(1000 + Math.random() * 1000);
      
      // 填写邮箱
      console.log('填写邮箱...');
      await page.click('#email', { delay: 100 });
      await page.type('#email', account.email, { delay: 50 + Math.random() * 50 });
      await delay(300 + Math.random() * 500);
      
      // 填写密码
      console.log('填写密码...');
      await page.click('#password', { delay: 100 });
      await page.type('#password', account.password, { delay: 60 + Math.random() * 50 });
      await delay(500 + Math.random() * 500);
      
      // 提交表单
      await page.evaluate(() => {
        document.querySelectorAll('input').forEach(input => input.blur());
      });
      
      // 点击登录按钮
      console.log('点击登录按钮...');
      const loginButton = await page.$('button[type="submit"]');
      
      if (loginButton) {
        const buttonBox = await loginButton.boundingBox();
        
        await page.mouse.move(
          buttonBox.x + buttonBox.width / 2 + (Math.random() * 10 - 5),
          buttonBox.y + buttonBox.height / 2 + (Math.random() * 10 - 5),
          { steps: 10 }
        );
        
        await delay(300 + Math.random() * 300);
        
        await Promise.all([
          page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 2000 }).catch(() => {}),
          loginButton.click({ delay: 50 })
        ]);
        
        console.log('登录表单已提交！');
        await delay(3000);
      } else {
        console.log('未找到登录按钮');
        continue;
      }
      
      // 等待一段时间让页面加载或重定向完成
      console.log('等待页面加载或重定向...');
      const hasErrorMessage = await page.evaluate(() => {
      // 方法1：检查所有div中是否包含错误文本
      const divs = Array.from(document.querySelectorAll('div'));
      return divs.some(div => 
        div.textContent && 
        div.textContent.includes('Email and or password is incorrect')
      );
    });
    let currentUrl = page.url();
    if (hasErrorMessage && currentUrl.includes('/login')) {
      console.log(`账号 ${account.email} 登录失败：邮箱或密码不正确`);
      console.log('跳过当前账号，处理下一个账号...');
      continue;
    }
      await delay(5000);
      
      // 首先验证是否成功登录
      currentUrl = page.url();
      if (currentUrl.includes('/workspace/') && currentUrl.includes('/home')) {
        console.log('登录成功，已进入工作区页面');
        
        // 监听 API 请求，获取 token
        let authToken = null;
        
        console.log('等待并捕获API请求...');
        console.log('请稍等片刻，网页将自动调用API...');
        
        // 修改拦截规则，只记录请求头，不阻止任何请求
        page.setRequestInterception(true);
        
        // 清除之前可能存在的请求监听器
        //await page._client.send('Network.clearBrowserCache');
        
        // 创建一个Promise，当捕获到token时解决
        const captureTokenPromise = new Promise(resolve => {
          const requestListener = request => {
            const url = request.url();
            if (url.includes('api.promptlayer.com/get-user')) {
              const headers = request.headers();
              if (headers['authorization']) {
                authToken = headers['authorization'].replace('Bearer ', '').trim();
                console.log('捕获到 Authorization Token!');
                resolve();
              }
            }
            request.continue();
          };
          
          // 移除所有现有的请求监听器，避免冲突
          page.removeAllListeners('request');
          
          // 添加新的请求监听器
          page.on('request', requestListener);
        });
        
        // 设置超时
        const timeoutPromise = delay(2000).then(() => {
          console.log('等待捕获token超时，继续执行...');
        });
        
        // 等待token捕获或超时，谁先发生就先继续
        await Promise.race([captureTokenPromise]);
        
        // 如果仍未获取到token，尝试通过执行JS获取
        if (!authToken) {
          
          console.log('通过页面交互触发API请求...');
          
          // 尝试与页面交互，可能触发API请求
          await page.reload({ waitUntil: 'networkidle2' });
          await delay(2000);
          
          // 尝试点击一些元素
          // await page.evaluate(() => {
          //   // 尝试点击顶部导航栏
          //   document.querySelectorAll('a').forEach(a => {
          //     if (a.href && a.href.includes('/dashboard')) {
          //       a.click();
          //     }
          //   });
          // });
          
          // await delay(2000);
        }
        
        // 保存刷新的token
        if (authToken) {
          await saveRefreshedToken(account.email, authToken);
        } else {
          console.log(`无法获取账号 ${account.email} 的token`);
        }
      } else {
        console.log(`当前URL: ${currentUrl}`);
        
        // // 只有在登录页面才检测错误消息
        // if (currentUrl.includes('/login')) {
        //   console.log('检测登录错误...');
        //   // 使用更精确的方式检查错误消息
        //   const hasErrorMessage = await page.evaluate(() => {
        //     // 更精确地检查登录表单附近的错误消息
        //     const loginForm = document.querySelector('form');
        //     if (!loginForm) return false;
            
        //     // 检查表单内部和周围的错误消息
        //     const errorTexts = ['Email and or password is incorrect', 'Invalid login', 'Login failed'];
            
        //     // 获取表单及其直接子元素
        //     const formElements = [loginForm, ...Array.from(loginForm.children)];
            
        //     // 向上查找几级父元素
        //     let parent = loginForm.parentElement;
        //     for (let i = 0; i < 3 && parent; i++) {
        //       formElements.push(parent);
        //       parent = parent.parentElement;
        //     }
            
        //     // 在这些元素中检查错误文本
        //     for (const element of formElements) {
        //       const elementText = element.textContent || '';
        //       if (errorTexts.some(errorText => elementText.includes(errorText))) {
        //         return true;
        //       }
        //     }
            
        //     return false;
        //   });
          
        //   if (hasErrorMessage) {
        //     console.log(`账号 ${account.email} 登录失败：邮箱或密码不正确`);
        //     console.log('跳过当前账号，处理下一个账号...');
        //     continue;
        //   }
          
          console.log('未检测到明确的错误消息，尝试重启浏览器并重试...');
        // } else {
        //   console.log('登录页面已变化，但未成功进入工作区。尝试重启浏览器并重试...');
        // }
        await browser.close();
        console.log('浏览器已关闭，即将重新尝试...');
        
        // 延迟一段时间后重启浏览器重试
        await delay(3000 + Math.random() * 2000);
        i--; // 减少计数，确保重试当前账号
        continue; // 跳过当前迭代，重新开始
      }
      
      console.log('刷新token流程执行完成！');
      
    } catch (error) {
      console.error('发生错误:', error);
    } finally {
      console.log('操作完成。');
      
      // 根据配置决定是否自动关闭浏览器
      if (config.autoCloseBrowser) {
        console.log('正在关闭浏览器...');
        await browser.close();
      } else {
        console.log('保持浏览器打开以便查看结果...');
      }
    }
  }
  
  console.log(`所有 ${refreshAccounts.length} 个账号的token刷新任务已完成!`);
}

// 主函数
async function registerPromptLayer() {
  // 加载配置
  const config = await loadConfig();
  
  // 注册次数
  const registrationCount = config.registrationCount || 1;
  console.log(`计划注册账号数量: ${registrationCount}`);
  
  for (let i = 0; i < registrationCount; i++) {
    if (i > 0) {
      console.log(`\n开始第 ${i+1}/${registrationCount} 个账号的注册...\n`);
      // 在多次注册之间添加随机延迟
      await delay(3000 + Math.random() * 5000);
    } else {
      console.log(`\n开始第 ${i+1}/${registrationCount} 个账号的注册...\n`);
    }
    
    // 生成用户信息
    const userInfo = generateUserInfo(config);
    const companyName = generateCompanyName();
    
    console.log(`使用的邮箱: ${userInfo.email}`);
    console.log(`使用的姓名: ${userInfo.fullName}`);
    console.log(`使用的密码: ${userInfo.password}`);
    
    const browser = await setupBrowser();
    
    try {
      const page = await setupPage(browser);
      
      // 注册流程
      console.log('访问主页以建立会话...');
      await page.goto('https://dashboard.promptlayer.com/', {
        waitUntil: 'networkidle2',
        timeout: 60000
      });
      
      await delay(2000 + Math.random() * 2000);
      
      // 导航到注册页面
      const createAccountLink = await page.$('a[href="/create-account"]');
      if (createAccountLink) {
        await createAccountLink.click();
        await page.waitForNavigation({ waitUntil: 'networkidle2' });
      } else {
        console.log('正在访问注册页面...');
        await page.goto('https://dashboard.promptlayer.com/create-account', {
          waitUntil: 'networkidle2',
          timeout: 60000
        });
      }
      
      await page.waitForSelector('#email', { visible: true });
      await delay(1000 + Math.random() * 1000);
      
      // 填写注册表单
      await fillRegistrationForm(page, userInfo);
      
      // 提交表单
      await page.evaluate(() => {
        document.querySelectorAll('input').forEach(input => input.blur());
      });
      
      console.log('等待按钮变为可点击状态...');
      await page.waitForFunction(
        () => !document.querySelector('button[type="submit"]').disabled,
        { timeout: 30000 }
      );
      
      await page.evaluate(() => {
        const submitBtn = document.querySelector('button[type="submit"]');
        if (submitBtn) {
          submitBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });
      
      await delay(1000 + Math.random() * 1000);
      
      const submitButton = await page.$('button[type="submit"]');
      const buttonBox = await submitButton.boundingBox();
      
      await page.mouse.move(
        buttonBox.x + buttonBox.width / 2 + (Math.random() * 10 - 5),
        buttonBox.y + buttonBox.height / 2 + (Math.random() * 10 - 5),
        { steps: 10 }
      );
      
      await delay(500 + Math.random() * 500);
      
      console.log('点击创建账户按钮...');
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 9000 }).catch(() => {}),
        submitButton.click({ delay: 50 })
      ]);
      
      console.log('注册表单已提交！');
      await delay(5000);
      
      const currentUrl = page.url();
      let workspaceId = null;
      
// 处理 Onboarding 流程
    if (currentUrl.includes('/onboarding')) {
      await handleOnboarding(page, companyName);
      await saveAccountInfo(userInfo, companyName, null, null);
    } else {
      // 这里表示失败，关闭浏览器实例，然后重新尝试
      console.log('注册失败，URL仍然在注册页面。准备重试...');
      await browser.close();
      console.log('浏览器已关闭，即将重新尝试...');
      
      // 延迟一段时间后重试
      await delay(3000 + Math.random() * 2000);
      i--; // 减少计数，确保重试当前账号
      continue; // 跳过当前迭代，重新开始
    }
      
      // 只有当成功进入 Onboarding 流程后，才处理后续步骤
      workspaceId = await handlePostOnboarding(page);
      
      // 捕获 Token
      const authToken = await captureToken(page);
      
      // 保存完整信息
      if (authToken) {
        await saveAccountInfo(userInfo, companyName, authToken, workspaceId);
      }
      
      console.log('所有步骤执行完成！');
      
    } catch (error) {
      console.error('发生错误:', error);
    } finally {
      console.log('操作完成。');
      
      // 根据配置决定是否自动关闭浏览器
      if (config.autoCloseBrowser) {
        console.log('正在关闭浏览器...');
        await browser.close();
      } else {
        console.log('保持浏览器打开以便查看结果...');
      }
    }
  }
  
  console.log(`所有 ${registrationCount} 个账号注册任务已完成!`);
}

// 根据配置的运行模式启动不同的功能
async function main() {
  // 加载配置
  const config = await loadConfig();
  
  // 根据运行模式执行不同的功能
  if (config.runMode === "refresh") {
    console.log('启动刷新token模式...');
    await refreshTokens();
  } else {
    // 默认为注册模式
    console.log('启动注册模式...');
    await registerPromptLayer();
  }
}

// 执行主函数
main().catch(console.error);
