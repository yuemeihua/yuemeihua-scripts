// ==UserScript==
// @name         SU 官网自动填充护照信息（新版）
// @namespace    https://example.com/
// @version      2.1
// @description  Aeroflot 乘客页自动填写护照信 - 悦美华
// @author       胡朗 / Revised
// @match        https://www.aeroflot.ru/*/sb/passengers/*
// @match        https://www.aeroflot.ru/ru-en*
// @grant        none
// @run-at       document-end
// @updateURL    https://raw.githubusercontent.com/yuemeihua/yuemeihua-scripts/main/SU_new.js
// @downloadURL  https://raw.githubusercontent.com/yuemeihua/yuemeihua-scripts/main/SU_new.js
// ==/UserScript==


/*
更新日志：
v2.1 (2025-12-24)
- 支持新版官网护照信息填写页
- 优化国家选择匹配逻辑
*/
(function () {
  'use strict';

  // 使用 SU.js 的日志格式
  function logToConsole(...args) { console.log('[AeroFill]', ...args); appendLog(args.join(' ')); }
  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

  // 完整国家代码映射（合并三字码/二字码/国家名）
  // 来源：country_codes_mapping.json
  const COUNTRY_CODES = {
    "AND": { "two_letter": "AD", "country_name": "Andorra" },
    "ARE": { "two_letter": "AE", "country_name": "United Arab Emirates" },
    "AFG": { "two_letter": "AF", "country_name": "Afghanistan" },
    "ATG": { "two_letter": "AG", "country_name": "Antigua & Barbuda" },
    "AIA": { "two_letter": "AI", "country_name": "Anguilla" },
    "ALB": { "two_letter": "AL", "country_name": "Albania" },
    "ARM": { "two_letter": "AM", "country_name": "Armenia" },
    "AGO": { "two_letter": "AO", "country_name": "Angola" },
    "ATA": { "two_letter": "AQ", "country_name": "Antarctica" },
    "ARG": { "two_letter": "AR", "country_name": "Argentina" },
    "ASM": { "two_letter": "AS", "country_name": "American Samoa" },
    "AUT": { "two_letter": "AT", "country_name": "Austria" },
    "AUS": { "two_letter": "AU", "country_name": "Australia" },
    "ABW": { "two_letter": "AW", "country_name": "Aruba" },
    "AZE": { "two_letter": "AZ", "country_name": "Azerbaijan" },
    "BIH": { "two_letter": "BA", "country_name": "Bosnia & Herzegovina" },
    "BRB": { "two_letter": "BB", "country_name": "Barbados" },
    "BGD": { "two_letter": "BD", "country_name": "Bangladesh" },
    "BEL": { "two_letter": "BE", "country_name": "Belgium" },
    "BFA": { "two_letter": "BF", "country_name": "Burkina" },
    "BGR": { "two_letter": "BG", "country_name": "Bulgaria" },
    "BHS": { "two_letter": "BS", "country_name": "The Bahamas" },
    "BDI": { "two_letter": "BI", "country_name": "Burundi" },
    "BEN": { "two_letter": "BJ", "country_name": "Benin" },
    "BMU": { "two_letter": "BM", "country_name": "Bermuda" },
    "BTN": { "two_letter": "BT", "country_name": "Bhutan" },
    "BOL": { "two_letter": "BO", "country_name": "Bolivia" },
    "BES": { "two_letter": "BQ", "country_name": "Caribbean Netherlands" },
    "BWA": { "two_letter": "BW", "country_name": "Botswana" },
    "BVT": { "two_letter": "BV", "country_name": "Bouvet Island" },
    "BRA": { "two_letter": "BR", "country_name": "Brazil" },
    "IOT": { "two_letter": "IO", "country_name": "British Indian Ocean Territory" },
    "BRN": { "two_letter": "BN", "country_name": "Brunei Darussalam" },
    "BLR": { "two_letter": "BY", "country_name": "Belarus" },
    "BLZ": { "two_letter": "BZ", "country_name": "Belize" },
    "CAN": { "two_letter": "CA", "country_name": "Canada" },
    "CCK": { "two_letter": "CC", "country_name": "Cocos (Keeling) Islands" },
    "CAF": { "two_letter": "CF", "country_name": "Central African Republic" },
    "TCD": { "two_letter": "TD", "country_name": "Chad" },
    "CHL": { "two_letter": "CL", "country_name": "Chile" },
    "CHN": { "two_letter": "CN", "country_name": "China" },
    "CXR": { "two_letter": "CX", "country_name": "Christmas Island" },
    "COL": { "two_letter": "CO", "country_name": "Colombia" },
    "COM": { "two_letter": "KM", "country_name": "The Comoros" },
    "COG": { "two_letter": "CG", "country_name": "Congo" },
    "COD": { "two_letter": "CD", "country_name": "Democratic Republic of the Congo" },
    "COK": { "two_letter": "CK", "country_name": "Cook Islands" },
    "CRI": { "two_letter": "CR", "country_name": "Costa Rica" },
    "CIV": { "two_letter": "CI", "country_name": "Côte d'Ivoire" },
    "HRV": { "two_letter": "HR", "country_name": "Croatia" },
    "CUB": { "two_letter": "CU", "country_name": "Cuba" },
    "CUW": { "two_letter": "CW", "country_name": "Curaçao" },
    "CYP": { "two_letter": "CY", "country_name": "Cyprus" },
    "CZE": { "two_letter": "CZ", "country_name": "Czech Republic" },
    "DNK": { "two_letter": "DK", "country_name": "Denmark" },
    "DJI": { "two_letter": "DJ", "country_name": "Djibouti" },
    "DMA": { "two_letter": "DM", "country_name": "Dominica" },
    "DOM": { "two_letter": "DO", "country_name": "Dominican Republic" },
    "ECU": { "two_letter": "EC", "country_name": "Ecuador" },
    "EGY": { "two_letter": "EG", "country_name": "Egypt" },
    "SLV": { "two_letter": "SV", "country_name": "El Salvador" },
    "GNQ": { "two_letter": "GQ", "country_name": "Equatorial Guinea" },
    "ERI": { "two_letter": "ER", "country_name": "Eritrea" },
    "EST": { "two_letter": "EE", "country_name": "Estonia" },
    "SWZ": { "two_letter": "SZ", "country_name": "Eswatini" },
    "ETH": { "two_letter": "ET", "country_name": "Ethiopia" },
    "FLK": { "two_letter": "FK", "country_name": "Falkland Islands" },
    "FRO": { "two_letter": "FO", "country_name": "Faroe Islands" },
    "FJI": { "two_letter": "FJ", "country_name": "Fiji" },
    "FIN": { "two_letter": "FI", "country_name": "Finland" },
    "FRA": { "two_letter": "FR", "country_name": "France" },
    "GUF": { "two_letter": "GF", "country_name": "French Guiana" },
    "PYF": { "two_letter": "PF", "country_name": "French polynesia" },
    "ATF": { "two_letter": "TF", "country_name": "French Southern Territories" },
    "GAB": { "two_letter": "GA", "country_name": "Gabon" },
    "GMB": { "two_letter": "GM", "country_name": "Gambia" },
    "GEO": { "two_letter": "GE", "country_name": "Georgia" },
    "DEU": { "two_letter": "DE", "country_name": "Germany" },
    "GHA": { "two_letter": "GH", "country_name": "Ghana" },
    "GIB": { "two_letter": "GI", "country_name": "Gibraltar" },
    "GRC": { "two_letter": "GR", "country_name": "Greece" },
    "GRL": { "two_letter": "GL", "country_name": "Greenland" },
    "GRD": { "two_letter": "GD", "country_name": "Grenada" },
    "GLP": { "two_letter": "GP", "country_name": "Guadeloupe" },
    "GUM": { "two_letter": "GU", "country_name": "Guam" },
    "GTM": { "two_letter": "GT", "country_name": "Guatemala" },
    "GGY": { "two_letter": "GG", "country_name": "Guernsey" },
    "GIN": { "two_letter": "GN", "country_name": "Guinea" },
    "GNB": { "two_letter": "GW", "country_name": "Guinea-Bissau" },
    "GUY": { "two_letter": "GY", "country_name": "Guyana" },
    "HTI": { "two_letter": "HT", "country_name": "Haiti" },
    "HMD": { "two_letter": "HM", "country_name": "Heard Island and McDonald Islands" },
    "VAT": { "two_letter": "VA", "country_name": "Vatican City (The Holy See)" },
    "HND": { "two_letter": "HN", "country_name": "Honduras" },
    "HKG": { "two_letter": "HK", "country_name": "Hong Kong" },
    "HUN": { "two_letter": "HU", "country_name": "Hungary" },
    "ISL": { "two_letter": "IS", "country_name": "Iceland" },
    "IND": { "two_letter": "IN", "country_name": "India" },
    "IDN": { "two_letter": "ID", "country_name": "Indonesia" },
    "IRN": { "two_letter": "IR", "country_name": "Iran" },
    "IRQ": { "two_letter": "IQ", "country_name": "Iraq" },
    "IRL": { "two_letter": "IE", "country_name": "Ireland" },
    "IMN": { "two_letter": "IM", "country_name": "Isle of Man" },
    "ISR": { "two_letter": "IL", "country_name": "Israel" },
    "ITA": { "two_letter": "IT", "country_name": "Italy" },
    "JAM": { "two_letter": "JM", "country_name": "Jamaica" },
    "JPN": { "two_letter": "JP", "country_name": "Japan" },
    "JEY": { "two_letter": "JE", "country_name": "Jersey" },
    "JOR": { "two_letter": "JO", "country_name": "Jordan" },
    "KAZ": { "two_letter": "KZ", "country_name": "Kazakhstan" },
    "KEN": { "two_letter": "KE", "country_name": "Kenya" },
    "KIR": { "two_letter": "KI", "country_name": "Kiribati" },
    "PRK": { "two_letter": "KP", "country_name": "North Korea" },
    "KOR": { "two_letter": "KR", "country_name": "South Korea" },
    "KWT": { "two_letter": "KW", "country_name": "Kuwait" },
    "KGZ": { "two_letter": "KG", "country_name": "Kyrgyzstan" },
    "LAO": { "two_letter": "LA", "country_name": "Laos" },
    "LVA": { "two_letter": "LV", "country_name": "Latvia" },
    "LBN": { "two_letter": "LB", "country_name": "Lebanon" },
    "LSO": { "two_letter": "LS", "country_name": "Lesotho" },
    "LBR": { "two_letter": "LR", "country_name": "Liberia" },
    "LBY": { "two_letter": "LY", "country_name": "Libya" },
    "LIE": { "two_letter": "LI", "country_name": "Liechtenstein" },
    "LTU": { "two_letter": "LT", "country_name": "Lithuania" },
    "LUX": { "two_letter": "LU", "country_name": "Luxembourg" },
    "MAC": { "two_letter": "MO", "country_name": "Macao" },
    "MDG": { "two_letter": "MG", "country_name": "Madagascar" },
    "MWI": { "two_letter": "MW", "country_name": "Malawi" },
    "MYS": { "two_letter": "MY", "country_name": "Malaysia" },
    "MDV": { "two_letter": "MV", "country_name": "Maldives" },
    "MLI": { "two_letter": "ML", "country_name": "Mali" },
    "MLT": { "two_letter": "MT", "country_name": "Malta" },
    "MHL": { "two_letter": "MH", "country_name": "Marshall islands" },
    "MTQ": { "two_letter": "MQ", "country_name": "Martinique" },
    "MRT": { "two_letter": "MR", "country_name": "Mauritania" },
    "MUS": { "two_letter": "MU", "country_name": "Mauritius" },
    "MYT": { "two_letter": "YT", "country_name": "Mayotte" },
    "MEX": { "two_letter": "MX", "country_name": "Mexico" },
    "FSM": { "two_letter": "FM", "country_name": "Federated States of Micronesia" },
    "MDA": { "two_letter": "MD", "country_name": "Moldova" },
    "MCO": { "two_letter": "MC", "country_name": "Monaco" },
    "MNG": { "two_letter": "MN", "country_name": "Mongolia" },
    "MNE": { "two_letter": "ME", "country_name": "Montenegro" },
    "MSR": { "two_letter": "MS", "country_name": "Montserrat" },
    "MAR": { "two_letter": "MA", "country_name": "Morocco" },
    "MOZ": { "two_letter": "MZ", "country_name": "Mozambique" },
    "MMR": { "two_letter": "MM", "country_name": "Myanmar (Burma)" },
    "NAM": { "two_letter": "NA", "country_name": "Namibia" },
    "NRU": { "two_letter": "NR", "country_name": "Nauru" },
    "NPL": { "two_letter": "NP", "country_name": "Nepal" },
    "NLD": { "two_letter": "NL", "country_name": "Netherlands" },
    "NCL": { "two_letter": "NC", "country_name": "New Caledonia" },
    "NZL": { "two_letter": "NZ", "country_name": "New Zealand" },
    "NIC": { "two_letter": "NI", "country_name": "Nicaragua" },
    "NER": { "two_letter": "NE", "country_name": "Niger" },
    "NGA": { "two_letter": "NG", "country_name": "Nigeria" },
    "NIU": { "two_letter": "NU", "country_name": "Niue" },
    "NFK": { "two_letter": "NF", "country_name": "Norfolk Island" },
    "MNP": { "two_letter": "MP", "country_name": "Northern Mariana Islands" },
    "NOR": { "two_letter": "NO", "country_name": "Norway" },
    "OMN": { "two_letter": "OM", "country_name": "Oman" },
    "PAK": { "two_letter": "PK", "country_name": "Pakistan" },
    "PLW": { "two_letter": "PW", "country_name": "Palau" },
    "PSE": { "two_letter": "PS", "country_name": "Palestinian territories" },
    "PAN": { "two_letter": "PA", "country_name": "Panama" },
    "PNG": { "two_letter": "PG", "country_name": "Papua New Guinea" },
    "PRY": { "two_letter": "PY", "country_name": "Paraguay" },
    "PER": { "two_letter": "PE", "country_name": "Peru" },
    "PHL": { "two_letter": "PH", "country_name": "The Philippines" },
    "PCN": { "two_letter": "PN", "country_name": "Pitcairn Islands" },
    "POL": { "two_letter": "PL", "country_name": "Poland" },
    "PRT": { "two_letter": "PT", "country_name": "Portugal" },
    "PRI": { "two_letter": "PR", "country_name": "Puerto Rico" },
    "QAT": { "two_letter": "QA", "country_name": "Qatar" },
    "MKD": { "two_letter": "MK", "country_name": "North Macedonia" },
    "ROU": { "two_letter": "RO", "country_name": "Romania" },
    "RUS": { "two_letter": "RU", "country_name": "Russian Federation" },
    "RWA": { "two_letter": "RW", "country_name": "Rwanda" },
    "REU": { "two_letter": "RE", "country_name": "Réunion" },
    "BLM": { "two_letter": "BL", "country_name": "Saint Barthélemy" },
    "SHN": { "two_letter": "SH", "country_name": "St. Helena & Dependencies" },
    "KNA": { "two_letter": "KN", "country_name": "St. Kitts & Nevis" },
    "LCA": { "two_letter": "LC", "country_name": "St. Lucia" },
    "MAF": { "two_letter": "MF", "country_name": "Saint Martin (France)" },
    "SPM": { "two_letter": "PM", "country_name": "Saint-Pierre and Miquelon" },
    "VCT": { "two_letter": "VC", "country_name": "St. Vincent & the Grenadines" },
    "WSM": { "two_letter": "WS", "country_name": "Samoa" },
    "SMR": { "two_letter": "SM", "country_name": "San Marino" },
    "STP": { "two_letter": "ST", "country_name": "Sao Tome & Principe" },
    "SAU": { "two_letter": "SA", "country_name": "Saudi Arabia" },
    "SEN": { "two_letter": "SN", "country_name": "Senegal" },
    "SRB": { "two_letter": "RS", "country_name": "Serbia" },
    "SYC": { "two_letter": "SC", "country_name": "Seychelles" },
    "SLE": { "two_letter": "SL", "country_name": "Sierra Leone" },
    "SGP": { "two_letter": "SG", "country_name": "Singapore" },
    "SXM": { "two_letter": "SX", "country_name": "Sint Maarten (Dutch part)" },
    "SVK": { "two_letter": "SK", "country_name": "Slovakia" },
    "SVN": { "two_letter": "SI", "country_name": "Slovenia" },
    "SLB": { "two_letter": "SB", "country_name": "Solomon Islands" },
    "SOM": { "two_letter": "SO", "country_name": "Somalia" },
    "ZAF": { "two_letter": "ZA", "country_name": "South Africa" },
    "SGS": { "two_letter": "GS", "country_name": "South Georgia and the South Sandwich Islands" },
    "SSD": { "two_letter": "SS", "country_name": "South Sudan" },
    "ESP": { "two_letter": "ES", "country_name": "Spain" },
    "LKA": { "two_letter": "LK", "country_name": "Sri Lanka" },
    "SDN": { "two_letter": "SD", "country_name": "Sudan" },
    "SUR": { "two_letter": "SR", "country_name": "Suriname" },
    "SJM": { "two_letter": "SJ", "country_name": "Svalbard and Jan Mayen" },
    "SWE": { "two_letter": "SE", "country_name": "Sweden" },
    "CHE": { "two_letter": "CH", "country_name": "Switzerland" },
    "SYR": { "two_letter": "SY", "country_name": "Syria" },
    "TWN": { "two_letter": "TW", "country_name": "Taiwan" },
    "TJK": { "two_letter": "TJ", "country_name": "Tajikistan" },
    "TZA": { "two_letter": "TZ", "country_name": "Tanzania, United Republic of" },
    "THA": { "two_letter": "TH", "country_name": "Thailand" },
    "TLS": { "two_letter": "TL", "country_name": "Timor-Leste" },
    "TGO": { "two_letter": "TG", "country_name": "Togo" },
    "TKL": { "two_letter": "TK", "country_name": "Tokelau" },
    "TON": { "two_letter": "TO", "country_name": "Tonga" },
    "TTO": { "two_letter": "TT", "country_name": "Trinidad & Tobago" },
    "TUN": { "two_letter": "TN", "country_name": "Tunisia" },
    "TUR": { "two_letter": "TR", "country_name": "Turkey" },
    "TKM": { "two_letter": "TM", "country_name": "Turkmenistan" },
    "TCA": { "two_letter": "TC", "country_name": "Turks & Caicos Islands" },
    "TUV": { "two_letter": "TV", "country_name": "Tuvalu" },
    "UGA": { "two_letter": "UG", "country_name": "Uganda" },
    "UKR": { "two_letter": "UA", "country_name": "Ukraine" },
    "GBR": { "two_letter": "GB", "country_name": "Great Britain (United Kingdom; England)" },
    "UMI": { "two_letter": "UM", "country_name": "United States Minor Outlying Islands" },
    "URY": { "two_letter": "UY", "country_name": "Uruguay" },
    "UZB": { "two_letter": "UZ", "country_name": "Uzbekistan" },
    "VUT": { "two_letter": "VU", "country_name": "Vanuatu" },
    "VEN": { "two_letter": "VE", "country_name": "Venezuela" },
    "VNM": { "two_letter": "VN", "country_name": "Viet Nam" },
    "VGB": { "two_letter": "VG", "country_name": "British Virgin Islands" },
    "VIR": { "two_letter": "VI", "country_name": "United States Virgin Islands" },
    "WLF": { "two_letter": "WF", "country_name": "Wallis and Futuna" },
    "ESH": { "two_letter": "EH", "country_name": "Western Sahara" },
    "YEM": { "two_letter": "YE", "country_name": "Yemen" },
    "ZMB": { "two_letter": "ZM", "country_name": "Zambia" },
    "ZWE": { "two_letter": "ZW", "country_name": "Zimbabwe" }
  };

  // 存储解析到的护照数据
  const passportsDataVarName = 'passportsData';
  window[passportsDataVarName] = [];

  function appendLog(text) {
    const area = document.getElementById('aerofill-log-area');
    if (!area) return;
    const now = new Date().toLocaleTimeString();
    area.value += `[${now}] ${text}\n`;
    area.scrollTop = area.scrollHeight;
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

  function dispatchMouseSequence(el) {
    if (!el) return;
    ['mousedown', 'mouseup', 'click'].forEach(evt => {
      el.dispatchEvent(new MouseEvent(evt, { bubbles: true, cancelable: true, composed: true, view: window }));
    });
  }

  function simulateClick(el) {
    if (!el) return;
    el.focus && el.focus();
    dispatchMouseSequence(el);
  }

  // 文本归一化用于匹配（去多余空白、小写）
  function normalizeForMatch(s) {
    if (!s) return '';
    return s.replace(/\s+/g, ' ').trim().toLowerCase();
  }

  // 在下拉项中寻找匹配候选（candidates 为字符串数组，优先顺序由前到后）
  function findDropdownOptionByCandidates(options, candidates) {
    const normCandidates = (candidates || []).map(c => normalizeForMatch(c)).filter(Boolean);
    if (!normCandidates.length) return null;

    function escapeRegExp(str) {
      return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    // 第一轮：严格匹配（完全相等或整词匹配），优先选择完整国家名（不区分大小写）
    for (const opt of options) {
      const raw = opt.textContent || '';
      const txt = normalizeForMatch(raw);
      const txtNoParen = txt.replace(/\(.*?\)/g, '').trim();
      for (const cand of normCandidates) {
        if (!cand) continue;
        // 完全相等
        if (txt === cand || txtNoParen === cand) return opt;
        // 整词匹配（避免 'Indian' 匹配 'India' 的情况）
        try {
          const re = new RegExp('\\b' + escapeRegExp(cand) + '\\b', 'i');
          if (re.test(raw) || re.test(txtNoParen)) return opt;
        } catch (e) { /* ignore regex errors */ }
      }
    }

    // 第二轮：宽松匹配（包含/以候选开头）
    for (const opt of options) {
      const txt = normalizeForMatch(opt.textContent || '');
      const txtNoParen = txt.replace(/\(.*?\)/g, '').trim();
      for (const cand of normCandidates) {
        if (!cand) continue;
        if (txt.includes(cand) || txtNoParen.includes(cand)) return opt;
        if (txt.startsWith(cand) || txtNoParen.startsWith(cand)) return opt;
      }
    }

    return null;
  }

  // 更健壮地查找国家搜索输入框：优先按 placeholder 包含 Country 的输入，其次按聚焦输入，其次尝试常见选择器
  function findCountrySearchInput() {
    const byPlaceholder = document.querySelector('input[placeholder*="Country"], input[placeholder*="country"]');
    if (byPlaceholder) return byPlaceholder;
    // 常见 React/ant design 组合框搜索输入
    const combo = document.querySelector('input[role="combobox"], input[aria-label*="country"], input[aria-label*="Country"]');
    if (combo) return combo;
    if (document.activeElement && document.activeElement.tagName === 'INPUT') return document.activeElement;
    // 最后尝试页面上第一个可见的文本输入
    const inputs = Array.from(document.querySelectorAll('input[type="text"], input:not([type])'));
    for (const i of inputs) {
      const style = window.getComputedStyle(i);
      if (style && style.display !== 'none' && style.visibility !== 'hidden' && i.offsetWidth > 0 && i.offsetHeight > 0) return i;
    }
    return document.querySelector('input');
  }

  // 解析 SSR 行 (简化，足够常见格式)
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
      const idx = line.indexOf('P/');
      if (idx === -1) throw new Error('no P/');
      let after = line.substring(idx+2).trim();
      const parts = after.split('/');
      if (parts.length < 6) throw new Error('fields short');
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

      // 使用合并后的COUNTRY_CODES字典，支持二字码和三字码的正向和反向匹配
      let issuingCountryData = COUNTRY_CODES[out.issuingCountry] || COUNTRY_CODES[out.issuingCountry.toUpperCase()];
      let nationalityData = COUNTRY_CODES[out.nationality] || COUNTRY_CODES[out.nationality.toUpperCase()];

      // 如果直接匹配失败，尝试通过二字码反向查找
      if (!issuingCountryData && out.issuingCountry && out.issuingCountry.length === 2) {
        const upperCode = out.issuingCountry.toUpperCase();
        issuingCountryData = Object.values(COUNTRY_CODES).find(country => country.two_letter === upperCode);
      }

      if (!nationalityData && out.nationality && out.nationality.length === 2) {
        const upperCode = out.nationality.toUpperCase();
        nationalityData = Object.values(COUNTRY_CODES).find(country => country.two_letter === upperCode);
      }

      out.issuingIso2 = issuingCountryData?.two_letter || (out.issuingCountry && out.issuingCountry.length === 2 ? out.issuingCountry : null);
      out.nationalityIso2 = nationalityData?.two_letter || (out.nationality && out.nationality.length === 2 ? out.nationality : null);
      out.issuingCountryFull = issuingCountryData?.country_name || out.issuingCountry;
      out.nationalityFull = nationalityData?.country_name || out.nationality;
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
          results.push(parsed);
        }
      }
    }
    window[passportsDataVarName]=results;
    return results;
  }

  // 证件格式选择修复 - 使用用户提供的成功代码
  async function quickSelect() {
    try {
      // 找到Document type标签
      const label = Array.from(document.querySelectorAll('label'))
          .find(l => l.textContent.includes('Document type'));

      if (!label) {
        return false;
      }

      // 点击其父容器（通常是可点击的区域）
      const clickable = label.closest('.sc-ggpkNl') ||
                        label.closest('.sc-hIUIyC') ||
                        label.parentElement;

      if (clickable) {
        clickable.click();
      }

      // 等待并选择Other document
      await new Promise(resolve => setTimeout(resolve, 400));

      const items = Array.from(document.querySelectorAll('.dropdown-item'));
      const target = items.find(item =>
          item.textContent.includes('Other document')
      );

      if (target) {
        target.click();
        return true;
      } else {
        return false;
      }
    } catch (e) {
      return false;
    }
  }

  // 手机号区号选择 - 使用用户提供的成功代码
  async function forceSelect86() {
    try {
      // 1. 打开下拉框
      const codeInput = Array.from(document.querySelectorAll('input[readonly]'))
          .find(input => !input.value.includes('passport'));

      if (!codeInput) {
        return false;
      }

      const container = codeInput.closest('.sc-ggpkNl') || codeInput.parentElement;
      container.click();

      await new Promise(resolve => setTimeout(resolve, 500));

      const searchBox = document.querySelector('input[placeholder="Country or country code"]');

      if (!searchBox) {
        return false;
      }

      // 强制设置值并触发React事件
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          'value'
      ).set;

      nativeInputValueSetter.call(searchBox, '86');

      // 触发React的change事件
      const event = new Event('input', { bubbles: true });
      searchBox.dispatchEvent(event);

      // 等待更长时间
      await new Promise(resolve => setTimeout(resolve, 1500));

      const items = Array.from(document.querySelectorAll('.dropdown-item'));

      const china = items.find(item =>
          item.textContent.includes('+86') ||
          item.textContent.includes('China')
      );

      if (china) {
        china.click();
        return true;
      } else {
        return false;
      }
    } catch (e) {
      return false;
    }
  }

  // 容器识别函数 - 通过文本"Adult"或"Adult X"识别
  function getAdultContainers() {
    // 首先尝试查找多个乘客的情况："Adult X"
    let adults = Array.from(document.querySelectorAll('p'))
      .filter(p => /^Adult\s+\d+$/i.test(p.innerText.trim()));

    // 如果没有找到，尝试查找单个乘客的情况："Adult"
    if (adults.length === 0) {
      adults = Array.from(document.querySelectorAll('p'))
        .filter(p => /^Adult$/i.test(p.innerText.trim()));
    }

    const clickContainers = adults.map(p =>
      p.closest('div[tabindex="0"]')
    );

    console.log(clickContainers);
    return clickContainers.filter(container => container !== null);
  }

  // 新的护照信息填写函数 - 适应新的UI结构
  async function fillPassengerCardNew(container, data, index) {
    logToConsole(`开始填写第 ${index+1} 位`);
    // 点击容器打开填写页面
    simulateClick(container);
    await sleep(1000);

    try {
      // 姓
      const lastNameLabel = Array.from(document.querySelectorAll('label')).find(
        label => label.textContent.includes('Last name')
      );
      const lastNameInput = lastNameLabel?.parentElement.querySelector('input');
      if (lastNameInput && data.surname) {
        setInputValue(lastNameInput, data.surname);
        logToConsole('已设置姓:', data.surname);
        await sleep(200);
      } else {
        logToConsole('未找到姓输入框');
      }
    } catch (e) {
      logToConsole('设置姓时异常', e);
    }

    try {
      // 名
      const firstNameLabel = Array.from(document.querySelectorAll('label')).find(
        label => label.textContent.includes('First name')
      );
      const firstNameInput = firstNameLabel?.parentElement.querySelector('input');
      if (firstNameInput && data.givenName) {
        setInputValue(firstNameInput, data.givenName);
        logToConsole('已设置名:', data.givenName);
        await sleep(200);
      } else {
        logToConsole('未找到名输入框');
      }
    } catch (e) {
      logToConsole('设置名时异常', e);
    }

    try {
      // 勾选"No patronymic"
      const noPatronymicLabel = Array.from(document.querySelectorAll('label')).find(
        label => label.textContent.includes('No patronymic')
      );
      if (noPatronymicLabel) {
        const checkbox = noPatronymicLabel.querySelector('input[type="checkbox"]');
        if (checkbox && !checkbox.checked) {
          simulateClick(noPatronymicLabel);
          logToConsole('已点击"No patronymic"按钮');
          await sleep(200);
        }
      }
    } catch (e) {
      logToConsole('处理中间名按钮时异常', e);
    }

    try {
      // 出生日期
      const birthLabel = Array.from(document.querySelectorAll('label')).find(
        label => label.textContent.includes('Date of birth')
      );
      const birthInput = birthLabel?.parentElement.querySelector('input');
      if (birthInput && data.birthdate) {
        setInputValue(birthInput, data.birthdate);
        logToConsole('已设置出生日期:', data.birthdate);
        await sleep(200);
      } else {
        logToConsole('未找到出生日期输入框');
      }
    } catch (e) {
      logToConsole('设置出生日期时异常', e);
    }

    try {
      // 性别选择
      const genderButtons = Array.from(document.querySelectorAll('button')).filter(
        button => button.textContent.includes('Male') || button.textContent.includes('Female')
      );

      if (genderButtons.length > 0 && data.gender) {
        const targetGender = data.gender === 'M' ? 'Male' : 'Female';
        const genderButton = genderButtons.find(
          button => button.textContent.includes(targetGender)
        );

        if (genderButton) {
          simulateClick(genderButton);
          logToConsole('已设置性别为', data.gender);
          await sleep(200);
        } else {
          logToConsole('未找到匹配的性别控件');
        }
      }
    } catch (e) {
      logToConsole('设置性别时异常', e);
    }

    try {
      // 护照类型选择 - Other document
      await quickSelect();
      await sleep(500);
    } catch (e) {
      logToConsole('设置护照类型时异常', e);
    }

    try {
      // 护照号 - 根据需求文档更新定位方式
      const passportLabel = Array.from(document.querySelectorAll('label')).find(
        label => label.textContent.includes('Document number')
      );

      let passportInput = null;
      if (passportLabel) {
        // 尝试多种方式找到输入框
        passportInput = passportLabel.parentElement.querySelector('input') ||
                       passportLabel.nextElementSibling?.querySelector('input') ||
                       passportLabel.closest('div').querySelector('input');
      }

      // 如果还是找不到，尝试通过maxlength查找
      if (!passportInput) {
        const allInputs = Array.from(document.querySelectorAll('input'));
        passportInput = allInputs.find(input =>
          input.getAttribute('maxlength') === '15' &&
          !input.getAttribute('readonly') &&
          !input.value
        );
      }

      if (passportInput && data.passportNumber) {
        setInputValue(passportInput, data.passportNumber);
        logToConsole('已设置护照号:', data.passportNumber);
        await sleep(200);
      } else {
        logToConsole('未找到护照号输入框');
      }
    } catch (e) {
      logToConsole('设置护照号异常', e);
    }

    try {
      // 护照过期日期
      const expiryLabel = Array.from(document.querySelectorAll('label')).find(
        label => label.textContent.includes('Expiry date')
      );
      const expiryInput = expiryLabel?.parentElement.querySelector('input');
      if (expiryInput && data.expirationDate) {
        setInputValue(expiryInput, data.expirationDate);
        logToConsole('已设置有效期:', data.expirationDate);
        await sleep(200);
      } else {
        logToConsole('未找到有效期输入框');
      }
    } catch (e) {
      logToConsole('设置有效期异常', e);
    }

    try {
      // 国籍字段填充
      const citizenshipLabel = Array.from(document.querySelectorAll('label')).find(
        label => label.textContent.includes('Citizenship')
      );

      let citizenshipInput = null;
      if (citizenshipLabel) {
        citizenshipInput = citizenshipLabel.parentElement.querySelector('input') ||
                           citizenshipLabel.nextElementSibling?.querySelector('input') ||
                           citizenshipLabel.closest('div').querySelector('input');
      }

      if (citizenshipInput && data.nationalityFull) {
        // 点击输入框打开下拉
        simulateClick(citizenshipInput);
        await sleep(500);

        // 输入国籍名称（或 ISO 码）以触发下拉过滤
        const searchInput = findCountrySearchInput();
        if (searchInput) {
          // 准备候选：优先完整国家名，再尝试 ISO2/ISO3
          const candidates = [data.nationalityFull, data.nationalityIso2, data.nationality];
          setInputValue(searchInput, data.nationalityFull);
          await sleep(500);

          // 查找并点击匹配的选项（更健壮的匹配规则）
          const options = Array.from(document.querySelectorAll('.dropdown-item'));
          const targetOption = findDropdownOptionByCandidates(options, candidates);

          if (targetOption) {
            simulateClick(targetOption);
            logToConsole('已选择国籍:', data.nationalityFull);
            await sleep(300);
          } else {
            // 备用：如果未找到，尝试直接按第一个结果
            if (options.length) { simulateClick(options[0]); await sleep(200); }
          }
        }
      }
    } catch (e) {
      logToConsole('设置国籍异常', e);
    }

    try {
      // 签发国字段填充
      const issuingLabel = Array.from(document.querySelectorAll('label')).find(
        label => label.textContent.includes('Country of issue')
      );

      let issuingInput = null;
      if (issuingLabel) {
        issuingInput = issuingLabel.parentElement.querySelector('input') ||
                       issuingLabel.nextElementSibling?.querySelector('input') ||
                       issuingLabel.closest('div').querySelector('input');
      }

      if (issuingInput && data.issuingCountryFull) {
        // 点击输入框打开下拉
        simulateClick(issuingInput);
        await sleep(500);

        // 输入签发国名称（或 ISO 码）以触发下拉过滤
        const searchInput = findCountrySearchInput();
        if (searchInput) {
          const candidates = [data.issuingCountryFull, data.issuingIso2, data.issuingCountry];
          setInputValue(searchInput, data.issuingCountryFull);
          await sleep(500);

          const options = Array.from(document.querySelectorAll('.dropdown-item'));
          const targetOption = findDropdownOptionByCandidates(options, candidates);

          if (targetOption) {
            simulateClick(targetOption);
            logToConsole('已选择签发国:', data.issuingCountryFull);
            await sleep(300);
          } else {
            logToConsole('未找到匹配的签发国选项，尝试回退到第一个结果（如有）');
            if (options.length) { simulateClick(options[0]); await sleep(200); }
          }
        }
      }
    } catch (e) {
      logToConsole('设置签发国异常', e);
    }

    try {
      // 点击关闭按钮（替换Continue按钮）
      const closeButton = Array.from(document.querySelectorAll('button')).find(
        button => {
          const svg = button.querySelector('svg path');
          return svg && svg.getAttribute('d') && svg.getAttribute('d').includes('M6.273 6.263c-.66.66-.566.754');
        }
      );

      if (closeButton) {
        simulateClick(closeButton);
        await sleep(500);
      } else {
        // 备用方案：如果找不到关闭按钮，尝试点击Continue按钮
        const continueButton = Array.from(document.querySelectorAll('button')).find(
          button => button.textContent.includes('Continue')
        );

        if (continueButton) {
          simulateClick(continueButton);
          await sleep(500);
        }
      }
    } catch (e) {
      logToConsole('点击关闭/Continue按钮时异常', e);
    }

    logToConsole(`第 ${index+1} 位填写完成`);
  }

  // 新的联系信息填写函数 - 适应新的UI结构
  async function fillContactInfoNew() {
    logToConsole('开始填写联系信息');

    try {
      // 邮箱
      const emailLabel = Array.from(document.querySelectorAll('label')).find(
        label => label.textContent === 'Email'
      );
      const emailInput = emailLabel?.parentElement.querySelector('input');
      if (emailInput) {
        setInputValue(emailInput, 'yuemeihuafly@163.com');
        logToConsole('已设置邮箱:', 'yuemeihuafly@163.com');
        await sleep(200);
      }
    } catch (e) {
      logToConsole('设置邮箱时异常', e);
    }

    try {
      // 选择区号 - 使用用户提供的成功代码
      await forceSelect86();
    } catch (e) {
      logToConsole('选择区号时异常', e);
    }

    try {
      // 手机号
      const phoneLabel = Array.from(document.querySelectorAll('label')).find(
        label => label.textContent.includes('Phone')
      );
      const phoneInput = phoneLabel?.parentElement.querySelector('input');
      if (phoneInput) {
        setInputValue(phoneInput, '18610429740');
        logToConsole('已设置手机号:', '18610429740');
        await sleep(100);
      }
    } catch (e) {
      logToConsole('设置手机号时异常', e);
    }

    try {
      // 勾选条款
      const termsLabel = Array.from(document.querySelectorAll('label')).find(
        label => label.textContent.includes('terms and conditions')
      );

      if (termsLabel) {
        const checkbox = termsLabel.querySelector('input[type="checkbox"]');
        if (checkbox && !checkbox.checked) {
          simulateClick(termsLabel);
          logToConsole('已勾选条款');
          await sleep(100);
        } else if (checkbox?.checked) {
          logToConsole('条款已勾选，跳过');
        }
      }
    } catch (e) {
      logToConsole('勾选条款时异常', e);
    }

    logToConsole('联系信息填写完成');
  }

  // 新的填写所有乘客函数
  async function fillAllPassengersNew() {
    logToConsole('开始执行fillAllPassengersNew函数');

    const containers = getAdultContainers();
    const passports = window[passportsDataVarName] || [];

    logToConsole(`找到${containers.length}个卡片，${passports.length}条护照信息`);

    const count = Math.min(containers.length, passports.length);

    if (count === 0) {
      logToConsole('没有可填写的信息，跳过护照填写');
    } else {
      logToConsole(`准备填写${count}位乘客信息`);
      for (let i = 0; i < count; i++) {
        logToConsole(`正在填写第${i+1}位乘客`);
        await fillPassengerCardNew(containers[i], passports[i], i);
        await sleep(300);
      }
      logToConsole('所有护照信息填写完成');
    }

    // 填写联系信息
    logToConsole('开始填写联系信息');
    await fillContactInfoNew();
    logToConsole('fillAllPassengersNew函数执行完成');
  }

  function injectPanel() {
    // 检查是否存在容器，如果没有则不显示面板
    const containers = getAdultContainers();
    if (containers.length === 0) {
      // 如果面板已存在，则关闭它
      const existingPanel = document.getElementById('aerofill-panel');
      if (existingPanel) {
        existingPanel.remove();
        logToConsole('未检测到容器，已关闭面板');
      }
      return;
    }

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
                  placeholder="请输入信息..."></textarea>
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
      const containers=getAdultContainers();
      logToConsole('检测到Adult容器数量：',containers.length);
    });

    document.getElementById('aerofill-fill-all').addEventListener('click',fillAllPassengersNew);

    document.getElementById('aerofill-fill-first').addEventListener('click',async()=>{
      const txt=document.getElementById('aerofill-input').value;
      const arr=parsePassportsFromText(txt);
      const containers=getAdultContainers();
      // 填写第一位乘客
      if (containers.length&&arr.length) await fillPassengerCardNew(containers[0],arr[0],0);
      await fillContactInfoNew();
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

  function clearLog() {
    const area = document.getElementById('aerofill-log-area');
    if (area) area.value = '';
  }

  function waitForPassengerCard() {
    return new Promise((resolve) => {
      // 直接等待一段时间后继续，不依赖特定元素检测
      setTimeout(() => {
        resolve();
      }, 2000); // 等待2秒确保页面基本加载完成
    });
  }

  (async function () {
    'use strict';

    // 直接注入控制面板，不等待特定元素
    logToConsole('脚本已加载，注入控制台面板');
    injectPanel();

    // 监听URL变化，适用于单页应用
    let currentUrl = window.location.href;
    const checkUrlChange = () => {
      if (window.location.href !== currentUrl) {
        currentUrl = window.location.href;
        logToConsole('检测到URL变化:', currentUrl);

        // 如果URL包含乘客页面路径，检查容器并注入面板
        if (currentUrl.includes('/sb/passengers/') ||
            currentUrl.includes('/ru-en') ||
            currentUrl.includes('/ru') ||
            currentUrl.includes('/en')) {
          logToConsole('检查容器并注入控制面板');
          injectPanel();
        }
      }
    };

    // 定期检查URL变化和容器状态
    setInterval(checkUrlChange, 1000);

  })();

})();