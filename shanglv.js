// ==UserScript==
// @name         携程商旅乘机人自动填写 (SSR DOCS 解析)
// @namespace    https://example.com/
// @version      2.0
// @description  在携程商旅乘客页自动填写护照信息（SSR DOCS 格式解析；支持自动添加乘机人；支持性别/姓名/出生日期/国籍/证件类型等自动填充）
// @author       胡朗
// @match        https://ct.ctrip.com/corp-flight-booking/*
// @grant        none
// @run-at       document-idle
// @updateURL    https://raw.githubusercontent.com/tryle17/yuemeihua-scripts/main/shanglv.js
// @downloadURL  https://raw.githubusercontent.com/tryle17/yuemeihua-scripts/main/shanglv.js
// ==/UserScript==

/*
更新日志：
v2.0 (2026-06-15)
- 修复国籍/证件签署国因携程组件版本号变更（2311→2362）导致无法填写的问题
  改为版本无关的属性选择器，避免后续再次失效
- 新增证件类型自动选择（国际航班默认“护照”）
- 优化国家下拉定位逻辑（按可见 country-item 及位置匹配，更稳定）
- 优化搜索框输入使用 nativeSetter，避免被框架拦截
- setNationality 增加返回值与统一日志输出
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
v1.5 (2025-09-29)
- 删除测试护照
*/

/*
更新日志：
v1.4 (2025-09-29)
- 更新检测到护照填写才弹出控制台
- 更改填写网络控制延迟保证填写稳定性和速度兼容
*/

/*
更新日志：
v1.3 (2025-09-29)
- 每次填写增加网络请求判断，提升稳定性
*/

/*
更新日志：
v1.2 (2025-09-29)
- 优化填写输入框函数
- 增加等待网络请求完成的机制，提升稳定性 
- 修复导致异步执行导致部分无法填充问题
*/

/*
更新日志：
v1.1 (2025-09-26)
- 支持不同国籍签发国的护照填写
*/

