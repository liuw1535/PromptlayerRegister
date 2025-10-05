const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { randomBytes } = require('crypto');
const fs = require('fs').promises;
const path = require('path');

// 使用Stealth插件提高隐蔽性
puppeteer.use(StealthPlugin());

// 创建Express应用
const app = express();
const PORT = process.env.PORT || 6000;

// 中间件
app.use(cors());
app.use(bodyParser.json());

// 默认配置
const DEFAULT_CONFIG = {
  // 可以指定Chrome浏览器路径，例如：'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  browserPath: '',
  headless: false,
  slowMo: 0, // 放慢操作速度，便于调试
  defaultOutputDir: './output',
  emailDomains: [
    '@vkgl.keomiao.space',
    '@coat.suitbase.cfd',
    '@gost.suitbase.cfd',
    '@ltd.keomiao.space'
  ]
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

  await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => { });
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
  console.log('步骤 2: 关闭首页弹窗...');
  await delay(2000);
  const closeButtonSelector = '[id^="radix-"] button:nth-child(2)>svg';
  const closeButton = await page.waitForSelector(closeButtonSelector);
  await closeButton.click();


  // 步骤 4: 点击 "spanButton" 按钮
  console.log('步骤 3: 点击 spanButton 按钮...');
  await delay(2000);
  const spanButtonSelector = "#registry-core h3 span";
  const spanButton = await page.waitForSelector(spanButtonSelector, { visible: true });
  await spanButton.click();

  await delay(3000);

  // 步骤 5: 页面跳转后，点击span元素进入有Run按钮的界面
  console.log('步骤 4: 点击Editor进入Run界面...');
  const EditorSelector = 'div:nth-child(3) > a > span > span';
  const Editor = await page.waitForSelector(EditorSelector, { visible: true });
  Editor.click();
  if (Editor) {
    console.log('Editor点击成功');
  } else {
    console.log('Editor点击失败');
  }

  await delay(2000);

  // 步骤 7: 点击 Run 按钮
  console.log('步骤 5: 点击 Run 按钮...');
  await delay(2000);
  const runButtonSeletor = "button>div>span:nth-child(1)";
  const runButton = await page.waitForSelector(runButtonSeletor, { visible: true });
  await runButton.click();
  if (runButton) {
    console.log("点击了Run按钮");
  } else {
    console.log("点击Run按钮失败");
  }
  await runButton.click();
  await delay(2000);

  // 步骤 8: 再次点击 Run
  await runButton.click();
  console.log('再次点击Run按钮...');

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
          page.off('request', requestListener);
          resolve();
        }
      }
    };

    page.on('request', requestListener);
  });

  await tokenPromise;
  if (!tokenCaptured) {
    console.log("捕获失败");
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

    return accountData;
  }

  return null;
}

// 注册账号函数
async function registerAccount(emailDomain = null) {
  // 加载配置
  const config = await loadConfig();

  // 如果提供了自定义邮箱域名，则使用它
  if (emailDomain) {
    config.emailDomains = [emailDomain];
  }

  // 生成用户信息
  const userInfo = generateUserInfo(config);
  const companyName = generateCompanyName();

  console.log(`使用的邮箱: ${userInfo.email}`);
  console.log(`使用的姓名: ${userInfo.fullName}`);
  console.log(`使用的密码: ${userInfo.password}`);

  const browser = await setupBrowser();
  let accountData = null;
  let retryCount = 0;
  const maxRetries = 3;

  while (retryCount < maxRetries && !accountData) {
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
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 9000 }).catch(() => { }),
        submitButton.click({ delay: 50 })
      ]);

      console.log('注册表单已提交！');
      await delay(5000);

      const currentUrl = page.url();
      let workspaceId = null;

      // 处理 Onboarding 流程
      if (currentUrl.includes('/onboarding')) {
        await handleOnboarding(page, companyName);

        // 只有当成功进入 Onboarding 流程后，才处理后续步骤
        workspaceId = await handlePostOnboarding(page);

        // 捕获 Token
        const authToken = await captureToken(page);

        // 保存完整信息
        if (authToken) {
          accountData = await saveAccountInfo(userInfo, companyName, authToken, workspaceId);
        }

        console.log('所有步骤执行完成！');
      } else {
        // 这里表示失败，关闭浏览器实例，然后重新尝试
        console.log('注册失败，URL仍然在注册页面。准备重试...');
        retryCount++;
        console.log(`重试次数: ${retryCount}/${maxRetries}`);
        await delay(3000 + Math.random() * 2000);
      }

    } catch (error) {
      console.error('发生错误:', error);
      retryCount++;
      console.log(`重试次数: ${retryCount}/${maxRetries}`);
      await delay(3000 + Math.random() * 2000);
    }
  }

  // 关闭浏览器
  await browser.close();

  return accountData;
}

