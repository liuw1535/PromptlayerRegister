const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { randomBytes } = require('crypto');
const path = require('path');

// 使用Stealth插件提高隐蔽性
puppeteer.use(StealthPlugin());

// 创建Express应用
const app = express();
const PORT = process.env.PORT || 7000;

// 中间件
app.use(cors());
app.use(bodyParser.json());

// 默认配置
const DEFAULT_CONFIG = {
  browserPath: '',
  headless: false,
  slowMo: 0,
  emailDomains: [
    '@vkgl.keomiao.space',
    '@coat.suitbase.cfd',
    '@gost.suitbase.cfd',
    '@ltd.keomiao.space'
  ]
};

// 加载配置
function loadConfig() {
  try {
    const userConfig = require('./config.js');
    return { ...DEFAULT_CONFIG, ...userConfig };
  } catch (error) {
    return DEFAULT_CONFIG;
  }
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
    const xpathBtn = await page.waitForXPath(`//button[contains(text(), "${buttonText}")]`).catch(() => null);
    if (xpathBtn) {
      await xpathBtn.click();
      console.log(`点击了 ${buttonText} 按钮 (XPath)`);
      return true;
    }
  }
  return false;
}

// 配置浏览器
async function setupBrowser(config) {
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

  if (config.browserPath) {
    launchOptions.executablePath = config.browserPath;
  }

  return await puppeteer.launch(launchOptions);
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

  // 步骤 6: 选择圆形选择框
  console.log('步骤 6: 选择圆形选择框...');
  await delay(2000);

  const circleSpan = await page.$('span.h-4.w-4.rounded-full.border.border-gray-300.bg-white');
  if (circleSpan) {
    await circleSpan.click();
    console.log('点击了圆形选择框');
    await delay(1000);
  }

  // 步骤 7: 点击 Finish 按钮提交
  console.log('步骤 7: 点击 Finish 按钮...');
  await delay(1000);
  await findAndClickButton(page, 'Finish', true);
  await delay(3000);

  console.log('Onboarding 流程完成！');
}

// 捕获Token
async function captureToken(page) {
  let authToken = null;
  page.removeAllListeners('request');

  const capturePromise = new Promise(resolve => {
    const listener = request => {
      if (request.url().includes('api.promptlayer.com/get-user')) {
        const auth = request.headers()['authorization'];
        if (auth) {
          authToken = auth.replace('Bearer ', '').trim();
          page.off('request', listener);
          resolve(authToken);
        }
      }
      request.resourceType() === 'image' || request.resourceType() === 'font' ? request.abort() : request.continue();
    };
    page.on('request', listener);
  });

  page.reload({ waitUntil: 'networkidle2' }).catch(() => {});
  return await Promise.race([capturePromise, new Promise(resolve => setTimeout(() => resolve(authToken), 10000))]);
}

// 构建账户数据
function buildAccountData(userInfo, companyName, authToken, workspaceId) {
  return authToken ? {
    email: userInfo.email,
    password: userInfo.password,
    name: userInfo.fullName,
    company: companyName,
    token: authToken,
    workspaceId,
    timestamp: new Date().toISOString()
  } : null;
}

// 注册账号函数
async function registerAccount(browser, config, emailDomain = null) {
  if (emailDomain) {
    config = { ...config, emailDomains: [emailDomain] };
  }

  const userInfo = generateUserInfo(config);
  const companyName = generateCompanyName();
  console.log(`注册: ${userInfo.email}`);

  let accountData = null;
  let retryCount = 0;
  const maxRetries = 3;

  while (retryCount < maxRetries && !accountData) {
    let page;
    try {
      page = await setupPage(browser);

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
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 9000 }).catch(() => { }),
        submitButton.click({ delay: 50 })
      ]);

      console.log('注册表单已提交！');
      await delay(5000);

      if (page.url().includes('/onboarding')) {
        // 处理Onboarding流程
        await handleOnboarding(page, companyName);
        
        // 捕获Token
        const authToken = await captureToken(page);
        if (authToken) {
          accountData = buildAccountData(userInfo, companyName, authToken, null);
          console.log('注册成功!');
        }
      } else {
        retryCount++;
        console.log(`重试 ${retryCount}/${maxRetries}`);
        await delay(3000);
      }
    } catch (error) {
      console.error('错误:', error.message);
      retryCount++;
      await delay(3000);
    } finally {
      if (page) await page.close().catch(() => {});
    }
  }

  return accountData;
}

