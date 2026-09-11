// ==UserScript==
// @name         携程商旅乘机人自动填写 (SSR DOCS 解析)
// @namespace    https://example.com/
// @version      3.2
// @description  在携程商旅乘客页自动填写护照信息（SSR DOCS 格式解析；默认空白乘机人卡，按 SSR 数量自动点"添加乘机人"补足后逐卡填写；手机号/邮箱严格校验）
// @author       胡朗
// @match        https://ct.ctrip.com/corp-flight-booking/*
// @grant        none
// @run-at       document-idle
// @updateURL    https://raw.githubusercontent.com/yuemeihua/yuemeihua-scripts/main/shanglv.js
// @downloadURL  https://raw.githubusercontent.com/yuemeihua/yuemeihua-scripts/main/shanglv.js
// ==/UserScript==

/*
更新日志：
v3.2 (2026-09-08)
- 彻底废弃"请选择乘机人"弹窗选人方案，改用"添加乘机人"按钮直接新增空白卡：
  预订页打开默认 1 张空白乘机人卡，SSR 有 N 人就自动点 N-1 次"添加乘机人"补足，再逐卡填写
- 删除黑名单/锁定乘客识别/弹窗勾选/拼音搜人等全部旧逻辑（空白卡不存在锁定问题）
- 卡数多于 SSR 人数时不删卡，只填前 N 张
- 全部统一为清空重填模式（SSR 数据为准）
- 保留：中文姓名清空、联系人姓名（选填）清空、手机号 18610429740 / 邮箱 yuemeihuafly@163.com
  严格校验（是则不改，不是则改）、"员工管理修改"提示弹窗自动关闭、会话过期提示
*/

/*
更新日志：
v3.1 (2026-09-08)
- "填写全部"升级为完整流程：自动勾选乘机人→清空→填充 SSR；黑名单机制；锁定乘客替换
*/

/*
更新日志：
v3.0 (2026-09-08)
- 适配携程商旅新版预订页：新增"请选择乘机人"弹窗步骤
- 全语义化定位（placeholder/label 文本/属性包含匹配），不依赖组件版本号
*/

/*
更新日志：
v2.0 (2026-06-15)
- 修复国籍/证件签署国因携程组件版本号变更（2311→2362）导致无法填写的问题
- 新增证件类型自动选择（国际航班默认"护照"）
*/

/*
更新日志：
v1.9 (2025-11-25)
- 优化填写逻辑，增加复核机制
*/

/*
更新日志：
v1.8 (2025-10-28)
- 增加国家BGD孟加拉国映射
*/

/*
更新日志：
v1.7 (2025-10-09)
- 更改插件位置 避免遮挡携程官网价格
*/

/*
更新日志：
v1.6 (2025-09-29)
- 支持两字国籍代码填写
*/

/*
更新日志：
v1.0~v1.5 (2025-09)
- 初始版本：支持姓名、性别、出生日期、国籍自动填充
*/

