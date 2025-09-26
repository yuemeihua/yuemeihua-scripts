// ==UserScript==
// @name         携程商旅乘机人自动填写 (SSR DOCS 解析)
// @namespace    https://example.com/
// @version      1.0
// @description  在携程商旅乘客页自动填写护照信息（SSR DOCS 格式解析；支持自动添加乘机人；支持性别/姓名/出生日期/国籍等自动填充）
// @match        https://ct.ctrip.com/corp-flight-booking/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  const passportsDataVarName = 'passportsData';
  window[passportsDataVarName] = [];

  const defaultInput = `SSR DOCS BI HK1 P/CHN/E92082749/CHN/31JUL88/M/28DEC26/MA/CHAO/CHENAN/P1
SSR DOCS BI HK1 P/CHN/EA2378561/CHN/07NOV76/M/15MAY27/ZHOU/CHENAN/P2
SSR DOCS BI HK1 P/CHN/PE3303737/CHN/28NOV77/M/11FEB30/YANG/YONG/P3
`;

  // 国家/地区映射 - 修改为中国大陆等中文名称
  const COUNTRY_MAP = {
    'CHN': '中国大陆',
    'PRC': '中国大陆',
    'CN': '中国大陆',
    'HKG': '中国香港',
    'MAC': '中国澳门',
    'TWN': '中国台湾'
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
		  let success = false;

		for (let i = 1; i <= 5; i++) {
			// 模拟点击激活
			passportNumberInput.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
			passportNumberInput.focus();
			await sleep(200 + i * i * 100);

			// 设置值
			setInputValue(passportNumberInput, value);

			// 等待框架同步
			await sleep(200 + i * i* 100);

			if (passportNumberInput.value === value) {
				logToConsole(`✅ 已设置${InputText}：${value}（第 ${i} 次成功）`);
				success = true;
				break;
			} else {
				console.warn(`第 ${i} 次尝试失败，当前值: "${passportNumberInput.value}"`);
			}
		}

		if (!success) {
			console.error(`❌ 超过 5 次仍未成功设置${InputText}：${value}`);
		}
	  } else {
		logToConsole('❌ 未找到 '+ InputText +' 输入框');
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
              console.log(`已选择国家: ${country}`);
              found = true;
            }
          });
          if (!found) {
            console.warn(`搜索后未找到国家: ${country}，尝试直接选择`);
            directSelect(targetDropdown, country);
          }
        }, 200); // 等待过滤
      } else {
        console.warn('未找到搜索输入框，尝试直接选择');
        directSelect(targetDropdown, country);
      }
    })
    .catch(err => {
      console.error(err.message);
    });

  // 5. 直接选择（备用方案）
  function directSelect(dropdown, country) {
    const items = dropdown.querySelectorAll('.index-module_country-item__ZQ3A1');
    let found = false;
    items.forEach(item => {
      if (item.textContent.trim() === country) {
        item.click();
        console.log(`直接选择国家: ${country}`);
        found = true;
      }
    });
    if (!found) {
      console.error(`未找到国家: ${country}`);
    }
  }
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
     }
      await sleep(200);

      // 2. 填写名（拼音）
      if (data.givenName) {
      setInputByLabelText(cardEl, "名（拼音）Given name", data.givenName);
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
        await sleep(200 + i * i * 100); // 递增等待，给框架渲染时间

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
          logToConsole('已设置出生日期：', data.birthdate);
          } catch (e) {
        logToConsole('❌ 设置出生日期时出错：', e);
      }
      }


      await sleep(200);

      // 5. 选择国籍
      if (data.nationalityFull) {
          await setNationality(cardId, data.nationalityFull,0);
          logToConsole('已选择国籍：', data.nationalityFull);

      }

      await sleep(200);

      // 6. 填写证件号码
    if (data.passportNumber) {
      setInputByLabelText(cardEl, "证件号码", data.passportNumber);
  }


      await sleep(200);

      // 7. 设置证件有效期
      if (data.expirationDate) {
        try {
        setInputByPlaceholder(cardId, "证件有效期", data.expirationDate);
        logToConsole('已设置证件有效期：', data.expirationDate);
        }catch (e) {
        logToConsole('❌ 设置证件有效期时出错：', e);
      }

      }

      await sleep(200);

      // 8. 选择证件签署国
      if (data.issuingCountryFull) {
          await setNationality(cardId, data.issuingCountryFull,1);
          logToConsole('已选择证件签署国：', data.issuingCountryFull);
      }

      await sleep(200);

      // 9. 填写手机号（如果存在）
      const phoneInput = cardEl.querySelector('.input-area input') ||
        cardEl.querySelector('input[placeholder*="手机"]');
      if (phoneInput) {
        setInputValue(phoneInput, DEFAULT_PHONE);
        logToConsole('已设置手机号：', DEFAULT_PHONE);
      }

      // 10. 默认勾选同意条款
      const checkbox = cardEl.querySelector('.checkBox .checkboxCircle') ||
        document.querySelector('#flt-ui-pc-book-footer-tips-radio .checkboxCircle');
      if (checkbox && !checkbox.classList.contains('checked')) {
        simulateClick(checkbox);
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

  // 页面加载完成后初始化
  function init() {
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