// 刷新token函数
async function refreshToken(browser, account) {
  let newToken = null;
  let retryCount = 0;
  const maxRetries = 3;

  while (retryCount < maxRetries && !newToken) {
    let page;
    try {
      page = await setupPage(browser);

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
          page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 2000 }).catch(() => { }),
          loginButton.click({ delay: 50 })
        ]);

        console.log('登录表单已提交！');
        await delay(3000);
      } else {
        console.log('未找到登录按钮');
        retryCount++;
        continue;
      }

      const hasError = await page.evaluate(() => 
        Array.from(document.querySelectorAll('div')).some(d => d.textContent?.includes('Email and or password is incorrect'))
      );

      if (hasError && page.url().includes('/login')) {
        return { email: account.email, token: null, error: '邮箱或密码不正确' };
      }

      await delay(5000);

      if (page.url().includes('/workspace/') && page.url().includes('/home')) {
        const authToken = await captureToken(page);
        if (authToken) {
          newToken = authToken;
          console.log('Token刷新成功!');
        } else {
          retryCount++;
        }
      } else {
        retryCount++;
      }

    } catch (error) {
      console.error('错误:', error.message);
      retryCount++;
    } finally {
      if (page) await page.close().catch(() => {});
    }
  }

  return { email: account.email, token: newToken };
}

// API路由

// 注册账号接口
app.post('/api/register', async (req, res) => {
  const { count = 1, emailDomain } = req.body || {};
  
  if (count < 1 || count > 100) {
    return res.status(400).json({ error: '注册数量必须在1-100之间' });
  }

  const config = loadConfig();
  const browser = await setupBrowser(config);
  const results = [];

  try {
    for (let i = 0; i < count; i++) {
      console.log(`[${i + 1}/${count}] 注册中...`);
      const accountData = await registerAccount(browser, config, emailDomain);
      if (accountData) results.push(accountData);
    }

    return res.json({
      success: true,
      registered: results.length,
      accounts: results
    });
  } catch (error) {
    console.error('注册错误:', error);
    return res.status(500).json({ error: error.message });
  } finally {
    await browser.close().catch(() => {});
  }
});

// 刷新token接口
app.post('/api/refresh', async (req, res) => {
  const { accounts } = req.body || {};

  if (!accounts || !Array.isArray(accounts) || accounts.length === 0) {
    return res.status(400).json({ error: '请提供有效的账号列表' });
  }

  if (accounts.length > 100) {
    return res.status(400).json({ error: '一次最多刷新100个账号' });
  }

  const config = loadConfig();
  const browser = await setupBrowser(config);
  const results = [];

  try {
    for (let i = 0; i < accounts.length; i++) {
      const account = accounts[i];

      if (!account.email || !account.password) {
        results.push({ email: account.email || 'unknown', token: null, error: '缺少邮箱或密码' });
        continue;
      }

      console.log(`[${i + 1}/${accounts.length}] 刷新: ${account.email}`);
      const result = await refreshToken(browser, account);
      results.push(result);
    }

    const successCount = results.filter(r => r.token).length;
    return res.json({
      success: true,
      refreshed: successCount,
      accounts: results
    });
  } catch (error) {
    console.error('刷新错误:', error);
    return res.status(500).json({ error: error.message });
  } finally {
    await browser.close().catch(() => {});
  }
});

// 启动服务器
app.listen(PORT, '0.0.0.0', () => {
  console.log(`服务器已启动，监听端口 ${PORT}`);
  console.log(`注册接口: POST http://localhost:${PORT}/api/register`);
  console.log(`刷新接口: POST http://localhost:${PORT}/api/refresh`);
});