(function () {
  'use strict';

  const passportsDataVarName = 'passportsData';
  window[passportsDataVarName] = [];

  const defaultInput = ``;

  // 国家/地区映射 - 修改为中国大陆等中文名称
  const COUNTRY_MAP = {
    "CHN": "中国大陆",
    "CN": "中国大陆",
    'HKG': "中国香港",
    'MAC': "中国澳门",
    'TWN': "中国台湾",
    'USA': "美国",
    'CAN': "加拿大",
    'GBR': "英国",
    'FRA': "法国",
    'DEU': "德国",
    'JPN': "日本",
    'KOR': "韩国",
    'RUS': "俄罗斯",
    'AUS': "澳大利亚",
    'NZL': "新西兰",
    'SGP': "新加坡",
    'MYS': "马来西亚",
    'THA': "泰国",
    'VNM': "越南",
    'IDN': "印度尼西亚",
    'IND': "印度",
    'BRA': "巴西",
    'ARG': "阿根廷",
    'ZAF': "南非",
    'EGY': "埃及",
    'TUR': "土耳其",
    'SAU': "沙特阿拉伯",
    'ARE': "阿联酋",
    'ISR': "以色列",
    'CHE': "瑞士",
    'SWE': "瑞典",
    'NOR': "挪威",
    'DNK': "丹麦",
    'FIN': "芬兰",
    'NLD': "荷兰",
    'BEL': "比利时",
    'AUT': "奥地利",
    'ESP': "西班牙",
    'ITA': "意大利",
    'GRC': "希腊",
    'PRT': "葡萄牙",
    'POL': "波兰",
    'CZE': "捷克",
    'HUN': "匈牙利",
    'ROU': "罗马尼亚",
    'BGR': "保加利亚",
    'HRV': "克罗地亚",
    'SRB': "塞尔维亚",
    'UKR': "乌克兰",
    'BLR': "白俄罗斯",
    'KAZ': "哈萨克斯坦",
    'UZB': "乌兹别克斯坦",
    'GEO': "格鲁吉亚",
    'ARM': "亚美尼亚",
    'LVA': "拉脱维亚",
    'LTU': "立陶宛",
    'EST': "爱沙尼亚",
    'SVK': "斯洛伐克",
    'SVN': "斯洛文尼亚",
    'CYP': "塞浦路斯",
    'LUX': "卢森堡",
    'ISL': "冰岛",
    'MEX': "墨西哥",
    'COL': "哥伦比亚",
    'CHL': "智利",
    'PER': "秘鲁",
    'VEN': "委内瑞拉",
    'ECU': "厄瓜多尔",
    'URY': "乌拉圭",
    'BGD': "孟加拉国",
    'PAK': "巴基斯坦",
    'LKA': "斯里兰卡",
    'NPL': "尼泊尔",
    'MMR': "缅甸",
    'KHM': "柬埔寨",
    'LAO': "老挝",
    'PHL': "菲律宾",
    'BRN': "文莱",
    'MNG': "蒙古",
    'IRL': "爱尔兰",
    // 可继续添加更多国家代码映射
  };

  // 默认手机号（严格校验：不是该值就改）
  const DEFAULT_PHONE = '18610429740';
  // 默认邮箱（严格校验）
  const DEFAULT_EMAIL = 'yuemeihuafly@163.com';

  function logToConsole(...args) {
    console.log('[携程填写]', ...args);
    appendLog(args.join(' '));
  }

  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

  function appendLog(text) {
    const area = document.getElementById('ctrip-log-area');
    if (!area) return;
    const now = new Date().toLocaleTimeString();
    area.value += `[${now}] ${text}\n`;
    area.scrollTop = area.scrollHeight;
  }

  function clearLog() {
    const area = document.getElementById('ctrip-log-area');
    if (area) area.value = '';
  }

  function nativeSetValue(input, val) {
    if (!input) return;
    const proto = input.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
    const nativeSetter = Object.getOwnPropertyDescriptor(proto, 'value').set;
    if (nativeSetter) nativeSetter.call(input, val);
    else input.value = val;
  }

  function normalizeText(s) {
    return (s || '').replace(/\s+/g, '').trim();
  }

  // ============ 语义定位工具（版本无关） ============

  // 在容器内按 placeholder 关键词找输入框（任一关键词命中即可）
  function findInputByPlaceholder(root, keywords) {
    if (!root) return null;
    const inputs = Array.from(root.querySelectorAll('input[type="text"], input:not([type])'));
    for (const kw of keywords) {
      const hit = inputs.find(i => i.offsetParent !== null && (i.placeholder || '').includes(kw));
      if (hit) return hit;
    }
    return null;
  }

  // 在容器内找文本精确匹配的元素（label 文本定位）
  function findLabelEl(root, text) {
    if (!root) return null;
    const target = normalizeText(text);
    if (!target) return null;
    return Array.from(root.querySelectorAll('div, span, label')).find(el => {
      if (el.offsetParent === null) return false;
      if (el.children.length > 2) return false;
      return normalizeText(el.textContent) === target;
    }) || null;
  }

  // 从任意元素向上爬，找最近的 select 触发器（属性包含匹配，规避版本号）
  function closestSelectTrigger(el, maxUp = 6) {
    let node = el;
    for (let i = 0; i < maxUp && node; i++) {
      const trigger = node.querySelector && node.querySelector('[class*="-select-selector"]');
      if (trigger) return trigger;
      node = node.parentElement;
    }
    return null;
  }

  // 按 label 文本定位卡片内某个下拉框触发器；失败时按出现顺序兜底
  // selectOrder: 0=国籍 1=证件类型 2=证件签署国（表单布局顺序，新旧版一致）
  function findSelectTrigger(card, labelText, selectOrder) {
    const labelEl = findLabelEl(card, labelText);
    if (labelEl) {
      const trigger = closestSelectTrigger(labelEl);
      if (trigger) return trigger;
    }
    const all = Array.from(card.querySelectorAll('[class*="-select-selector"]')).filter(s => s.offsetParent !== null);
    return all[selectOrder] || null;
  }

  // 触发点击（mousedown/mouseup/click 完整序列）
  function triggerClick(el) {
    if (!el) return;
    ['mousedown', 'mouseup', 'click'].forEach(t =>
      el.dispatchEvent(new MouseEvent(t, { bubbles: true, cancelable: true, view: window }))
    );
  }

  // 找当前可见的下拉面板
  function findVisibleDropdown() {
    return Array.from(document.querySelectorAll('[class*="select-dropdown"], [class*="Select-dropdown"]')).find(d => {
      if (d.offsetParent === null) return false;
      if (/leave|hidden/.test(d.className || '')) return false;
      return d.getBoundingClientRect().height > 10;
    }) || null;
  }

  // 打开下拉并等待面板出现
  async function openDropdown(trigger, timeout = 2500) {
    triggerClick(trigger);
    const start = Date.now();
    while (Date.now() - start < timeout) {
      await sleep(200);
      const dd = findVisibleDropdown();
      if (dd) return dd;
      triggerClick(trigger); // 再试一次
      await sleep(200);
    }
    return null;
  }

  // 在下拉面板中选择选项（按文本精确匹配）
  // searchable=true 时先在面板搜索框中输入文本过滤
  // 注意：每轮重试都重新获取可见面板，防止 React 重渲染导致引用失效
  async function pickDropdownOption(dropdownGetter, text, { searchable = false, retries = 3 } = {}) {
    for (let i = 1; i <= retries; i++) {
      const dropdown = typeof dropdownGetter === 'function' ? dropdownGetter() : dropdownGetter;
      if (!dropdown) {
        await sleep(300);
        continue;
      }
      if (searchable) {
        const searchInput = dropdown.querySelector('input');
        if (searchInput) {
          nativeSetValue(searchInput, text);
          searchInput.dispatchEvent(new Event('input', { bubbles: true }));
          await sleep(700);
        }
      }
      // 优先国家选项元素，其次通用选项元素，最后任意文本匹配的可点击元素
      const dd = (typeof dropdownGetter === 'function' ? dropdownGetter() : dropdown) || dropdown;
      const candidates = Array.from(dd.querySelectorAll('[class*="country-item"], [class*="item-option"], [class*="select-item"]'))
        .filter(e => e.offsetParent !== null);
      const match = candidates.find(e => normalizeText(e.textContent) === normalizeText(text));
      if (match) {
        triggerClick(match);
        return true;
      }
      const leaves = Array.from(dd.querySelectorAll('div, span, li'))
        .filter(e => e.offsetParent !== null && e.children.length === 0 && normalizeText(e.textContent) === normalizeText(text));
      if (leaves.length > 0) {
        triggerClick(leaves[0].parentElement || leaves[0]);
        return true;
      }
      logToConsole(`⚠️ 下拉选项第 ${i} 次未找到：${text}，重试`);
      await sleep(400);
    }
    return false;
  }

  // ============ 输入填写（带校验重试） ============

  function dispatchInputEvents(input) {
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function dispatchEnter(input) {
    ['keydown', 'keyup'].forEach(t =>
      input.dispatchEvent(new KeyboardEvent(t, { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true, cancelable: true }))
    );
  }

  async function ensureInputValue(input, value, label = '字段', { retries = 4, withEnter = false } = {}) {
    if (!input) {
      logToConsole(`❌ 未找到${label}输入框`);
      return false;
    }
    for (let i = 1; i <= retries; i++) {
      input.focus && input.focus();
      nativeSetValue(input, value);
      dispatchInputEvents(input);
      if (withEnter) dispatchEnter(input);
      await sleep(250);
      if (normalizeText(input.value) === normalizeText(value)) {
        logToConsole(`✅ ${label}已填写：${value}`);
        return true;
      }
      await sleep(200);
    }
    logToConsole(`❌ ${label}多次填写失败，请手动检查`);
    return false;
  }

  // ============ 字段级填写 ============

  async function fillBirthDate(card, value) {
    const input = findInputByPlaceholder(card, ['出生日期', '生日']);
    return ensureInputValue(input, value, '出生日期', { withEnter: true, retries: 5 });
  }

  async function fillPassportNumber(card, value) {
    const input = findInputByPlaceholder(card, ['证件号码', '护照号']);
    return ensureInputValue(input, value, '证件号码', { retries: 4 });
  }

  async function fillExpiryDate(card, value) {
    const input = findInputByPlaceholder(card, ['证件有效期', '有效期']);
    return ensureInputValue(input, value, '证件有效期', { withEnter: true, retries: 5 });
  }

  async function selectGender(card, gender) {
    if (!gender) return false;
    const value = gender.toUpperCase().startsWith('M') ? 'M' : 'F';
    const text = value === 'M' ? '男' : '女';
    // 优先 radio[value=M/F]
    let radio = card.querySelector(`input[type="radio"][value="${value}"]`);
    // 兜底：找包含 男/女 文本的 label 内 radio
    if (!radio) {
      const labelEl = findLabelEl(card, text);
      if (labelEl) {
        const wrap = labelEl.closest('label') || labelEl.parentElement;
        radio = wrap && wrap.querySelector('input[type="radio"]');
      }
    }
    if (!radio) {
      logToConsole(`❌ 未找到性别选项：${text}`);
      return false;
    }
    for (let i = 1; i <= 3; i++) {
      radio.click();
      await sleep(150);
      if (radio.checked) {
        logToConsole(`✅ 已选择性别：${text}`);
        return true;
      }
    }
    logToConsole(`❌ 性别选择失败：${text}`);
    return false;
  }

  // 选择国籍/证件签署国（countryLabel 传 label 文本；selectOrder 传顺序兜底值）
  async function selectCountryLike(card, country, labelText, selectOrder) {
    const trigger = findSelectTrigger(card, labelText, selectOrder);
    if (!trigger) {
      logToConsole(`❌ 未找到"${labelText}"下拉框`);
      return false;
    }
    // 若已选中则跳过（重新查询，避免 React 重渲染后引用失效）
    const current = normalizeText(findSelectTrigger(card, labelText, selectOrder)?.textContent);
    if (current === normalizeText(country)) {
      logToConsole(`✅ ${labelText}已是：${country}`);
      return true;
    }
    const dd = await openDropdown(trigger);
    if (!dd) {
      logToConsole(`❌ "${labelText}"下拉面板未打开`);
      return false;
    }
    const ok = await pickDropdownOption(findVisibleDropdown, country, { searchable: true });
    await sleep(500);
    // 校验：重新查询 trigger（React 重渲染会替换 DOM 节点，旧引用会误报失败）
    const fresh = findSelectTrigger(card, labelText, selectOrder);
    const after = normalizeText(fresh ? fresh.textContent : '');
    if (ok && after.includes(normalizeText(country))) {
      logToConsole(`✅ 已选择${labelText}：${country}`);
      return true;
    }
    logToConsole(`❌ ${labelText}选择失败（当前值：${after || '空'}）`);
    return false;
  }

  // 选择证件类型（默认护照）
  async function selectCertificateType(card, certName = '护照') {
    const trigger = findSelectTrigger(card, '证件类型', 1);
    if (!trigger) {
      logToConsole('❌ 未找到证件类型下拉框');
      return false;
    }
    const current = normalizeText(findSelectTrigger(card, '证件类型', 1)?.textContent);
    if (current === normalizeText(certName)) {
      logToConsole(`✅ 证件类型已是：${certName}`);
      return true;
    }
    const dd = await openDropdown(trigger);
    if (!dd) {
      logToConsole('❌ 证件类型下拉面板未打开');
      return false;
    }
    const ok = await pickDropdownOption(findVisibleDropdown, certName, { searchable: false });
    await sleep(500);
    const fresh = findSelectTrigger(card, '证件类型', 1);
    if (ok && normalizeText(fresh ? fresh.textContent : '') === normalizeText(certName)) {
      logToConsole(`✅ 已选择证件类型：${certName}`);
      return true;
    }
    logToConsole(`❌ 证件类型选择失败（当前值：${normalizeText(fresh ? fresh.textContent : '') || '空'}）`);
    return false;
  }

  // ============ 乘机人卡片管理 ============

  function getCardEl(index) {
    return document.getElementById(`edit_psg_box-${index}`);
  }

  function getAllCards() {
    return Array.from(document.querySelectorAll('[id^="edit_psg_box-"]'));
  }

  function detectPassengerCount() {
    const cards = getAllCards();
    logToConsole(`检测到乘机人卡片数量：${cards.length}`);
    return cards.length;
  }

  // 会话超时弹窗（"您的停留时间过长..."）检测：出现即代表预订会话失效，无法自动恢复
  function isSessionTimeoutModal(modal) {
    return modal && modal.textContent.includes('停留时间过长');
  }

  // 自动关闭"员工中文姓名、英文姓名请差旅管理员前往员工管理修改"提示弹窗
  async function dismissNameModifyPopup() {
    const modals = Array.from(document.querySelectorAll('[class*="modal-content"]')).filter(m =>
      m.offsetParent !== null && m.getBoundingClientRect().height > 0
    );
    for (const m of modals) {
      if (isSessionTimeoutModal(m)) {
        logToConsole('🛑 预订会话已过期（页面提示停留时间过长），请重新搜索航班后再运行脚本');
        const knowBtn = Array.from(m.querySelectorAll('a[role="button"], button, span')).find(el =>
          el.textContent.trim() === '知道了'
        );
        if (knowBtn) triggerClick(knowBtn.closest('a[role="button"], button') || knowBtn);
        return 'session_expired';
      }
      if (m.textContent.includes('员工管理修改') || m.textContent.includes('前往员工管理')) {
        const okBtn = Array.from(m.querySelectorAll('a[role="button"], button, span')).find(el =>
          el.offsetParent !== null && el.textContent.trim() === '好的'
        );
        if (okBtn) {
          triggerClick(okBtn.closest('a[role="button"], button') || okBtn);
          logToConsole('⚠️ 检测到"姓名需员工管理修改"弹窗，已点击好的关闭');
          await sleep(600);
          return 'dismissed';
        }
      }
    }
    return false;
  }

  // 查找"添加乘机人"按钮（语义定位：add_button 类 + 文本匹配，不依赖带哈希的 CSS module 类）
  function findAddPassengerButton() {
    return Array.from(document.querySelectorAll('div[class*="add_button"], button, a, span')).find(el =>
      el.offsetParent !== null && normalizeText(el.textContent) === '添加乘机人'
    ) || null;
  }

  // 点击"添加乘机人"新增一张空白乘机人卡，等待卡片数量 +1
  async function clickAddPassengerButton() {
    const btn = findAddPassengerButton();
    if (!btn) {
      logToConsole('❌ 未找到"添加乘机人"按钮');
      return false;
    }
    const before = getAllCards().length;
    triggerClick(btn.closest('button, a') || btn);
    const start = Date.now();
    while (Date.now() - start < 4000) {
      await sleep(300);
      if (getAllCards().length > before) {
        logToConsole(`➕ 已添加乘机人（当前 ${getAllCards().length} 位）`);
        await sleep(400);
        return true;
      }
    }
    logToConsole('⚠️ 点击"添加乘机人"后卡片数量未增加');
    return false;
  }

  // 自动补足空白乘机人卡到目标数量（SSR 人数；只增不减，多余卡不处理）
  async function addPassengersToTarget(targetCount) {
    let guard = 0;
    while (getAllCards().length < targetCount && guard++ < targetCount + 3) {
      const ok = await clickAddPassengerButton();
      if (!ok) {
        logToConsole(`⚠️ 无法继续添加乘机人（当前 ${getAllCards().length} 位，目标 ${targetCount} 位），请手动添加后重试`);
        return;
      }
    }
  }

  // ============ 单卡填写流程 ============

  // 严格填写：值已等于目标则不动，否则强制写入
  async function strictFillInput(input, value, label) {
    if (!input) {
      logToConsole(`❌ 未找到${label}输入框`);
      return false;
    }
    if (normalizeText(input.value) === normalizeText(value)) {
      logToConsole(`✅ ${label}已是：${value}，跳过`);
      return true;
    }
    const ok = await ensureInputValue(input, value, label, { retries: 4 });
    // 掩码值（如 136****2030）无法校验，视为已写入
    if (!ok && (input.value || '').includes('*')) {
      logToConsole(`⚠️ ${label}显示为掩码，无法校验，视为已填写`);
      return true;
    }
    return ok;
  }

  // 清空输入框（若有值）
  async function clearInputValue(input, label) {
    if (!input) return false;
    if (normalizeText(input.value) === '') return true; // 已空不管
    input.focus && input.focus();
    nativeSetValue(input, '');
    dispatchInputEvents(input);
    await sleep(200);
    if (normalizeText(input.value) === '') {
      logToConsole(`✅ ${label}已清空`);
      return true;
    }
    // 重试
    nativeSetValue(input, '');
    dispatchInputEvents(input);
    await sleep(200);
    if (normalizeText(input.value) === '') {
      logToConsole(`✅ ${label}已清空`);
      return true;
    }
    logToConsole(`❌ ${label}清空失败（当前值：${input.value}）`);
    return false;
  }

  // 中文姓名（选填）：一律清空留空
  async function clearChineseName(card) {
    const input = findInputByPlaceholder(card, ['陈伊伊', '中文姓名']);
    return clearInputValue(input, '中文姓名');
  }

  // 乘机人手机号：严格 18610429740
  async function fillCardPhoneStrict(card) {
    const input = findInputByPlaceholder(card, ['航司', '手机']);
    return strictFillInput(input, DEFAULT_PHONE, '乘机人手机号');
  }

  // 联系人区域（卡片外）：姓名清空 / 电话与邮箱严格填写
  async function fillContactSection() {
    // 姓名（选填）→ 清空
    const nameInput = findInputByPlaceholder(document, ['请输入名称']);
    await clearInputValue(nameInput, '联系人姓名');
    // 联系电话 → 严格
    const phoneInput = findInputByPlaceholder(document, ['接收短信通知']);
    await strictFillInput(phoneInput, DEFAULT_PHONE, '联系电话');
    // 邮箱 → 严格
    const emailInput = findInputByPlaceholder(document, ['邮箱']);
    await strictFillInput(emailInput, DEFAULT_EMAIL, '邮箱');
  }

  // 填写单张乘机人卡（统一清空重填，SSR 数据为准）
  async function fillPassengerCard(cardIndex, data) {
    const card = getCardEl(cardIndex);
    if (!card) {
      logToConsole(`未找到第${cardIndex + 1}位乘机人卡片`);
      return;
    }
    logToConsole(`开始填写第${cardIndex + 1}位乘机人信息`);
    await dismissNameModifyPopup();

    try {
      // 0. 中文姓名一律清空留空
      await clearChineseName(card);
      await sleep(150);

      // 1. 姓（拼音）
      if (data.surname) {
        const input = findInputByPlaceholder(card, ['CHEN', '姓']);
        await ensureInputValue(input, data.surname, '姓（拼音）');
        await sleep(150);
      }
      // 2. 名（拼音）
      if (data.givenName) {
        const input = findInputByPlaceholder(card, ['YIYI', '名']);
        await ensureInputValue(input, data.givenName, '名（拼音）');
        await sleep(150);
      }
      // 3. 性别
      if (data.gender) {
        await selectGender(card, data.gender);
        await sleep(150);
      }
      // 4. 出生日期
      if (data.birthdate) {
        await fillBirthDate(card, data.birthdate);
        await sleep(250);
      }
      // 5. 证件类型（默认护照；已是则内部自动跳过）
      await selectCertificateType(card, '护照');
      await sleep(150);
      // 6. 国籍
      if (data.nationalityFull) {
        await selectCountryLike(card, data.nationalityFull, '国籍（国家/地区）', 0);
        await sleep(350);
      }
      // 7. 证件号码
      if (data.passportNumber) {
        await fillPassportNumber(card, data.passportNumber);
        await sleep(250);
      } else {
        logToConsole('❌ 未提供证件号码，跳过填写');
      }
      // 8. 证件有效期
      if (data.expirationDate) {
        await fillExpiryDate(card, data.expirationDate);
        await sleep(250);
      }
      // 9. 证件签署国
      if (data.issuingCountryFull) {
        await selectCountryLike(card, data.issuingCountryFull, '证件签署国', 2);
        await sleep(250);
      }
      // 10. 乘机人手机号：严格 18610429740
      await fillCardPhoneStrict(card);
      await sleep(150);

      logToConsole(`第${cardIndex + 1}位乘机人信息填写完成`);
    } catch (e) {
      logToConsole(`填写第${cardIndex + 1}位乘机人时出错：`, e && e.message);
    }
  }

  // 填写所有乘机人：按 SSR 数量补足空白卡（点"添加乘机人"）→ 逐卡填写 → 联系人区
  async function fillAllPassengers() {
    const passports = window[passportsDataVarName] || [];
    if (passports.length === 0) {
      logToConsole('请先解析护照信息');
      return;
    }

    // 1. 按人数补足空白乘机人卡（页面默认 1 张；只增不减，卡多时只填前 N 张）
    const current = getAllCards().length;
    if (current < passports.length) {
      logToConsole(`当前 ${current} 位乘机人，需补充至 ${passports.length} 位`);
      await addPassengersToTarget(passports.length);
    } else if (current > passports.length) {
      logToConsole(`当前 ${current} 位乘机人多于 SSR 乘客数 ${passports.length} 位，只填写前 ${passports.length} 位`);
    }

    // 2. 逐卡填写
    const count = getAllCards().length;
    if (count < passports.length) {
      logToConsole(`⚠️ 卡片数 ${count} 少于 SSR 乘客数 ${passports.length}，只填写现有卡片`);
    }
    for (let i = 0; i < Math.min(count, passports.length); i++) {
      await fillPassengerCard(i, passports[i]);
      await sleep(400);
    }

    // 3. 联系人区域（姓名清空 / 电话与邮箱严格）
    await fillContactSection();

    logToConsole('所有乘机人信息填写完成');
  }

  // ============ SSR 解析（保持不变） ============

  // 日期格式转换：31JUL88 -> 1988-07-31
  function normalizeDateFlexible(s) {
    if (!s) return '';
    s = s.trim();
    const m = s.match(/^(\d{1,2})([A-Za-z]{3})(\d{2,4})$/);
    if (m) {
      const day = m[1].padStart(2, '0');
      const monStr = m[2].toUpperCase();
      const yearRaw = m[3];
      const monMap = {
        JAN: '01', FEB: '02', MAR: '03', APR: '04', MAY: '05', JUN: '06',
        JUL: '07', AUG: '08', SEP: '09', OCT: '10', NOV: '11', DEC: '12'
      };
      const month = monMap[monStr] || '01';
      let year = yearRaw.length === 2 ? (parseInt(yearRaw, 10) > 50 ? '19' + yearRaw : '20' + yearRaw) : yearRaw;
      return `${year}-${month}-${day}`;
    }
    return s;
  }

  function parseSSRLine(line) {
    const out = {
      raw: line,
      issuingCountry: '',
      passportNumber: '',
      nationality: '',
      birthdate: '',
      gender: '',
      expirationDate: '',
      surname: '',
      givenName: '',
      passengerIndex: null,
      ok: false,
      error: null
    };

    try {
      const idx = line.indexOf('P/');
      if (idx === -1) throw new Error('找不到 P/');

      let after = line.substring(idx + 2).trim();
      const parts = after.split('/');
      if (parts.length < 6) throw new Error('字段不足');

      out.issuingCountry = (parts[0] || '').toUpperCase();
      out.passportNumber = (parts[1] || '').trim();
      out.nationality = (parts[2] || '').toUpperCase();
      out.birthdate = normalizeDateFlexible(parts[3] || '');
      out.gender = (parts[4] || '').toUpperCase().substr(0, 1);
      out.expirationDate = normalizeDateFlexible(parts[5] || '');

      const rest = parts.slice(6).map(p => p.trim()).filter(Boolean);
      for (let i = rest.length - 1; i >= 0; i--) {
        const m = rest[i].match(/^P(\d+)$/i);
        if (m) {
          out.passengerIndex = parseInt(m[1], 10);
          rest.splice(i, 1);
          break;
        }
      }

      if (rest.length >= 2) {
        out.surname = rest[0];
        out.givenName = rest.slice(1).join(' ');
      }

      out.ok = true;
    } catch (e) {
      out.error = e.message;
    }
    return out;
  }

  function parsePassportsFromText(text) {
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const results = [];

    for (const line of lines) {
      if (/^SSR\s+DOCS/i.test(line)) {
        const parsed = parseSSRLine(line);
        if (parsed.ok) {
          parsed.issuingCountryFull = COUNTRY_MAP[parsed.issuingCountry] || parsed.issuingCountry;
          parsed.nationalityFull = COUNTRY_MAP[parsed.nationality] || parsed.nationality;
          results.push(parsed);
        }
      }
    }

    window[passportsDataVarName] = results;
    return results;
  }

  // ============ 控制面板 ============

  function injectPanel() {
    if (document.getElementById('ctrip-panel')) return;
    const panel = document.createElement('div');
    panel.id = 'ctrip-panel';
    panel.style.cssText = `
      position: fixed; right: 12px; top: 50%; transform: translateY(-50%); width: 460px; z-index: 999999;
      background: white; border: 1px solid #ccc; box-shadow: 0 6px 18px rgba(0,0,0,.12);
      border-radius: 8px; font-family: Arial, sans-serif; font-size: 13px;
    `;
    panel.innerHTML = `
      <div id="ctrip-header" style="cursor: move; padding: 6px 10px; background: #ff6600; color: #fff;
           border-radius: 8px 8px 0 0; display: flex; justify-content: space-between; align-items: center;">
        <span>携程商旅自动填写 v3.2</span>
        <button id="ctrip-min" style="background: transparent; border: none; color: #fff; font-size: 14px; cursor: pointer;">—</button>
      </div>
      <div id="ctrip-body" style="padding: 8px;">
        <textarea id="ctrip-input" style="width: 100%; height: 120px; font-size: 12px;
                  border: 1px solid #ddd; border-radius: 4px; padding: 6px; box-sizing: border-box;"
                  placeholder="请粘贴SSR DOCS信息...">${defaultInput}</textarea>
        <div style="margin:8px 0; display:flex; justify-content:space-between; gap:6px;">
          <button id="ctrip-parse" style="flex:1; padding:6px; border:1px solid #ddd; border-radius:4px; background:#f5f5f5; cursor:pointer;">解析护照</button>
          <button id="ctrip-detect" style="flex:1; padding:6px; border:1px solid #ddd; border-radius:4px; background:#f5f5f5; cursor:pointer;">检测卡数量</button>
          <button id="ctrip-add-passenger" style="flex:1; padding:6px; border:1px solid #ddd; border-radius:4px; background:#f5f5f5; cursor:pointer;">添加乘机人</button>
          <button id="ctrip-fill-all" style="flex:1; padding:6px; border:1px solid #ddd; border-radius:4px; background:#f5f5f5; cursor:pointer;">填写全部</button>
        </div>
        <div style="margin:8px 0; display:flex; justify-content:center; gap:6px;">
          <button id="ctrip-fill-first" style="flex:1; max-width:200px; padding:6px; border:1px solid #ddd; border-radius:4px; background:#f5f5f5; cursor:pointer;">填写第1位</button>
          <button id="ctrip-clear-log" style="flex:1; max-width:200px; padding:6px; border:1px solid #ddd; border-radius:4px; background:#f5f5f5; cursor:pointer;">清空日志</button>
        </div>
        <textarea id="ctrip-log-area" style="width: 100%; height: 140px; font-size: 12px;
                  border: 1px solid #ddd; border-radius: 4px; padding: 6px; box-sizing: border-box;"
                  readonly placeholder="日志信息..."></textarea>
      </div>
    `;

    document.body.appendChild(panel);

    // 最小化功能
    document.getElementById('ctrip-min').addEventListener('click', () => {
      const body = document.getElementById('ctrip-body');
      body.style.display = body.style.display === 'none' ? 'block' : 'none';
    });

    // 拖动功能
    const header = document.getElementById('ctrip-header');
    let isDrag = false, offsetX = 0, offsetY = 0;

    header.addEventListener('mousedown', e => {
      isDrag = true;
      offsetX = e.clientX - panel.offsetLeft;
      offsetY = e.clientY - panel.offsetTop;
      document.addEventListener('mousemove', move);
      document.addEventListener('mouseup', stop);
    });

    function move(e) {
      if (!isDrag) return;
      panel.style.left = (e.clientX - offsetX) + 'px';
      panel.style.top = (e.clientY - offsetY) + 'px';
      panel.style.right = 'auto';
    }

    function stop() {
      isDrag = false;
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mouseup', stop);
    }

    // 按钮事件
    document.getElementById('ctrip-parse').addEventListener('click', () => {
      clearLog();
      const txt = document.getElementById('ctrip-input').value;
      const parsed = parsePassportsFromText(txt);
      logToConsole('解析到', parsed.length, '条护照信息');

      parsed.forEach((p, i) => {
        logToConsole(
          `第${i + 1}位 -> 姓:${p.surname}, 名:${p.givenName}, 性别:${p.gender}, 出生:${p.birthdate}, ` +
          `国籍:${p.nationalityFull}, 签署国:${p.issuingCountryFull}, 护照号:${p.passportNumber}, 有效期:${p.expirationDate}`
        );
      });
    });

    document.getElementById('ctrip-detect').addEventListener('click', () => {
      detectPassengerCount();
    });

    document.getElementById('ctrip-add-passenger').addEventListener('click', async () => {
      const passports = window[passportsDataVarName] || [];
      const target = Math.max(1, passports.length);
      await addPassengersToTarget(target);
    });

    document.getElementById('ctrip-fill-all').addEventListener('click', fillAllPassengers);

    document.getElementById('ctrip-fill-first').addEventListener('click', async () => {
      const txt = document.getElementById('ctrip-input').value;
      const arr = parsePassportsFromText(txt);
      if (arr.length > 0) {
        await fillPassengerCard(0, arr[0]);
        await fillContactSection();
      } else {
        logToConsole('请先解析护照信息');
      }
    });

    document.getElementById('ctrip-clear-log').addEventListener('click', clearLog);

    // 自动解析
    const inputArea = document.getElementById('ctrip-input');
    inputArea.addEventListener('input', () => {
      const parsed = parsePassportsFromText(inputArea.value);
      if (parsed.length > 0) {
        logToConsole(`自动解析: ${parsed.length} 条护照信息`);
      }
    });
  }

  // 等待预订页就绪：乘机人卡片 或 "添加乘机人" 按钮出现
  function waitForBookPageReady() {
    return new Promise((resolve) => {
      const check = () =>
        document.getElementById('edit_psg_box-0') || findAddPassengerButton();
      if (check()) return resolve();
      const observer = new MutationObserver(() => {
        if (check()) {
          observer.disconnect();
          resolve();
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
    });
  }

  // 页面加载完成后初始化
  async function init() {
    await waitForBookPageReady();
    logToConsole('携程商旅自动填写脚本已加载');
    injectPanel();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
