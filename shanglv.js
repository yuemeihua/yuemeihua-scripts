// ==UserScript==
// @name         携程商旅乘机人自动填写 (SSR DOCS 解析)
// @namespace    https://example.com/
// @version      1.4
// @description  在携程商旅乘客页自动填写护照信息（SSR DOCS 格式解析；支持自动添加乘机人；支持性别/姓名/出生日期/国籍等自动填充）
// @author       胡朗
// @match        https://ct.ctrip.com/corp-flight-booking/*
// @grant        none
// @run-at       document-idle
// @updateURL    https://raw.githubusercontent.com/tryle17/yuemeihua-scripts/main/shanglv.js
// @downloadURL  https://raw.githubusercontent.com/tryle17/yuemeihua-scripts/main/shanglv.js
// ==/UserScript==

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
    // 查找对应的 label
    const label = Array.from(psgBoId.querySelectorAll('label'))
        .find(l => l.textContent.trim() === InputText);
    if (label) {
  // label 的前一个兄弟是 div.inputClass，里面有 input
  const inputClass = label.previousElementSibling;
  const input = inputClass ? inputClass.querySelector('input') : null;

  if (input) {
    // React/Vue 兼容设置值
    function setNativeValue(element, value) {
      const valueSetter = Object.getOwnPropertyDescriptor(element, 'value')?.set;
      const prototype = Object.getPrototypeOf(element);
      const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;

      if (valueSetter && valueSetter !== prototypeValueSetter) {
        prototypeValueSetter.call(element, value);
      } else {
        valueSetter.call(element, value);
      }
    }

    setNativeValue(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));

    console.log('✅ 已填写证件号码 ', value);
  } else {
    console.log("❌ 未找到 input");
  }
 }
}