// 刷新token函数
async function refreshToken(account) {
  const browser = await setupBrowser();
  let newToken = null;
  let retryCount = 0;
  const maxRetries = 3;

  while (retryCount < maxRetries && !newToken) {
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
        // 邮箱或密码不正确的错误不需要重试，直接返回错误信息
        return {
          email: account.email,
          token: null,
          error: '邮箱或密码不正确'
        };
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

        // 创建一个Promise，当捕获到token时解决
        const captureTokenPromise = new Promise(resolve => {
          const requestListener = request => {
            const url = request.url();
            if (url.includes('api.promptlayer.com/get-user')) {
              const headers = request.headers();
              if (headers['authorization']) {
                authToken = headers['authorization'].replace('Bearer ', '').trim();
                console.log('捕获到 Authorization Token!');
                page.off('request', requestListener);
                resolve();
              }
            }
          };
          // 添加新的请求监听器
          page.on('request', requestListener);
        });
        await page.reload({ waitUntil: 'networkidle2' });
        await captureTokenPromise;
        await delay(2000);
        // 保存刷新的token
        if (authToken) {
          newToken = authToken;

          // 保存到文件
          const refreshData = {
            email: account.email,
            token: authToken,
            refreshed_at: new Date().toISOString()
          };

          // 保存为文本格式
          const textData = `
===============================
Email: ${account.email}
Token: ${authToken}
Refreshed At: ${new Date().toISOString()}
===============================
`;
          await fs.appendFile('refreshed_tokens.txt', textData);

          console.log('刷新的 Token 已保存！');
          console.log('Email:', account.email);
          console.log('Token:', authToken);
        } else {
          console.log(`无法获取账号 ${account.email} 的token`);
          retryCount++;
        }
      } else {
        console.log(`当前URL: ${currentUrl}`);
        console.log('未成功进入工作区。尝试重试...');
        retryCount++;
      }

    } catch (error) {
      console.error('发生错误:', error);
      retryCount++;
    }
  }

  // 关闭浏览器
  await browser.close();

  return { email: account.email, token: newToken };
}

// API路由

// 注册账号接口
app.post('/api/register', async (req, res) => {
  try {
    // 确保req.body存在，并提供默认值
    const body = req.body || {};
    const count = body.count !== undefined ? body.count : 1;
    const emailDomain = body.emailDomain;

    if (count < 1 || count > 100) {
      return res.status(400).json({ error: '注册数量必须在1-100之间' });
    }

    console.log(`开始注册 ${count} 个账号...`);

    const results = [];
    for (let i = 0; i < count; i++) {
      console.log(`注册第 ${i + 1}/${count} 个账号`);
      const accountData = await registerAccount(emailDomain);
      if (accountData) {
        results.push(accountData);
      }
    }

    console.log(`成功注册 ${results.length}/${count} 个账号`);

    return res.json({
      success: true,
      registered: results.length,
      accounts: results
    });
  } catch (error) {
    console.error('注册接口错误:', error);
    return res.status(500).json({ error: '服务器内部错误', message: error.message });
  }
});

// 刷新token接口
app.post('/api/refresh', async (req, res) => {
  try {
    const { accounts } = req.body;

    if (!accounts || !Array.isArray(accounts) || accounts.length === 0) {
      return res.status(400).json({ error: '请提供有效的账号列表' });
    }

    if (accounts.length > 100) {
      return res.status(400).json({ error: '一次最多刷新100个账号' });
    }

    console.log(`开始刷新 ${accounts.length} 个账号的token...`);

    const results = [];
    for (let i = 0; i < accounts.length; i++) {
      const account = accounts[i];

      if (!account.email || !account.password) {
        console.log(`跳过第 ${i + 1} 个账号，缺少邮箱或密码`);
        results.push({ email: account.email || 'unknown', token: null, error: '缺少邮箱或密码' });
        continue;
      }

      console.log(`刷新第 ${i + 1}/${accounts.length} 个账号的token: ${account.email}`);
      const result = await refreshToken(account);
      results.push(result);
    }

    const successCount = results.filter(r => r.token).length;
    console.log(`成功刷新 ${successCount}/${accounts.length} 个账号的token`);

    return res.json({
      success: true,
      refreshed: successCount,
      accounts: results
    });
  } catch (error) {
    console.error('刷新token接口错误:', error);
    return res.status(500).json({ error: '服务器内部错误', message: error.message });
  }
});

// 启动服务器
app.listen(PORT, '0.0.0.0', () => {
  console.log(`服务器已启动，监听端口 ${PORT}`);
  console.log(`注册接口: POST http://localhost:${PORT}/api/register`);
  console.log(`刷新接口: POST http://localhost:${PORT}/api/refresh`);
});