/*
更新日志：
v1.0 (2025-09-26)
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
    "MAC": "中国澳门",
    "TWN": "中国台湾",
    "USA": "美国",
    "CAN": "加拿大",
    "GBR": "英国",
    "FRA": "法国",
    "DEU": "德国",
    "JPN": "日本",
    "KOR": "韩国",
    "RUS": "俄罗斯",
    "AUS": "澳大利亚",
    "NZL": "新西兰",
    "SGP": "新加坡",
    "MYS": "马来西亚",
    "THA": "泰国",
    "VNM": "越南",
    "IDN": "印度尼西亚",
    "IND": "印度",
    "BRA": "巴西",
    "ARG": "阿根廷",
    "ZAF": "南非",
    "EGY": "埃及",
    "TUR": "土耳其",
    "SAU": "沙特阿拉伯",
    "ARE": "阿联酋",
    "ISR": "以色列",
    "CHE": "瑞士",
    "SWE": "瑞典",
    "NOR": "挪威",
    "DNK": "丹麦",
    "FIN": "芬兰",
    "NLD": "荷兰",
    "BEL": "比利时",
    "AUT": "奥地利",
    "ESP": "西班牙",
    "ITA": "意大利",
    "GRC": "希腊",
    "PRT": "葡萄牙",
    "POL": "波兰",
    "CZE": "捷克",
    "HUN": "匈牙利",
    "ROU": "罗马尼亚",
    "BGR": "保加利亚",
    "HRV": "克罗地亚",
    "SRB": "塞尔维亚",
    "UKR": "乌克兰",
    "BLR": "白俄罗斯",
    "KAZ": "哈萨克斯坦",
    "UZB": "乌兹别克斯坦",
    "GEO": "格鲁吉亚",
    "ARM": "亚美尼亚",
    "LVA": "拉脱维亚",
    "LTU": "立陶宛",
    "EST": "爱沙尼亚",
    "SVK": "斯洛伐克",
    "SVN": "斯洛文尼亚",
    "CYP": "塞浦路斯",
    "LUX": "卢森堡",
    "ISL": "冰岛",
    "MEX": "墨西哥",
    "COL": "哥伦比亚",
    "CHL": "智利",
    "PER": "秘鲁",
    "VEN": "委内瑞拉",
    "ECU": "厄瓜多尔",
    "URY": "乌拉圭",
    "BGD": "孟加拉国",
    // 可继续添加更多国家代码映射
  };

  // 默认手机号
  const DEFAULT_PHONE = '18610429740';

  function logToConsole(...args) {
    console.log('[携程填写]', ...args);
    appendLog(args.join(' '));
  }

  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

  function simulateClick(el) {
    if (!el) return;
    el.focus && el.focus();
    el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    el.click && el.click();
  }

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
    const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    if (nativeSetter) nativeSetter.call(input, val);
    else input.value = val;
  }

  function setInputValue(input, value) {
    if (!input) return;
    try {
      input.focus && input.focus();
      nativeSetValue(input, value);
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      input.dispatchEvent(new Event('blur', { bubbles: true }));
    } catch (e) { console.error(e); }
  }

  function normalizeCompareValue(val) {
    return (val || '').trim().toUpperCase();
  }

  function defaultValueMatcher(actual, expected) {
    return normalizeCompareValue(actual) === normalizeCompareValue(expected);
  }

  async function ensureInputValue(
    input,
    value,
    label = '字段',
    { retries = 3, matcher = defaultValueMatcher, wait = 60 } = {}
  ) {
    if (!input) {
      logToConsole(`❌ 未找到${label}输入框`);
      return false;
    }
    for (let i = 1; i <= retries; i++) {
      setInputValue(input, value);
      await sleep(wait);
      if (matcher(input.value, value)) {
        logToConsole(`✅ ${label}已填写：${value}`);
        return true;
      }
      logToConsole(`⚠️ ${label}第 ${i} 次校验失败，重试`);
      await sleep(wait + 40);
    }
    logToConsole(`❌ ${label}多次填写失败，请手动检查`);
    return false;
  }

  async function ensureSelectValue(select, value, label = '下拉框', retries = 3) {
    if (!select) {
      logToConsole(`❌ 未找到${label}`);
      return false;
    }
    for (let i = 1; i <= retries; i++) {
      select.value = value;
      select.dispatchEvent(new Event('change', { bubbles: true }));
      await sleep(60);
      if (defaultValueMatcher(select.value, value)) {
        logToConsole(`✅ ${label}已选择：${value}`);
        return true;
      }
      logToConsole(`⚠️ ${label}第 ${i} 次选择失败，重试`);
    }
    logToConsole(`❌ ${label}无法设置为 ${value}`);
    return false;
  }

  async function ensureGenderSelection(cardEl, gender) {
    if (!gender) return false;
    const target = gender === 'M' ? '男' : '女';
    const genderContainer = cardEl.querySelector('.edit_radio_wrapper');
    if (!genderContainer) {
      logToConsole('❌ 未找到性别容器');
      return false;
    }
    const genderOptions = genderContainer.querySelectorAll('.radioContainer');
    const genderOption = Array.from(genderOptions).find(opt =>
      (opt.textContent || '').trim() === target
    );
    if (!genderOption) {
      logToConsole(`❌ 未找到性别选项：${target}`);
      return false;
    }
    const radio = genderOption.querySelector('.g-radio') || genderOption;
    for (let i = 1; i <= 3; i++) {
      simulateClick(radio);
      await sleep(40);
      const isSelected =
        genderOption.classList.contains('selected') ||
        radio.classList.contains('g-radio-checked') ||
        !!genderOption.querySelector('.g-radio-checked');
      if (isSelected) {
        logToConsole(`✅ 已选择性别：${target}`);
        return true;
      }
      logToConsole(`⚠️ 性别第 ${i} 次选择未生效，重试`);
    }
    logToConsole(`❌ 性别选择失败：${target}`);
    return false;
  }

  function normalizeLabelTextForCompare(text) {
    return (text || '')
      .replace(/[（﹙]/g, '(')
      .replace(/[）﹚]/g, ')')
      .replace(/\s+/g, '')
      .toUpperCase();
  }

  function getInputByLabel(container, labelText) {
    if (!container || !labelText) return null;
    const root = typeof container === 'string' ? document.getElementById(container) : container;
    if (!root) return null;

    const normalizedTarget = normalizeLabelTextForCompare(labelText);
    if (!normalizedTarget) return null;

    const labelCandidates = Array.from(
      root.querySelectorAll(
        'label, .label, .label-text, .input-label, .formLabel, .inputArea label, [data-label], [aria-label]'
      )
    );

    const findMatchingLabel = () => {
      for (const candidate of labelCandidates) {
        const textContent = candidate.getAttribute('data-label') ||
          candidate.getAttribute('aria-label') ||
          candidate.textContent ||
          '';
        const normalizedCandidate = normalizeLabelTextForCompare(textContent);
        if (!normalizedCandidate) continue;
        if (
          normalizedCandidate === normalizedTarget ||
          normalizedCandidate.includes(normalizedTarget) ||
          normalizedTarget.includes(normalizedCandidate)
        ) {
          return candidate;
        }
      }
      return null;
    };

    const label = findMatchingLabel();
    if (!label) return null;

    const possibleInputs = [
      label.control,
      label.querySelector && label.querySelector('input'),
      label.closest && label.closest('.inputArea, .input-area, .inputWrapper, .input-wrapper'),
      label.parentElement,
      label.previousElementSibling,
      label.nextElementSibling
    ]
      .filter(Boolean)
      .flatMap(el => {
        if (!el) return [];
        if (el instanceof HTMLInputElement) return [el];
        return Array.from(el.querySelectorAll ? el.querySelectorAll('input') : []);
      });

    if (possibleInputs.length > 0) {
      return possibleInputs[0];
    }

    return Array.from(root.querySelectorAll('input')).find(input => {
      const placeholder = normalizeLabelTextForCompare(input.getAttribute('placeholder'));
      return placeholder && placeholder.includes(normalizedTarget);
    }) || null;
  }

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
        JAN:'01',FEB:'02',MAR:'03',APR:'04',MAY:'05',JUN:'06',
        JUL:'07',AUG:'08',SEP:'09',OCT:'10',NOV:'11',DEC:'12'
      };
      const month = monMap[monStr] || '01';
      let year = yearRaw.length === 2 ? (parseInt(yearRaw,10) > 50 ? '19'+yearRaw : '20'+yearRaw) : yearRaw;
      return `${year}-${month}-${day}`;
    }
    return s;
  }

  function parseSSRLine(line) {
    const out = {
      raw: line,
      issuingCountry:'',
      passportNumber:'',
      nationality:'',
      birthdate:'',
      gender:'',
      expirationDate:'',
      surname:'',
      givenName:'',
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
    } catch(e) {
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






  // 监听网络请求的 Promise
function waitForNetworkRequests(timeout = 5000) {
  return new Promise((resolve) => {
    let requestsPending = 0;
    let resolved = false;

    // 代理 XMLHttpRequest
    const originalOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function () {
      requestsPending++;
      this.addEventListener('loadend', () => {
        requestsPending--;
        if (requestsPending === 0 && !resolved) {
          resolved = true;
          resolve();
        }
      });
      return originalOpen.apply(this, arguments);
    };

    // 代理 fetch
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      requestsPending++;
      const response = await originalFetch(...args);
      requestsPending--;
      if (requestsPending === 0 && !resolved) {
        resolved = true;
        resolve();
      }
      return response;
    };

    // 设置超时
    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        resolve();
        logToConsole('网络请求等待超时，继续执行');
      }
    }, timeout);
  });
}






  //护照号输入
  async function passwordLabelText(psgBoId, InputText, value) {
    const input = getInputByLabel(psgBoId, InputText);
    if (!input) {
      logToConsole(`❌ 未找到${InputText}输入框`);
      return false;
    }
    return ensureInputValue(input, value, InputText, { retries: 4 });
  }


  //使用文本输入框
  async function setInputByLabelText(psgBoId, InputText, value) {
    const input = getInputByLabel(psgBoId, InputText);
    if (!input) {
      logToConsole(`❌ 未找到文本为“${InputText}”的输入框`);
      return false;
    }
    return ensureInputValue(input, value, InputText);
  }
  // 检测当前SSR护照数量
  function detectPassengerCount() {
    const cards = document.querySelectorAll('[id^="edit_psg_box-"].editBox');
    logToConsole('检测到护照卡数量：', cards.length);
    return cards.length;
  }

  // 点击添加乘机人按钮
  async function clickAddPassengerButton() {
    const addBtn = document.getElementById('addPassengerBtn');
    if (addBtn) {
      simulateClick(addBtn);
      logToConsole('点击添加乘机人按钮');
      await sleep(500); // 等待页面更新
      return true;
    } else {
      logToConsole('未找到添加乘机人按钮');
      return false;
    }
  }

  // 自动添加乘机人到目标数量
  async function addPassengersToTarget(targetCount) {
    const currentCount = detectPassengerCount();
    const needToAdd = targetCount - currentCount;

    if (needToAdd <= 0) {
      logToConsole(`当前已有${currentCount}位乘机人，无需添加`);
      return;
    }

    logToConsole(`需要添加${needToAdd}位乘机人`);

    for (let i = 0; i < needToAdd; i++) {
      const success = await clickAddPassengerButton();
      if (!success) {
        logToConsole(`第${i+1}次添加乘机人失败`);
        break;
      }
      await sleep(300);
    }

    // 再次检测确认
    const finalCount = detectPassengerCount();
    logToConsole(`添加完成，当前乘机人数量：${finalCount}`);
  }

  // 版本无关的选择器：携程组件类名常带版本号（如 corp-design-2362-*），
  // 这里用属性包含匹配，避免每次版本升级都失效
  const SEL = {
    selector:   '[class*="-select-selector"]',
    dropdown:   '[class*="-select-dropdown"]',
    ddHidden:   /-select-dropdown-hidden/,
    searchInput:'[class*="search-input"] input, [class*="search-input"]',
    countryItem:'[class*="country-item"]',
    countryLbl: '[class*="country-label"]'
  };

  // 在下拉选择框中选择国家(i=0为国籍；i=1为签发国)
  async function setNationality(boxId, country, i) {
    console.log(`开始为 ${boxId} 设置国家: ${country}`);

    const box = document.getElementById(boxId);
    if (!box) {
      logToConsole(`❌ 未找到乘客信息卡: ${boxId}`);
      return false;
    }

    const targetLabel = i === 0 ? '国籍（国家/地区）' : '证件签署国';

    // 通过 country-label 文本定位对应的 select 选择器
    const labelEls = box.querySelectorAll(SEL.countryLbl);
    let select = null;
    for (const lbl of labelEls) {
      if (lbl.textContent.trim() !== targetLabel) continue;
      const wrap = lbl.parentElement;
      select = wrap ? wrap.querySelector(SEL.selector) : null;
      if (select) break;
    }
    if (!select) {
      logToConsole(`❌ 未找到“${targetLabel}”选择器 in ${boxId}`);
      return false;
    }

    const triggerClick = (el) => {
      ['mousedown', 'mouseup', 'click'].forEach(t =>
        el.dispatchEvent(new MouseEvent(t, { bubbles: true, cancelable: true, view: window }))
      );
    };

    const findDropdown = (timeout = 2000) => new Promise((resolve, reject) => {
      const check = () => {
        const dropdowns = document.querySelectorAll(SEL.dropdown);
        let target = null;
        let minDiff = Infinity;
        const rect = select.getBoundingClientRect();
        dropdowns.forEach(dd => {
          if (SEL.ddHidden.test(dd.className)) return;
          // 优先取包含可见 country-item 的下拉
          const items = dd.querySelectorAll(SEL.countryItem);
          if (items.length === 0) return;
          const ddRect = dd.getBoundingClientRect();
          const diff = Math.abs(ddRect.top - rect.bottom) + Math.abs(ddRect.left - rect.left);
          if (diff < minDiff) { minDiff = diff; target = dd; }
        });
        return target;
      };
      const immediate = check();
      if (immediate) return resolve(immediate);

      const observer = new MutationObserver(() => {
        const r = check();
        if (r) { observer.disconnect(); resolve(r); }
      });
      observer.observe(document.body, { childList: true, subtree: true });
      setTimeout(() => { observer.disconnect(); reject(new Error('未找到下拉菜单，超时')); }, timeout);
    });

    const pickItem = (targetDropdown) => new Promise((resolve) => {
      const searchInput = targetDropdown.querySelector(SEL.searchInput);
      const tryPick = () => {
        const items = Array.from(targetDropdown.querySelectorAll(SEL.countryItem))
          .filter(it => it.offsetParent !== null);
        const match = items.find(it => it.textContent.trim() === country);
        if (match) {
          match.click();
          select.blur();
          logToConsole(`✅ 已选择${targetLabel}：${country}`);
          return true;
        }
        return false;
      };

      if (searchInput && searchInput.tagName === 'INPUT') {
        // 用 nativeSetter 避免被 React 拦截
        nativeSetValue(searchInput, country.substring(0, 2));
        searchInput.dispatchEvent(new InputEvent('input', { bubbles: true }));
        setTimeout(() => resolve(tryPick()), 250);
      } else {
        resolve(tryPick());
      }
    });

    try {
      triggerClick(select);
      const dd = await findDropdown();
      await pickItem(dd);
      return true;
    } catch (err) {
      logToConsole(`❌ ${targetLabel}选择失败：${err.message}`);
      return false;
    }
  }

  // 选择证件类型（国际航班固定为“护照”）
  async function setCertificateType(boxId, certName = '护照') {
    const box = document.getElementById(boxId);
    if (!box) return false;
    const certBox = box.querySelector('.title-container.CertificateType, [class*="CertificateType"]');
    if (!certBox) {
      logToConsole('❌ 未找到证件类型选择器');
      return false;
    }
    // 若已选中则跳过（选中值显示在 .titleChoose，未选时 label 在 .titleText）
    const chosen = certBox.querySelector('.titleChoose')?.textContent?.trim() || '';
    if (chosen === certName) {
      logToConsole(`✅ 证件类型已是：${certName}`);
      return true;
    }
    const trigger = certBox.querySelector('.drop-container .searchContainer, .drop-container') || certBox;
    const triggerClick = (el) => {
      ['mousedown', 'mouseup', 'click'].forEach(t =>
        el.dispatchEvent(new MouseEvent(t, { bubbles: true, cancelable: true, view: window })));
    };
    triggerClick(trigger);

    const findItem = (timeout = 2000) => new Promise((resolve, reject) => {
      const check = () => {
        const items = Array.from(box.querySelectorAll('.li-title, [class*="li-title"]'))
          .filter(e => e.offsetParent !== null && e.textContent.trim() === certName);
        return items[0] || null;
      };
      const imm = check();
      if (imm) return resolve(imm);
      const observer = new MutationObserver(() => {
        const r = check();
        if (r) { observer.disconnect(); resolve(r); }
      });
      observer.observe(document.body, { childList: true, subtree: true });
      setTimeout(() => { observer.disconnect(); reject(new Error('证件类型下拉未出现')); }, timeout);
    });

    try {
      const item = await findItem();
      triggerClick(item);
      logToConsole(`✅ 已选择证件类型：${certName}`);
      return true;
    } catch (e) {
      logToConsole(`❌ 证件类型选择失败：${e.message}`);
      return false;
    }
  }

  // 通过 placeholder 填写时间，带重试机制
  async function setInputByPlaceholder(psgBoxId, placeholderText, value) {
    const container = document.getElementById(psgBoxId);
    if (!container) {
      logToConsole(`❌ 未找到容器: ${psgBoxId}`);
      return false;
    }

    const input = container.querySelector(`input[placeholder="${placeholderText}"]`);
    if (!input) {
      logToConsole(`❌ 未找到 placeholder 为“${placeholderText}”的输入框`);
      return false;
    }

    const success = await ensureInputValue(input, value, placeholderText, { retries: 5 });

    if (success) {
      input.dispatchEvent(
        new KeyboardEvent('keydown', {
          bubbles: true,
          cancelable: true,
          key: 'Enter',
          code: 'Enter',
          keyCode: 13
        })
      );
      input.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, key: 'Enter', code: 'Enter', keyCode: 13 }));
    }

    return success;
  }

  // 填写单个乘机人信息
  async function fillPassengerCard(cardIndex, data) {
    const cardId = `edit_psg_box-${cardIndex}`;
    const cardEl = document.getElementById(cardId);

    if (!cardEl) {
      logToConsole(`未找到第${cardIndex + 1}位乘机人卡片`);
      return;
    }

    logToConsole(`开始填写第${cardIndex + 1}位乘机人信息`);

    try {
      // 1. 填写姓（拼音）
      if (data.surname) {
        await setInputByLabelText(cardEl, '姓（拼音）Surname', data.surname);
        await waitForNetworkRequests(500); // 等待网络请求
      }
      await sleep(200);

      // 2. 填写名（拼音）
      if (data.givenName) {
        await setInputByLabelText(cardEl, '名（拼音）Given name', data.givenName);
        await waitForNetworkRequests(500); // 等待网络请求
      }
      await sleep(200);

      // 3. 选择性别
      if (data.gender) {
        await ensureGenderSelection(cardEl, data.gender);
      }

      await sleep(200);

      // 4. 设置出生日期
      if (data.birthdate) {
        try {
          await setInputByPlaceholder(cardId, '出生日期', data.birthdate);
          await waitForNetworkRequests(500); // 等待网络请求
          logToConsole('已设置出生日期：', data.birthdate);
        } catch (e) {
          logToConsole('❌ 设置出生日期时出错：', e);
        }
      }


      await sleep(200);

      // 5. 选择证件类型（国际航班默认护照）
      await setCertificateType(cardId, '护照');
      await waitForNetworkRequests(500);
      await sleep(200);

      // 6. 选择国籍
      if (data.nationalityFull) {
        await setNationality(cardId, data.nationalityFull, 0);
        await waitForNetworkRequests(800); // 等待网络请求，最多5秒
        logToConsole('已选择国籍：', data.nationalityFull);
      }

      await sleep(300);

      // 7. 填写证件号码
      if (data.passportNumber) {
        await passwordLabelText(cardEl, '证件号码', data.passportNumber);
      } else {
        logToConsole('❌ 未提供证件号码，跳过填写');
      }


      await sleep(400);

      // 8. 设置证件有效期
      if (data.expirationDate) {
        try {
          await setInputByPlaceholder(cardId, '证件有效期', data.expirationDate);
          await waitForNetworkRequests(500); // 等待网络请求
          logToConsole('已设置证件有效期：', data.expirationDate);
        } catch (e) {
          logToConsole('❌ 设置证件有效期时出错：', e);
        }
      }

      await sleep(200);

      // 9. 选择证件签署国
      if (data.issuingCountryFull) {
        await setNationality(cardId, data.issuingCountryFull, 1);
        await waitForNetworkRequests(800); // 等待网络请求，最多5秒
        logToConsole('已选择证件签署国：', data.issuingCountryFull);
      }

      await sleep(200);

      // 10. 填写手机号（如果存在）
      const phoneInput = cardEl.querySelector('.input-area input') ||
        cardEl.querySelector('input[placeholder*="手机"]');
      if (phoneInput) {
        await ensureInputValue(phoneInput, DEFAULT_PHONE, '手机号');
        await waitForNetworkRequests(500); // 等待网络请求
        logToConsole('已设置手机号：', DEFAULT_PHONE);
      }

      // 11. 默认勾选同意条款
      const checkbox = cardEl.querySelector('.checkBox .checkboxCircle') ||
        document.querySelector('#flt-ui-pc-book-footer-tips-radio .checkboxCircle');
      if (checkbox && !checkbox.classList.contains('checked')) {
        simulateClick(checkbox);
        await waitForNetworkRequests(500); // 等待网络请求
        logToConsole('已勾选同意条款');
      }

      logToConsole(`第${cardIndex + 1}位乘机人信息填写完成`);

    } catch (e) {
      logToConsole(`填写第${cardIndex + 1}位乘机人时出错：`, e);
    }
  }

  // 填写所有乘机人
  async function fillAllPassengers() {
    const passports = window[passportsDataVarName] || [];

    if (passports.length === 0) {
      logToConsole('请先解析护照信息');
      return;
    }

    // 先确保有足够的乘机人卡片
    await addPassengersToTarget(passports.length);

    // 填写每位乘机人信息
    for (let i = 0; i < passports.length; i++) {
      await fillPassengerCard(i, passports[i]);
      await sleep(500);
    }

    logToConsole('所有乘机人信息填写完成');
  }

  // 创建控制面板
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
        <span>携程商旅自动填写</span>
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
          `第${i+1}位 -> 姓:${p.surname}, 名:${p.givenName}, 性别:${p.gender}, 出生:${p.birthdate}, ` +
          `国籍:${p.nationalityFull}, 签署国:${p.issuingCountryFull}, 护照号:${p.passportNumber}, 有效期:${p.expirationDate}`
        );
      });
    });

    document.getElementById('ctrip-detect').addEventListener('click', () => {
      detectPassengerCount();
    });

    document.getElementById('ctrip-add-passenger').addEventListener('click', () => {
      clickAddPassengerButton();
    });

    document.getElementById('ctrip-fill-all').addEventListener('click', fillAllPassengers);

    document.getElementById('ctrip-fill-first').addEventListener('click', async () => {
      const txt = document.getElementById('ctrip-input').value;
      const arr = parsePassportsFromText(txt);
      if (arr.length > 0) {
        await fillPassengerCard(0, arr[0]);
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
//检测护照信息后再弹出控制面板
  function waitForFirstPassengerCard() {
  return new Promise((resolve) => {
    // 如果已经有 edit_psg_box-0，直接返回
    if (document.getElementById('edit_psg_box-0')) {
      resolve();
      return;
    }

    // 否则监听 DOM 变化
    const observer = new MutationObserver(() => {
      if (document.getElementById('edit_psg_box-0')) {
        observer.disconnect();
        resolve();
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  });
}
  // 页面加载完成后初始化
 async function init() {
    await waitForFirstPassengerCard();
    logToConsole('携程商旅自动填写脚本已加载');
    injectPanel();
  }

  // 等待页面加载完成
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