//使用文本输入框
async function setInputByLabelText(psgBoId, InputText, value) {
	  const label = Array.from(psgBoId.querySelectorAll('label'))
		  .find(l => l.textContent.trim() === InputText);

	  if (!label) {
		  console.log(`❌ 未找到文本为“${InputText}”的 label in ${cardId}`);
		  return;
	  }

	const inputArea = label.closest('.inputArea');
	const passportNumberInput = inputArea ? inputArea.querySelector('input') : null;

	  if (passportNumberInput) {
			// 设置值
			setInputValue(passportNumberInput, value);
      passportNumberInput.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
      passportNumberInput.dispatchEvent(new KeyboardEvent("keyup", { key: "Enter", bubbles: true }));
      passportNumberInput.blur();
      passportNumberInput.dispatchEvent(new Event("change", { bubbles: true }));

  }
  else{
    console.log(`❌ 未找到文本为“${InputText}”的输入框 in ${cardId}`);
  }
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

  // 在下拉选择框中选择国家(i=0为国籍；i=1为签发国)
  async function setNationality(boxId, country, i) {
  console.log(`开始为 ${boxId} 设置国家: ${country}`);

  // 1. 定位乘客信息卡和 Select 按钮
  const box = document.getElementById(boxId);
  if (!box) {
    console.error(`未找到乘客信息卡: ${boxId}`);
    return;
  }

  // 查找 .corp-design-2311-select-selector 并验证外层有“国籍（国家/地区）”
  //通过i来判断选择国籍还是签发国家
  const targetLabel = i === 0 ? '国籍（国家/地区）' : '证件签署国';
  const select = Array.from(box.querySelectorAll('.corp-design-2311-select-selector')).find(sel => {
  // 向上查找包含 index-module_country-label__sUxh- 的父级
  let parent = sel;
  while (parent && parent !== box) {
    const label = parent.querySelector('.index-module_country-label__sUxh-');
    if (label && label.textContent.trim() === targetLabel) {
      return true;
    }
    parent = parent.parentElement;
  }
  return false;
  });

  if (!select) {
    console.error(`未找到 Select 选择器 in ${boxId}`);
    return;
  }

  // 2. 模拟点击打开下拉菜单
  const triggerClick = (element) => {
    ['mousedown', 'click'].forEach(eventType => {
      const event = new MouseEvent(eventType, {
        bubbles: true,
        cancelable: true,
        view: window
      });
      element.dispatchEvent(event);
    });
  };
  triggerClick(select);
  console.log('已触发 Select 点击');

  // 3. 查找匹配的下拉菜单
  const findDropdown = () => {
    return new Promise((resolve, reject) => {
      // 尝试查找现有下拉
      const checkDropdowns = () => {
        const dropdowns = document.querySelectorAll('.corp-design-2311-select-dropdown');
        let targetDropdown = null;
        let minDiff = Infinity;
        const rect = select.getBoundingClientRect();

        dropdowns.forEach(dd => {
          if (dd.classList.contains('corp-design-2311-select-dropdown-hidden')) return;

          const insetStyle = dd.style.inset || (dd.getAttribute('style') || '').match(/inset:\s*([^;]+)/)?.[1];
          if (!insetStyle) return;

          const parts = insetStyle.trim().split(/\s+/);
          const top = parseFloat(parts[0].replace('px', '')) + window.scrollY;
          const left = parseFloat(parts[3].replace('px', '')) + window.scrollX;

          const diffTop = Math.abs(top - (rect.bottom + window.scrollY));
          const diffLeft = Math.abs(left - (rect.left + window.scrollX));
          const diff = diffTop + diffLeft;

          if (diff < minDiff) {
            minDiff = diff;
            targetDropdown = dd;
          }
        });

        return targetDropdown;
      };

      // 立即检查
      const targetDropdown = checkDropdowns();
      if (targetDropdown) {
        console.log('立即找到匹配的下拉菜单', targetDropdown);
        resolve(targetDropdown);
        return;
      }

      // 如果未找到，监听 DOM 变化
      const observer = new MutationObserver((mutations) => {
        const targetDropdown = checkDropdowns();
        if (targetDropdown) {
          console.log('通过 MutationObserver 找到匹配的下拉菜单', targetDropdown);
          observer.disconnect();
          resolve(targetDropdown);
        }
      });

      observer.observe(document.body, { childList: true, subtree: true });

      // 超时 2 秒
      setTimeout(() => {
        observer.disconnect();
        reject(new Error('未找到下拉菜单，超时'));
      }, 2000);
    });
  };

  // 4. 执行下拉选择逻辑
  findDropdown()
    .then(targetDropdown => {
      // 尝试使用搜索框
      const searchInput = targetDropdown.querySelector('.index-module_search-input__h3yRd input');
      if (searchInput) {
        console.log('找到搜索输入框，尝试搜索');
        const searchTerm = country.substring(0, 2); // "中国大陆" -> "中国"
        searchInput.value = searchTerm;
        searchInput.dispatchEvent(new InputEvent('input', { bubbles: true }));
        console.log(`已输入搜索词: ${searchTerm}`);

        // 等待列表过滤
        setTimeout(() => {
          const items = targetDropdown.querySelectorAll('.index-module_country-item__ZQ3A1');
          let found = false;
          items.forEach(item => {
            if (item.style.display === 'none') return;
            if (item.textContent.trim() === country) {
              item.click();
              select.blur();
              console.log(`已选择国家: ${country}`);
              found = true;
            }
          });
        }, 200); // 等待过滤
      }
    })
    .catch(err => {
      console.error(err.message);
    });

}

  // 通过 placeholder 填写时间，带重试机制
async function setInputByPlaceholder(psgBoxId, placeholderText, value, ) {
  const container = document.getElementById(psgBoxId);
  if (!container) {
    console.error("未找到容器:", psgBoxId);
    return false;
  }

  const input = container.querySelector(`input[placeholder="${placeholderText}"]`);
  if (!input) {
    console.error(`未找到 placeholder 为“${placeholderText}”的输入框`);
    return false;
  }

  const nativeSetter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    "value"
  ).set;

  for (let i = 1; i <= 5; i++) {
    // 设置值
    await sleep(200 + i * 100);
    nativeSetter.call(input, value);

    // 触发事件
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));

    // 给点时间让框架响应
   await sleep(200 + i * 100);

    // 检查是否设置成功
    if (input.value === value) {
      console.log(`✅ 成功设置 ${placeholderText}，尝试次数: ${i}`);

      // 模拟回车（可选）
      input.dispatchEvent(
        new KeyboardEvent("keydown", {
          bubbles: true,
          cancelable: true,
          key: "Enter",
          code: "Enter",
          keyCode: 13
        })
      );
      return true;
    } else {
      console.warn(`第 ${i} 次尝试失败，当前值: ${input.value}`);
    }
  }

  console.error(`❌ 超过 ${maxRetry} 次仍未成功设置 ${placeholderText}，跳过`);
  return false;
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
      setInputByLabelText(cardEl, "姓（拼音）Surname", data.surname);
      await waitForNetworkRequests(500); // 等待网络请求
     }
      await sleep(200);

      // 2. 填写名（拼音）
      if (data.givenName) {
      setInputByLabelText(cardEl, "名（拼音）Given name", data.givenName);
      await waitForNetworkRequests(500); // 等待网络请求
     }
      await sleep(200);

      // 3. 选择性别
