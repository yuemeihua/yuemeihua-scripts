// ==UserScript==
// @name         SU官网自动填充护照信息
// @namespace    https://example.com/
// @version      1.2
// @description  在 Aeroflot 乘客页自动填写护照信息
// @author       胡朗
// @match        https://www.aeroflot.ru/sb/app/ru-en/*
// @match        https://www.aeroflot.ru/sb/app/*
// @grant        none
// @run-at       document-idle
// @updateURL    https://raw.githubusercontent.com/yuemeihua/yuemeihua-scripts/main/SU.js
// @downloadURL  https://raw.githubusercontent.com/yuemeihua/yuemeihua-scripts/main/SU.js
// ==/UserScript==

/*
更新日志：
v1.2 (2025-09-29)
- 删除测试护照
*/

/*
更新日志：
v1.1 (2025-09-29)
- 更新检测到护照填写才弹出控制台
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
  //固定公司邮箱&手机号
  const DEFAULT_EMAIL = 'yuemeihuafly@163.com';
  const DEFAULT_PHONE = '18610429740';
  //固定测试护照信息
  const defaultInput = ``;
  //护照简写国家转国家数组
  const COUNTRY_MAP = { 'CHN': 'China', 'PRC': 'China', 'CN': 'China' };

  function logToConsole(...args) {
    console.log('[AeroFill]', ...args);
    appendLog(args.join(' '));
  }

  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }


  // 模拟用户事件点击（比直接 .click() 更可靠）
  function simulateClick(el) {
    if (!el) return;
    el.focus && el.focus();
    el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    el.click && el.click();
  }

  function appendLog(text) {
    const area = document.getElementById('aerofill-log-area');
    if (!area) return;
    const now = new Date().toLocaleTimeString();
    area.value += `[${now}] ${text}\n`;
    area.scrollTop = area.scrollHeight;
  }

  function clearLog() {
    const area = document.getElementById('aerofill-log-area');
    if (area) area.value = '';
  }

  function dispatchMouseSequence(el) {
    if (!el) return;
    ['mousedown', 'mouseup', 'click'].forEach(evt => {
      el.dispatchEvent(new MouseEvent(evt, { bubbles: true, cancelable: true, composed: true, view: window }));
    });
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

  function normalizeDateFlexible(s) {
    if (!s) return '';
    s = s.trim();
    const m = s.match(/^(\d{1,2})([A-Za-z]{3})(\d{2,4})$/);
    if (m) {
      const day = m[1].padStart(2, '0');
      const monStr = m[2].toUpperCase();
      const yearRaw = m[3];
      const monMap = { JAN:'01',FEB:'02',MAR:'03',APR:'04',MAY:'05',JUN:'06',JUL:'07',AUG:'08',SEP:'09',OCT:'10',NOV:'11',DEC:'12' };
      const month = monMap[monStr] || '01';
      let year = yearRaw.length === 2 ? (parseInt(yearRaw,10)>50?'19'+yearRaw:'20'+yearRaw) : yearRaw;
      return `${day}.${month}.${year}`;
    }
    const parts = s.split(/[.\-\/]/).map(p => p.trim());
    if (parts.length === 3) {
      if (parts[0].length === 4) return `${parts[2]}.${parts[1]}.${parts[0]}`;
      if (parts[2].length === 4) return `${parts[0]}.${parts[1]}.${parts[2]}`;
    }
    return s;
  }

  function parseSSRLine(line) {
    const out = { raw: line, issuingCountry:'', passportNumber:'', nationality:'', birthdate:'', gender:'', expirationDate:'', surname:'', givenName:'', passengerIndex:null, ok:false, error:null };
    try {
      const idx = line.indexOf('P/'); if (idx === -1) throw new Error('找不到 P/');
      let after = line.substring(idx+2).trim();
      const parts = after.split('/');
      if (parts.length < 6) throw new Error('字段不足');
      out.issuingCountry = (parts[0]||'').toUpperCase();
      out.passportNumber = (parts[1]||'').trim();
      out.nationality = (parts[2]||'').toUpperCase();
      out.birthdate = normalizeDateFlexible(parts[3]||'');
      out.gender = (parts[4]||'').toUpperCase().substr(0,1);
      out.expirationDate = normalizeDateFlexible(parts[5]||'');
      const rest = parts.slice(6).map(p=>p.trim()).filter(Boolean);
      for (let i=rest.length-1;i>=0;i--) {
        const m = rest[i].match(/^P(\d+)$/i);
        if (m) { out.passengerIndex=parseInt(m[1],10); rest.splice(i,1); break; }
      }
      if (rest.length>=2) { out.surname=rest[0]; out.givenName=rest.slice(1).join(' '); }
      out.ok = true;
    } catch(e){ out.error=e.message; }
    return out;
  }

  function parsePassportsFromText(text) {
    const lines=text.split(/\r?\n/).map(l=>l.trim()).filter(Boolean);
    const results=[];
    for (const line of lines) {
      if (/^SSR\s+DOCS/i.test(line)) {
        const parsed=parseSSRLine(line);
        if (parsed.ok) {
          parsed.issuingCountryFull=COUNTRY_MAP[parsed.issuingCountry]||parsed.issuingCountry;
          parsed.nationalityFull=COUNTRY_MAP[parsed.nationality]||parsed.nationality;
          results.push(parsed);
        }
      }
    }
    window[passportsDataVarName]=results;
    return results;
  }

  async function selectFromDropdownInCard(inputEl, cardEl, targetText) {
    if (!inputEl||!targetText) return false;
    nativeSetValue(inputEl,targetText);
    inputEl.dispatchEvent(new Event('input',{bubbles:true}));
    inputEl.focus&&inputEl.focus();
    await sleep(300);
    let dropdown=cardEl?.querySelector('.search-form__dropdown[aria-expanded="true"]')||document.querySelector('.search-form__dropdown[aria-expanded="true"]');
    if (!dropdown) return false;
    const items=Array.from(dropdown.querySelectorAll('.search-form__dropdown-item'));
    let chosen=items.find(it=>it.textContent.trim().toLowerCase()===targetText.toLowerCase())||items[0];
    dispatchMouseSequence(chosen);
    await sleep(200);
    return true;
  }
  //填写函数
  async function fillPassengerCard(cardEl, data, index) {
    logToConsole(`开始填写第 ${index+1} 位`);
    //性别
    try {
      const genderEls = Array.from(cardEl.querySelectorAll('.js-passenger-card__gender-item.passenger-card__gender-item'));
      if (genderEls.length > 0 && data.gender) {
        const targetVal = data.gender === 'M' ? '1' : '0';
        let el = genderEls.find((g) => g.getAttribute('data-gender-value') === targetVal);
        if (!el) {
          // fallback by span text
          el = genderEls.find((g) => (g.textContent || '').trim().toUpperCase().startsWith(data.gender));
        }
        if (el) {
          simulateClick(el);
          logToConsole('已设置性别为', data.gender);
        } else {
          logToConsole('未找到匹配的性别控件');
        }
        await sleep(200);
      }
    } catch (e) {
      logToConsole('设置性别时异常', e);
    }
    // 姓
    try {
      const surnameInput = Array.from(cardEl.querySelectorAll('input.input__text-input')).find((i) => {
        const title = (i.getAttribute('title') || '').toLowerCase();
        const desc = (i.getAttribute('aria-describedby') || '').toLowerCase();
        return title === 'surname' || desc.includes('passenger-name') && title.includes('surname');
      }) || cardEl.querySelector('input[title="Surname"]');
      if (surnameInput && data.surname) {
        setInputValue(surnameInput, data.surname);
        logToConsole('已设置姓:', data.surname);
        await sleep(150);
      } else {
        logToConsole('未找到姓输入框');
      }
    } catch (e) {
      logToConsole('设置姓时异常', e);
    }

    // 名
    try {
      const nameInput = Array.from(cardEl.querySelectorAll('input.input__text-input')).find((i) => {
        const title = (i.getAttribute('title') || '').toLowerCase();
        return title === 'name' || title.includes('given');
      }) || cardEl.querySelector('input[title="Name"]');
      if (nameInput && data.givenName) {
        setInputValue(nameInput, data.givenName);
        logToConsole('已设置名:', data.givenName);
        await sleep(150);
      } else {
        logToConsole('未找到名输入框');
      }
    } catch (e) {
      logToConsole('设置名时异常', e);
    }

  // 处理中间名按钮（新增代码）
  try {
    const middleNameLink = cardEl.querySelector('.passenger-card__unlimited-link');
    if (middleNameLink && middleNameLink.textContent.trim() === 'No middle name') {
      simulateClick(middleNameLink);
      logToConsole('已点击"No middle name"按钮');
      await sleep(200);
    }
  } catch (e) {
    logToConsole('处理中间名按钮时异常', e);
  }
    // 出生日期
	try {
		let birthInput = null;

		// 找到 Date of Birth 的 label
		const label = Array.from(cardEl.querySelectorAll('label')).find(
			(l) => (l.textContent || '').trim().includes('Date of Birth')
		);

		// 如果 label 有 for 属性，直接用 getElementById（避免 querySelector 报错）
		if (label && label.htmlFor) {
			birthInput = document.getElementById(label.htmlFor);
		}

		// fallback：通过 aria-describedby="datepicker-help" 找输入框
		if (!birthInput) {
			birthInput = Array.from(cardEl.querySelectorAll('input.input__text-input')).find(
				(i) => (i.getAttribute('aria-describedby') || '') === 'datepicker-help'
			);
		}

		// 填入出生日期
		if (birthInput && data.birthdate) {
			setInputValue(birthInput, data.birthdate);

			// 触发事件，确保页面识别到
			birthInput.dispatchEvent(new Event('input', { bubbles: true }));
			birthInput.dispatchEvent(new Event('change', { bubbles: true }));
			birthInput.dispatchEvent(new Event('blur', { bubbles: true }));

			logToConsole('已设置出生日期:', data.birthdate);
			await sleep(150);
		} else {
			logToConsole('未找到出生日期输入框');
		}
	} catch (e) {
		logToConsole('设置出生日期时异常', e);
	}

    // 国籍
    try {
      const natLabel=Array.from(cardEl.querySelectorAll('label')).find(l=>(l.textContent||'').includes('Nationality'));
      let natInput=natLabel&&document.getElementById(natLabel.htmlFor);
      if (natInput&&data.nationalityFull) {
        await selectFromDropdownInCard(natInput,cardEl,data.nationalityFull);
        logToConsole('已选择国籍:', data.nationalityFull);
      }
    } catch(e){ logToConsole('设置国籍异常', e); }

    // 护照号
    try {
      const numInput=cardEl.querySelector('input[title="Number"]');
      if (numInput&&data.passportNumber) {
        setInputValue(numInput,data.passportNumber);
        logToConsole('已设置护照号:', data.passportNumber);
      }
    } catch(e){ logToConsole('设置护照号异常', e); }

    // 签发国
    try {
      const issuingLabel=Array.from(cardEl.querySelectorAll('label')).find(l=>(l.textContent||'').trim()==='Issuing country');
      let issuingInput=issuingLabel&&document.getElementById(issuingLabel.htmlFor);
      if (issuingInput&&data.issuingCountryFull) {
        await selectFromDropdownInCard(issuingInput,cardEl,data.issuingCountryFull);
        logToConsole('已选择签发国:', data.issuingCountryFull);
      }
    } catch(e){ logToConsole('设置签发国异常', e); }

    // 有效期
    try {
      const expLabel=Array.from(cardEl.querySelectorAll('label')).find(l=>(l.textContent||'').includes('Expiration date'));
      let expInput=expLabel&&document.getElementById(expLabel.htmlFor);
      if (expInput&&data.expirationDate) {
        setInputValue(expInput,data.expirationDate);
        logToConsole('已设置有效期:', data.expirationDate);
      }
    } catch(e){ logToConsole('设置有效期异常', e); }

    logToConsole(`第 ${index+1} 位填写完成`);
  }
// 固定联系信息填写
async function fillContactInfo() {
  logToConsole('开始填写联系信息');

  try {
    // 📧 填写邮箱
    const emailInput = document.querySelector('input[id*="id_"][type="text"][maxlength="59"]');
    if (emailInput) {
      setInputValue(emailInput, DEFAULT_EMAIL);
      logToConsole('已设置邮箱:', DEFAULT_EMAIL);
      await sleep(200);
    }

    // 📱 选择中国区号 +86
    const phoneCodeInput = document.querySelector('input[name*="_code"][readonly]') ||
                          document.querySelector('input.input__text-input[readonly][aria-expanded="false"]');
    if (phoneCodeInput) {
      phoneCodeInput.click();
      logToConsole("✅ 已点击区号输入框，等待下拉展开…");
      await sleep(800);

      // 兼容不同 DOM 状态
      let dropdown = document.querySelector('.dropdown__wrapper .search-form__dropdown-inner.h-customized--scrollbar');
      if (!dropdown) {
        dropdown = document.querySelector('.search-form__dropdown-inner.h-customized--scrollbar');
      }

      if (dropdown) {
        const items = Array.from(dropdown.querySelectorAll('.search-form__dropdown-item'));
        logToConsole("📌 区号选项数量:", items.length);

        const chinaOption = items.find(item => (item.textContent || '').includes("China") && item.textContent.includes("86"));

        if (chinaOption) {
          logToConsole("✅ 找到 China (+86):", chinaOption.textContent.trim());
          ["mousedown","mouseup","click"].forEach(evt => {
            chinaOption.dispatchEvent(new MouseEvent(evt, { bubbles: true, cancelable: true, composed: true, view: window }));
          });
          logToConsole("🎉 已模拟点击 China (+86)");
          await sleep(1000);

          const phoneCodeSpan = document.querySelector('.phone_code');
          logToConsole("📌 选择后手机区号显示:", phoneCodeSpan?.textContent || "未获取到");
        } else {
          logToConsole("❌ 未找到 China (+86)，前5个:", items.slice(0, 5).map(el => el.textContent.trim()));
        }
      } else {
        logToConsole("❌ 未找到区号下拉容器");
      }
    }

    // 📲 填写手机号
    const phoneInput = document.querySelector('.js-phone input.input__text-input') ||
                      document.querySelector('input[maxlength="15"]');
    if (phoneInput) {
      setInputValue(phoneInput, DEFAULT_PHONE);
      logToConsole('已设置手机号:', DEFAULT_PHONE);
      await sleep(200);
    }

    // ✅ 勾选条款
    const checkbox = document.getElementById('all_agreement');
    if (checkbox && !checkbox.checked) {
      const label = document.querySelector('label[for="all_agreement"]');
      if (label) {
        simulateClick(label);
        logToConsole('已勾选条款');
      }
    } else if (checkbox?.checked) {
      logToConsole('条款已勾选，跳过');
    }

    logToConsole('🎉 联系信息填写完成');
  } catch (e) {
    logToConsole('❌ 填写联系信息时出错:', e);
  }
}



async function fillAllPassengers() {
  logToConsole('开始执行fillAllPassengers函数');

  const cards = Array.from(document.querySelectorAll('.passenger-card__inner'));
  const passports = window[passportsDataVarName] || [];

  logToConsole(`找到${cards.length}个卡片，${passports.length}条护照信息`);

  const count = Math.min(cards.length, passports.length);

  if (count === 0) {
    logToConsole('没有可填写的信息，跳过护照填写');
  } else {
    logToConsole(`准备填写${count}位乘客信息`);
    for (let i = 0; i < count; i++) {
      logToConsole(`正在填写第${i+1}位乘客`);
      await fillPassengerCard(cards[i], passports[i], i);
      await sleep(300);
    }
    logToConsole('所有护照信息填写完成');
  }
  // 填写联系信息
  logToConsole('开始填写联系信息');
  await fillContactInfo();
  logToConsole('fillAllPassengers函数执行完成');
}

function injectPanel() {
    if (document.getElementById('aerofill-panel')) return;
    const panel = document.createElement('div');
    panel.id = 'aerofill-panel';
    panel.style.cssText = `
      position:fixed;right:12px;top:80px;width:460px;z-index:999999;
      background:white;border:1px solid #ccc;box-shadow:0 6px 18px rgba(0,0,0,.12);
      border-radius:8px;font-family:Arial,sans-serif;font-size:13px;
    `;
    panel.innerHTML = `
      <div id="aerofill-header" style="cursor:move;padding:6px 10px;background:#2d8cff;color:#fff;border-radius:8px 8px 0 0;display:flex;justify-content:space-between;align-items:center;position:relative;">
        <span>SU护照自动填写   悦美华</span>
        <button id="aerofill-min" style="background:transparent;border:none;color:#fff;font-size:14px;cursor:pointer;
        position:absolute;right:10px;top:50%;transform:translateY(-50%);padding:2px 6px;width:auto;min-width:20px;">—</button>
      </div>
      <div id="aerofill-body" style="padding:8px;">
        <textarea id="aerofill-input" style="width:100%;height:120px;font-size:12px;
                  border:1px solid #ddd;border-radius:4px;padding:6px;box-sizing:border-box;"
                  placeholder="请输入信息...">${defaultInput}</textarea>
        <div style="margin:8px 0;display:flex;justify-content:space-between;gap:6px;">
          <button id="aerofill-parse" style="flex:1;padding:6px;border:1px solid #ddd;border-radius:4px;
                  background:#f5f5f5;cursor:pointer;">解析</button>
          <button id="aerofill-detect" style="flex:1;padding:6px;border:1px solid #ddd;border-radius:4px;
                  background:#f5f5f5;cursor:pointer;">检测卡数量</button>
          <button id="aerofill-fill-all" style="flex:1;padding:6px;border:1px solid #2d8cff;border-radius:4px;
                  background:#2d8cff;color:white;cursor:pointer;">填写全部</button>
        </div>
        <div style="margin:8px 0;display:flex;justify-content:center;gap:6px;">
          <button id="aerofill-fill-first" style="flex:1;max-width:200px;padding:6px;border:1px solid #ddd;
                  border-radius:4px;background:#f5f5f5;cursor:pointer;">填写第1位</button>
          <button id="aerofill-clear-log" style="flex:1;max-width:200px;padding:6px;border:1px solid #ddd;
                  border-radius:4px;background:#f5f5f5;cursor:pointer;">清日志</button>
        </div>
        <textarea id="aerofill-log-area" style="width:100%;height:140px;font-size:12px;
                  border:1px solid #ddd;border-radius:4px;padding:6px;box-sizing:border-box;"
                  readonly placeholder="日志信息..."></textarea>
      </div>
    `;
    document.body.appendChild(panel);

    // 最小化
    document.getElementById('aerofill-min').addEventListener('click',()=>{
      const body=document.getElementById('aerofill-body');
      body.style.display=body.style.display==='none'?'block':'none';
    });

    // 拖动
    const header=document.getElementById('aerofill-header');
    let isDrag=false,offsetX=0,offsetY=0;
    header.addEventListener('mousedown',e=>{
      isDrag=true; offsetX=e.clientX-panel.offsetLeft; offsetY=e.clientY-panel.offsetTop;
      document.addEventListener('mousemove',move); document.addEventListener('mouseup',stop);
    });
    function move(e){ if(!isDrag)return; panel.style.left=(e.clientX-offsetX)+'px'; panel.style.top=(e.clientY-offsetY)+'px'; panel.style.right='auto'; }
    function stop(){ isDrag=false; document.removeEventListener('mousemove',move); document.removeEventListener('mouseup',stop); }

    // 按钮
    document.getElementById('aerofill-parse').addEventListener('click',()=>{
    clearLog();
    const txt=document.getElementById('aerofill-input').value;
    const parsed=parsePassportsFromText(txt);
    logToConsole('解析到',parsed.length,'项');
    parsed.forEach((p,i)=>{
    logToConsole(
      `第${i+1}位 -> 姓:${p.surname}, 名:${p.givenName}, 性别:${p.gender}, 出生日期:${p.birthdate}, ` +
      `国籍:${p.nationalityFull}, 签发国:${p.issuingCountryFull}, 护照号:${p.passportNumber}, 有效期:${p.expirationDate}`
        );
        });
    });
    document.getElementById('aerofill-detect').addEventListener('click',()=>{
      const cards=document.querySelectorAll('.passenger-card__inner');
      logToConsole('检测到 passenger-card__inner 数量：',cards.length);
    });
    document.getElementById('aerofill-fill-all').addEventListener('click',fillAllPassengers);
    document.getElementById('aerofill-fill-first').addEventListener('click',async()=>{
      const txt=document.getElementById('aerofill-input').value;
      const arr=parsePassportsFromText(txt);
      const cards=Array.from(document.querySelectorAll('.passenger-card__inner'));
      // 填写联系信息
      if (cards.length&&arr.length) await fillPassengerCard(cards[0],arr[0],0);
      await fillContactInfo();
    });
    document.getElementById('aerofill-clear-log').addEventListener('click',clearLog);

    // 自动解析（输入或失焦时）
    const inputArea=document.getElementById('aerofill-input');
    ['input','blur'].forEach(ev=>{
      inputArea.addEventListener(ev,()=>{
        const parsed=parsePassportsFromText(inputArea.value);
        logToConsole(`自动解析: ${parsed.length} 条`);
      });
    });
  }

function waitForPassengerCard() {
  return new Promise((resolve) => {
    // 1. 页面已存在 passenger-card，直接返回
    if (document.querySelector('.passenger-card__inner') || document.getElementById('edit_psg_box-0')) {
      resolve();
      return;
    }

    // 2. 否则监听 DOM
    const observer = new MutationObserver(() => {
      if (document.querySelector('.passenger-card__inner') || document.getElementById('edit_psg_box-0')) {
        observer.disconnect();
        resolve();
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  });
}

(async function () {
  'use strict';

  // ... 你现有的全部代码（函数等）

  // 等待检测到乘机人卡片
  logToConsole('脚本已加载，等待乘机人卡片...');
  await waitForPassengerCard();
  logToConsole('检测到乘机人卡片，注入控制台面板');
  injectPanel();

})();

})();