if (data.gender) {
  const genderContainer = cardEl.querySelector('.edit_radio_wrapper');
  if (genderContainer) {
    const genderOptions = genderContainer.querySelectorAll('.radioContainer');
    const targetGender = data.gender === 'M' ? '男' : '女';

    const genderOption = Array.from(genderOptions).find(opt =>
      opt.textContent.trim() === targetGender
    );

    if (genderOption) {
      const radio = genderOption.querySelector('.g-radio');
      let success = false;

      for (let i = 1; i <= 5; i++) {
        simulateClick(radio);

        // ✅ 检查 class 来确认是否真的选中
        const isSelected =
          genderOption.classList.contains("selected") ||
          radio.classList.contains("g-radio-checked") ||
          genderOption.querySelector(".g-radio-checked");

        if (isSelected) {
          logToConsole(`✅ 已选择性别：${targetGender}（第 ${i} 次成功）`);
          success = true;
          break;
        } else {
          console.warn(`第 ${i} 次尝试失败，性别未选中`);
        }
      }

      if (!success) {
        console.error(`❌ 超过 5 次仍未成功设置性别：${targetGender}`);
      }
    } else {
      logToConsole(`❌ 未找到性别选项：${targetGender}`);
    }
  }
}




      await sleep(200);

      // 4. 设置出生日期
      if (data.birthdate) {
        try {
          setInputByPlaceholder(cardId, "出生日期", data.birthdate);
          await waitForNetworkRequests(500); // 等待网络请求
          logToConsole('已设置出生日期：', data.birthdate);
          } catch (e) {
        logToConsole('❌ 设置出生日期时出错：', e);
      }
      }


      await sleep(200);

      // 5. 选择国籍
      if (data.nationalityFull) {
          await setNationality(cardId, data.nationalityFull,0);
          await waitForNetworkRequests(7000); // 等待网络请求，最多5秒
          logToConsole('已选择国籍：', data.nationalityFull);

      }

      await sleep(300);

      // 6. 填写证件号码
    if (data.passportNumber) {
      passwordLabelText(cardEl, "证件号码", data.passportNumber);
    }
      
    else {
      logToConsole('❌ 未提供证件号码，跳过填写');
    }


      await sleep(400);

      // 7. 设置证件有效期
      if (data.expirationDate) {
        try {
        setInputByPlaceholder(cardId, "证件有效期", data.expirationDate);
        await waitForNetworkRequests(500); // 等待网络请求
        logToConsole('已设置证件有效期：', data.expirationDate);
        }catch (e) {
        logToConsole('❌ 设置证件有效期时出错：', e);
      }

      }

      await sleep(200);

      // 8. 选择证件签署国
      if (data.issuingCountryFull) {
          await setNationality(cardId, data.issuingCountryFull,1);
          await waitForNetworkRequests(5000); // 等待网络请求，最多5秒
          logToConsole('已选择证件签署国：', data.issuingCountryFull);
      }

      await sleep(200);

      // 9. 填写手机号（如果存在）
      const phoneInput = cardEl.querySelector('.input-area input') ||
        cardEl.querySelector('input[placeholder*="手机"]');
      if (phoneInput) {
        setInputValue(phoneInput, DEFAULT_PHONE);
        await waitForNetworkRequests(500); // 等待网络请求
        logToConsole('已设置手机号：', DEFAULT_PHONE);
      }

      // 10. 默认勾选同意条款
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
      position: fixed; right: 12px; top: 80px; width: 460px; z-index: 999999;
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