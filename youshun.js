// ==UserScript==
// @name         优顺自动填充护照信息
// @namespace    https://example.com/
// @version      1.0
// @description  在优顺乘客页自动填写护照信息
// @author       胡朗
// @match        https://agent.oriental-sky.com/*
// @grant        none
// @run-at       document-idle
// @updateURL    https://raw.githubusercontent.com/tryle17/yuemeihua-scripts/main/youshun.js
// @downloadURL  https://raw.githubusercontent.com/tryle17/yuemeihua-scripts/main/youshun.js
// ==/UserScript==

/*
更新日志：
v1.0 (2025-12-29)
- 初始版本：支持护照信息自动填充
---- 待优化 ----
- 日期填写逻辑待优化
*/

(function () {
  'use strict';

  const passportsDataVarName = 'passportsData';
  window[passportsDataVarName] = [];
  
  // 固定手机号和邮箱
  const DEFAULT_PHONE = '18610429740';
  const DEFAULT_EMAIL = 'yuemeihuafly@163.com';
  
  // 国家代码映射数据（从country_codes_mapping.json集成）
  const COUNTRY_CODES_MAPPING = {
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
    "ALA": { "two_letter": "AX", "country_name": "?aland Island" },
    "AZE": { "two_letter": "AZ", "country_name": "Azerbaijan" },
    "BIH": { "two_letter": "BA", "country_name": "Bosnia & Herzegovina" },
    "BRB": { "two_letter": "BB", "country_name": "Barbados" },
    "BGD": { "two_letter": "BD", "country_name": "Bangladesh" },
    "BEL": { "two_letter": "BE", "country_name": "Belgium" },
    "BFA": { "two_letter": "BF", "country_name": "Burkina" },
    "BGR": { "two_letter": "BG", "country_name": "Bulgaria" },
    "BHR": { "two_letter": "BH", "country_name": "Bahrain" },
    "BDI": { "two_letter": "BI", "country_name": "Burundi" },
    "BEN": { "two_letter": "BJ", "country_name": "Benin" },
    "BLM": { "two_letter": "BL", "country_name": "Saint Barthélemy" },
    "BMU": { "two_letter": "BM", "country_name": "Bermuda" },
    "BRN": { "two_letter": "BN", "country_name": "Brunei" },
    "BOL": { "two_letter": "BO", "country_name": "Bolivia" },
    "BES": { "two_letter": "BQ", "country_name": "Caribbean Netherlands" },
    "BRA": { "two_letter": "BR", "country_name": "Brazil" },
    "BHS": { "two_letter": "BS", "country_name": "The Bahamas" },
    "BTN": { "two_letter": "BT", "country_name": "Bhutan" },
    "BVT": { "two_letter": "BV", "country_name": "Bouvet Island" },
    "BWA": { "two_letter": "BW", "country_name": "Botswana" },
    "BLR": { "two_letter": "BY", "country_name": "Belarus" },
    "BLZ": { "two_letter": "BZ", "country_name": "Belize" },
    "CAN": { "two_letter": "CA", "country_name": "Canada" },
    "CCK": { "two_letter": "CC", "country_name": "Cocos (Keeling) Islands" },
    "CAF": { "two_letter": "CF", "country_name": "Central African Republic" },
    "CHE": { "two_letter": "CH", "country_name": "Switzerland" },
    "CHL": { "two_letter": "CL", "country_name": "Chile" },
    "CMR": { "two_letter": "CM", "country_name": "Cameroon" },
    "COL": { "two_letter": "CO", "country_name": "Colombia" },
    "CRI": { "two_letter": "CR", "country_name": "Costa Rica" },
    "CUB": { "two_letter": "CU", "country_name": "Cuba" },
    "CPV": { "two_letter": "CV", "country_name": "Cape Verde" },
    "CXR": { "two_letter": "CX", "country_name": "Christmas Island" },
    "CYP": { "two_letter": "CY", "country_name": "Cyprus" },
    "CZE": { "two_letter": "CZ", "country_name": "Czech Republic" },
    "DEU": { "two_letter": "DE", "country_name": "Germany" },
    "DJI": { "two_letter": "DJ", "country_name": "Djibouti" },
    "DNK": { "two_letter": "DK", "country_name": "Denmark" },
    "DMA": { "two_letter": "DM", "country_name": "Dominica" },
    "DOM": { "two_letter": "DO", "country_name": "Dominican Republic" },
    "DZA": { "two_letter": "DZ", "country_name": "Algeria" },
    "ECU": { "two_letter": "EC", "country_name": "Ecuador" },
    "EST": { "two_letter": "EE", "country_name": "Estonia" },
    "EGY": { "two_letter": "EG", "country_name": "Egypt" },
    "ESH": { "two_letter": "EH", "country_name": "Western Sahara" },
    "ERI": { "two_letter": "ER", "country_name": "Eritrea" },
    "ESP": { "two_letter": "ES", "country_name": "Spain" },
    "FIN": { "two_letter": "FI", "country_name": "Finland" },
    "FJI": { "two_letter": "FJ", "country_name": "Fiji" },
    "FLK": { "two_letter": "FK", "country_name": "Falkland Islands" },
    "FSM": { "two_letter": "FM", "country_name": "Federated States of Micronesia" },
    "FRO": { "two_letter": "FO", "country_name": "Faroe Islands" },
    "FRA": { "two_letter": "FR", "country_name": "France" },
    "GAB": { "two_letter": "GA", "country_name": "Gabon" },
    "GRD": { "two_letter": "GD", "country_name": "Grenada" },
    "GEO": { "two_letter": "GE", "country_name": "Georgia" },
    "GUF": { "two_letter": "GF", "country_name": "French Guiana" },
    "GHA": { "two_letter": "GH", "country_name": "Ghana" },
    "GIB": { "two_letter": "GI", "country_name": "Gibraltar" },
    "GRL": { "two_letter": "GL", "country_name": "Greenland" },
    "GIN": { "two_letter": "GN", "country_name": "Guinea" },
    "GLP": { "two_letter": "GP", "country_name": "Guadeloupe" },
    "GNQ": { "two_letter": "GQ", "country_name": "Equatorial Guinea" },
    "GRC": { "two_letter": "GR", "country_name": "Greece" },
    "SGS": { "two_letter": "GS", "country_name": "South Georgia and the South Sandwich Islands" },
    "GTM": { "two_letter": "GT", "country_name": "Guatemala" },
    "GUM": { "two_letter": "GU", "country_name": "Guam" },
    "GNB": { "two_letter": "GW", "country_name": "Guinea-Bissau" },
    "GUY": { "two_letter": "GY", "country_name": "Guyana" },
    "HKG": { "two_letter": "HK", "country_name": "Hong Kong" },
    "HMD": { "two_letter": "HM", "country_name": "Heard Island and McDonald Islands" },
    "HND": { "two_letter": "HN", "country_name": "Honduras" },
    "HRV": { "two_letter": "HR", "country_name": "Croatia" },
    "HTI": { "two_letter": "HT", "country_name": "Haiti" },
    "HUN": { "two_letter": "HU", "country_name": "Hungary" },
    "IDN": { "two_letter": "ID", "country_name": "Indonesia" },
    "IRL": { "two_letter": "IE", "country_name": "Ireland" },
    "ISR": { "two_letter": "IL", "country_name": "Israel" },
    "IMN": { "two_letter": "IM", "country_name": "Isle of Man" },
    "IND": { "two_letter": "IN", "country_name": "India" },
    "IOT": { "two_letter": "IO", "country_name": "British Indian Ocean Territory" },
    "IRQ": { "two_letter": "IQ", "country_name": "Iraq" },
    "IRN": { "two_letter": "IR", "country_name": "Iran" },
    "ISL": { "two_letter": "IS", "country_name": "Iceland" },
    "ITA": { "two_letter": "IT", "country_name": "Italy" },
    "JEY": { "two_letter": "JE", "country_name": "Jersey" },
    "JAM": { "two_letter": "JM", "country_name": "Jamaica" },
    "JOR": { "two_letter": "JO", "country_name": "Jordan" },
    "JPN": { "two_letter": "JP", "country_name": "Japan" },
    "KHM": { "two_letter": "KH", "country_name": "Cambodia" },
    "KIR": { "two_letter": "KI", "country_name": "Kiribati" },
    "COM": { "two_letter": "KM", "country_name": "The Comoros" },
    "KWT": { "two_letter": "KW", "country_name": "Kuwait" },
    "CYM": { "two_letter": "KY", "country_name": "Cayman Islands" },
    "LBN": { "two_letter": "LB", "country_name": "Lebanon" },
    "LIE": { "two_letter": "LI", "country_name": "Liechtenstein" },
    "LKA": { "two_letter": "LK", "country_name": "Sri Lanka" },
    "LBR": { "two_letter": "LR", "country_name": "Liberia" },
    "LSO": { "two_letter": "LS", "country_name": "Lesotho" },
    "LTU": { "two_letter": "LT", "country_name": "Lithuania" },
    "LUX": { "two_letter": "LU", "country_name": "Luxembourg" },
    "LVA": { "two_letter": "LV", "country_name": "Latvia" },
    "LBY": { "two_letter": "LY", "country_name": "Libya" },
    "MAR": { "two_letter": "MA", "country_name": "Morocco" },
    "MCO": { "two_letter": "MC", "country_name": "Monaco" },
    "MDA": { "two_letter": "MD", "country_name": "Moldova" },
    "MNE": { "two_letter": "ME", "country_name": "Montenegro" },
    "MAF": { "two_letter": "MF", "country_name": "Saint Martin (France)" },
    "MDG": { "two_letter": "MG", "country_name": "Madagascar" },
    "MHL": { "two_letter": "MH", "country_name": "Marshall islands" },
    "MKD": { "two_letter": "MK", "country_name": "Republic of Macedonia (FYROM)" },
    "MLI": { "two_letter": "ML", "country_name": "Mali" },
    "MMR": { "two_letter": "MM", "country_name": "Myanmar (Burma)" },
    "MAC": { "two_letter": "MO", "country_name": "Macao" },
    "MTQ": { "two_letter": "MQ", "country_name": "Martinique" },
    "MRT": { "two_letter": "MR", "country_name": "Mauritania" },
    "MSR": { "two_letter": "MS", "country_name": "Montserrat" },
    "MLT": { "two_letter": "MT", "country_name": "Malta" },
    "MDV": { "two_letter": "MV", "country_name": "Maldives" },
    "MWI": { "two_letter": "MW", "country_name": "Malawi" },
    "MEX": { "two_letter": "MX", "country_name": "Mexico" },
    "MYS": { "two_letter": "MY", "country_name": "Malaysia" },
    "NAM": { "two_letter": "NA", "country_name": "Namibia" },
    "NER": { "two_letter": "NE", "country_name": "Niger" },
    "NFK": { "two_letter": "NF", "country_name": "Norfolk Island" },
    "NGA": { "two_letter": "NG", "country_name": "Nigeria" },
    "NIC": { "two_letter": "NI", "country_name": "Nicaragua" },
    "NLD": { "two_letter": "NL", "country_name": "Netherlands" },
    "NOR": { "two_letter": "NO", "country_name": "Norway" },
    "NPL": { "two_letter": "NP", "country_name": "Nepal" },
    "NRU": { "two_letter": "NR", "country_name": "Nauru" },
    "OMN": { "two_letter": "OM", "country_name": "Oman" },
    "PAN": { "two_letter": "PA", "country_name": "Panama" },
    "PER": { "two_letter": "PE", "country_name": "Peru" },
    "PYF": { "two_letter": "PF", "country_name": "French polynesia" },
    "PNG": { "two_letter": "PG", "country_name": "Papua New Guinea" },
    "PHL": { "two_letter": "PH", "country_name": "The Philippines" },
    "PAK": { "two_letter": "PK", "country_name": "Pakistan" },
    "POL": { "two_letter": "PL", "country_name": "Poland" },
    "PCN": { "two_letter": "PN", "country_name": "Pitcairn Islands" },
    "PRI": { "two_letter": "PR", "country_name": "Puerto Rico" },
    "PSE": { "two_letter": "PS", "country_name": "Palestinian territories" },
    "PLW": { "two_letter": "PW", "country_name": "Palau" },
    "PRY": { "two_letter": "PY", "country_name": "Paraguay" },
    "QAT": { "two_letter": "QA", "country_name": "Qatar" },
    "REU": { "two_letter": "RE", "country_name": "Réunion" },
    "ROU": { "two_letter": "RO", "country_name": "Romania" },
    "SRB": { "two_letter": "RS", "country_name": "Serbia" },
    "RUS": { "two_letter": "RU", "country_name": "Russian Federation" },
    "RWA": { "two_letter": "RW", "country_name": "Rwanda" },
    "SLB": { "two_letter": "SB", "country_name": "Solomon Islands" },
    "SYC": { "two_letter": "SC", "country_name": "Seychelles" },
    "SDN": { "two_letter": "SD", "country_name": "Sudan" },
    "SWE": { "two_letter": "SE", "country_name": "Sweden" },
    "SGP": { "two_letter": "SG", "country_name": "Singapore" },
    "SVN": { "two_letter": "SI", "country_name": "Slovenia" },
    "SJM": { "two_letter": "SJ", "country_name": "Template:Country data SJM Svalbard" },
    "SVK": { "two_letter": "SK", "country_name": "Slovakia" },
    "SLE": { "two_letter": "SL", "country_name": "Sierra Leone" },
    "SMR": { "two_letter": "SM", "country_name": "San Marino" },
    "SEN": { "two_letter": "SN", "country_name": "Senegal" },
    "SOM": { "two_letter": "SO", "country_name": "Somalia" },
    "SUR": { "two_letter": "SR", "country_name": "Suriname" },
    "SSD": { "two_letter": "SS", "country_name": "South Sudan" },
    "STP": { "two_letter": "ST", "country_name": "Sao Tome & Principe" },
    "SLV": { "two_letter": "SV", "country_name": "El Salvador" },
    "SYR": { "two_letter": "SY", "country_name": "Syria" },
    "SWZ": { "two_letter": "SZ", "country_name": "Swaziland" },
    "TCA": { "two_letter": "TC", "country_name": "Turks & Caicos Islands" },
    "TCD": { "two_letter": "TD", "country_name": "Chad" },
    "TGO": { "two_letter": "TG", "country_name": "Togo" },
    "THA": { "two_letter": "TH", "country_name": "Thailand" },
    "TKL": { "two_letter": "TK", "country_name": "Tokelau" },
    "TLS": { "two_letter": "TL", "country_name": "Timor-Leste (East Timor)" },
    "TUN": { "two_letter": "TN", "country_name": "Tunisia" },
    "TON": { "two_letter": "TO", "country_name": "Tonga" },
    "TUR": { "two_letter": "TR", "country_name": "Turkey" },
    "TUV": { "two_letter": "TV", "country_name": "Tuvalu" },
    "TZA": { "two_letter": "TZ", "country_name": "Tanzania" },
    "UKR": { "two_letter": "UA", "country_name": "Ukraine" },
    "UGA": { "two_letter": "UG", "country_name": "Uganda" },
    "USA": { "two_letter": "US", "country_name": "United States of America (USA)" },
    "URY": { "two_letter": "UY", "country_name": "Uruguay" },
    "VAT": { "two_letter": "VA", "country_name": "Vatican City (The Holy See)" },
    "VEN": { "two_letter": "VE", "country_name": "Venezuela" },
    "VGB": { "two_letter": "VG", "country_name": "British Virgin Islands" },
    "VIR": { "two_letter": "VI", "country_name": "United States Virgin Islands" },
    "VNM": { "two_letter": "VN", "country_name": "Vietnam" },
    "WLF": { "two_letter": "WF", "country_name": "Wallis and Futuna" },
    "WSM": { "two_letter": "WS", "country_name": "Samoa" },
    "YEM": { "two_letter": "YE", "country_name": "Yemen" },
    "MYT": { "two_letter": "YT", "country_name": "Mayotte" },
    "ZAF": { "two_letter": "ZA", "country_name": "South Africa" },
    "ZMB": { "two_letter": "ZM", "country_name": "Zambia" },
    "ZWE": { "two_letter": "ZW", "country_name": "Zimbabwe" },
    "CHN": { "two_letter": "CN", "country_name": "China" },
    "COG": { "two_letter": "CG", "country_name": "Republic of the Congo" },
    "COD": { "two_letter": "CD", "country_name": "Democratic Republic of the Congo" },
    "MOZ": { "two_letter": "MZ", "country_name": "Mozambique" },
    "GGY": { "two_letter": "GG", "country_name": "Guernsey" },
    "GMB": { "two_letter": "GM", "country_name": "Gambia" },
    "MNP": { "two_letter": "MP", "country_name": "Northern Mariana Islands" },
    "ETH": { "two_letter": "ET", "country_name": "Ethiopia" },
    "NCL": { "two_letter": "NC", "country_name": "New Caledonia" },
    "VUT": { "two_letter": "VU", "country_name": "Vanuatu" },
    "ATF": { "two_letter": "TF", "country_name": "French Southern Territories" },
    "NIU": { "two_letter": "NU", "country_name": "Niue" },
    "UMI": { "two_letter": "UM", "country_name": "United States Minor Outlying Islands" },
    "COK": { "two_letter": "CK", "country_name": "Cook Islands" },
    "GBR": { "two_letter": "GB", "country_name": "Great Britain (United Kingdom; England)" },
    "TTO": { "two_letter": "TT", "country_name": "Trinidad & Tobago" },
    "VCT": { "two_letter": "VC", "country_name": "St. Vincent & the Grenadines" },
    "TWN": { "two_letter": "TW", "country_name": "Taiwan" },
    "NZL": { "two_letter": "NZ", "country_name": "New Zealand" },
    "SAU": { "two_letter": "SA", "country_name": "Saudi Arabia" },
    "LAO": { "two_letter": "LA", "country_name": "Laos" },
    "PRK": { "two_letter": "KP", "country_name": "North Korea" },
    "KOR": { "two_letter": "KR", "country_name": "South Korea" },
    "PRT": { "two_letter": "PT", "country_name": "Portugal" },
    "KGZ": { "two_letter": "KG", "country_name": "Kyrgyzstan" },
    "KAZ": { "two_letter": "KZ", "country_name": "Kazakhstan" },
    "TJK": { "two_letter": "TJ", "country_name": "Tajikistan" },
    "TKM": { "two_letter": "TM", "country_name": "Turkmenistan" },
    "UZB": { "two_letter": "UZ", "country_name": "Uzbekistan" },
    "KNA": { "two_letter": "KN", "country_name": "St. Kitts & Nevis" },
    "SPM": { "two_letter": "PM", "country_name": "Saint-Pierre and Miquelon" },
    "SHN": { "two_letter": "SH", "country_name": "St. Helena & Dependencies" },
    "LCA": { "two_letter": "LC", "country_name": "St. Lucia" },
    "MUS": { "two_letter": "MU", "country_name": "Mauritius" },
    "CIV": { "two_letter": "CI", "country_name": "C?te d'Ivoire" },
    "KEN": { "two_letter": "KE", "country_name": "Kenya" },
    "MNG": { "two_letter": "MN", "country_name": "Mongolia" }
  };

  function logToConsole(...args) {
    console.log('[YouShunFill]', ...args);
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
    const area = document.getElementById('youshun-log-area');
    if (!area) return;
    const now = new Date().toLocaleTimeString();
    area.value += `[${now}] ${text}\n`;
    area.scrollTop = area.scrollHeight;
  }

  function clearLog() {
    const area = document.getElementById('youshun-log-area');
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

  // 三字代码转二字代码
  function convertToTwoLetterCode(code) {
    if (!code) return '';
    code = code.toUpperCase();
    
    // 如果已经是二字代码，直接返回
    if (code.length === 2) return code;
    
    // 如果是三字代码，查找映射
    if (code.length === 3 && COUNTRY_CODES_MAPPING[code]) {
      return COUNTRY_CODES_MAPPING[code].two_letter;
    }
    
    // 如果找不到，返回原代码
    return code;
  }

  // 日期格式转换：DDMMMYY -> DD/MM/YYYY
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
      return `${day}/${month}/${year}`;
    }
    const parts = s.split(/[.\-\/]/).map(p => p.trim());
    if (parts.length === 3) {
      if (parts[0].length === 4) return `${parts[1]}/${parts[0]}/${parts[2]}`;
      if (parts[2].length === 4) return `${parts[0]}/${parts[1]}/${parts[2]}`;
    }
    return s;
  }

  // 签发日期格式转换：支持多种格式
  function normalizeIssueDate(s) {
    if (!s) return '';
    s = s.trim();
    
    // 处理DDMMMYY格式
    const m = s.match(/^(\d{1,2})([A-Za-z]{3})(\d{2,4})$/);
    if (m) {
      const day = m[1].padStart(2, '0');
      const monStr = m[2].toUpperCase();
      const yearRaw = m[3];
      const monMap = { JAN:'01',FEB:'02',MAR:'03',APR:'04',MAY:'05',JUN:'06',JUL:'07',AUG:'08',SEP:'09',OCT:'10',NOV:'11',DEC:'12' };
      const month = monMap[monStr] || '01';
      let year = yearRaw.length === 2 ? (parseInt(yearRaw,10)>50?'19'+yearRaw:'20'+yearRaw) : yearRaw;
      return `${day}/${month}/${year}`;
    }
    
    // 处理DDMYY或DDMMYY格式
    const parts = s.split(/[.\-\/]/).map(p => p.trim());
    if (parts.length === 2) {
      // 处理DDMMYY格式，如160222
      if (parts[0].length === 6 && parts[1].length === 0) {
        const dateStr = parts[0];
        const day = dateStr.substring(0, 2);
        const month = dateStr.substring(2, 4);
        const year = dateStr.substring(4, 6);
        const fullYear = parseInt(year, 10) > 50 ? '19' + year : '20' + year;
        return `${day}/${month}/${fullYear}`;
      }
    }
    
    if (parts.length === 3) {
      if (parts[0].length === 4) return `${parts[1]}/${parts[0]}/${parts[2]}`;
      if (parts[2].length === 4) return `${parts[0]}/${parts[1]}/${parts[2]}`;
    }
    
    return s;
  }

  // 解析SSR护照信息
  function parseSSRLine(line) {
    const out = { raw: line, issuingCountry:'', passportNumber:'', nationality:'', birthdate:'', gender:'', expirationDate:'', issueDate:'', surname:'', givenName:'', passengerIndex:null, ok:false, error:null };
    try {
      const idx = line.indexOf('P/'); if (idx === -1) throw new Error('找不到 P/');
      let after = line.substring(idx+2).trim();
      const parts = after.split('/');
      if (parts.length < 6) throw new Error('字段不足');
      out.issuingCountry = convertToTwoLetterCode((parts[0]||'').trim());
      out.passportNumber = (parts[1]||'').trim();
      out.nationality = convertToTwoLetterCode((parts[2]||'').trim());
      out.birthdate = normalizeDateFlexible(parts[3]||'');
      out.gender = (parts[4]||'').toUpperCase().substr(0,1);
      
      // 处理有效期和签发日期
      const expiryOrIssue = normalizeDateFlexible(parts[5]||'');
      
      // 检查是否有额外的签发日期字段
      if (parts.length >= 7) {
        // 第6个字段可能是签发日期
        out.issueDate = normalizeIssueDate(parts[6]||'');
        out.expirationDate = expiryOrIssue;
      } else {
        // 没有签发日期，使用有效期作为签发日期，并计算过期时间
        out.issueDate = expiryOrIssue;
        // 计算过期时间：签发日期+5年
        const issueParts = expiryOrIssue.split('/');
        if (issueParts.length === 3) {
          const issueYear = parseInt(issueParts[2], 10);
          const expiryYear = issueYear + 5;
          out.expirationDate = `${issueParts[0]}/${issueParts[1]}/${expiryYear}`;
        } else {
          out.expirationDate = expiryOrIssue;
        }
      }
      
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

  // 从文本中解析护照信息
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

  // 检测乘客卡片
  function detectPassengerCards() {
    // 通过XPath查找乘客卡片表单
    const xpath = '/html/body/div/div/div/div/div/div[2]/div[1]/div[2]/div/div[1]/div[2]/form';
    const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
    const formElement = result.singleNodeValue;
    
    if (formElement) {
      // 查找表单下的直接子div元素，这些应该是乘客卡片
      const cards = Array.from(formElement.children).filter(child => child.tagName === 'DIV');
      
      // 进一步验证这些div是否包含乘客信息
      const passengerCards = cards.filter(card => {
        // 查找包含"Passenger (Adult)"文本的span元素
        const passengerSpan = card.querySelector('span.MuiDivider-wrapper');
        if (passengerSpan && passengerSpan.textContent.includes('Passenger (Adult)')) {
          return true;
        }
        
        // 备用验证：查找表单输入元素
        const inputs = card.querySelectorAll('input[name*="passengers"]');
        return inputs.length > 0;
      });
      
      logToConsole(`检测到表单，包含 ${passengerCards.length} 个乘客卡片`);
      return passengerCards;
    }
    
    // 备用检测方式：查找包含"Passenger (Adult)"文本的元素
    const passengerSpans = document.querySelectorAll('span.MuiDivider-wrapper');
    if (passengerSpans.length > 0) {
      logToConsole(`通过备用方式检测到 ${passengerSpans.length} 个乘客标识`);
      // 找到这些span元素的父div作为乘客卡片
      const cards = Array.from(passengerSpans).map(span => {
        // 向上查找包含表单输入的父div
        let parent = span.closest('div');
        while (parent && parent.tagName === 'DIV') {
          if (parent.querySelectorAll('input[name*="passengers"]').length > 0) {
            return parent;
          }
          parent = parent.parentElement;
        }
        return null;
      }).filter(card => card !== null);
      
      return cards;
    }
    
    // 第三种检测方式：直接通过XPath查找具体的乘客卡片
    try {
      const card1Xpath = '/html/body/div/div/div/div/div/div[2]/div[1]/div[2]/div/div[1]/div[2]/form/div[1]';
      const card2Xpath = '/html/body/div/div/div/div/div/div[2]/div[1]/div[2]/div/div[1]/div[2]/form/div[2]';
      
      const card1Result = document.evaluate(card1Xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
      const card2Result = document.evaluate(card2Xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
      
      const cards = [];
      if (card1Result.singleNodeValue) {
        // 验证是否包含乘客信息
        const passengerSpan = card1Result.singleNodeValue.querySelector('span.MuiDivider-wrapper');
        if (passengerSpan && passengerSpan.textContent.includes('Passenger (Adult)')) {
          cards.push(card1Result.singleNodeValue);
        }
      }
      
      if (card2Result.singleNodeValue) {
        // 验证是否包含乘客信息
        const passengerSpan = card2Result.singleNodeValue.querySelector('span.MuiDivider-wrapper');
        if (passengerSpan && passengerSpan.textContent.includes('Passenger (Adult)')) {
          cards.push(card2Result.singleNodeValue);
        }
      }
      
      if (cards.length > 0) {
        logToConsole(`通过XPath直接检测到 ${cards.length} 个乘客卡片`);
        return cards;
      }
    } catch (e) {
      logToConsole('XPath检测乘客卡片时出错:', e);
    }
    
    logToConsole('未检测到乘客卡片');
    return [];
  }

  // 等待乘客卡片出现
  function waitForPassengerCard() {
    return new Promise((resolve) => {
      // 1. 页面已存在乘客卡片，直接返回
      const cards = detectPassengerCards();
      if (cards.length > 0) {
        resolve();
        return;
      }

      // 2. 否则监听 DOM
      const observer = new MutationObserver(() => {
        const cards = detectPassengerCards();
        if (cards.length > 0) {
          observer.disconnect();
          resolve();
        }
      });

      observer.observe(document.body, { childList: true, subtree: true });
    });
  }

  // 自动填充 MUI 日期选择器
  // 参数: labelText - 标签文本（如 "出生日期" 或 "Date of birth"）
  // 参数: day - 日期（1-31）
  // 参数: month - 月份（1-12）
  // 参数: year - 年份（如 2000）
  // 参数: index - 如果有多个相同标签，指定索引（从0开始，可选）
  async function autoFillDatePicker(labelText, day, month, year, index) {
    try {
      console.log('[日期填充] 开始填充日期:', year + '/' + month + '/' + day);
      console.log('[日期填充] 查找标签文本:', labelText);
      
      // 1. 通过标签文本找到对应的输入框容器
      const labels = Array.from(document.querySelectorAll('label'));
      console.log('[日期填充] 页面上所有标签:');
      labels.forEach(function(l, idx) {
        console.log('  [' + idx + ']', '"' + l.textContent.trim() + '"', 'length:', l.textContent.trim().length);
      });
      
      // 标准化文本：去除所有空白字符并转为小写进行比较
      function normalizeText(text) {
        return text.replace(/\s+/g, '').toLowerCase();
      }
      
      const normalizedSearch = normalizeText(labelText);
      console.log('[日期填充] 标准化搜索文本:', normalizedSearch);
      
      const matchingLabels = labels.filter(function(label) {
        const labelText = label.textContent.trim();
        const normalized = normalizeText(labelText);
        console.log('[日期填充] 比较:', normalized, '与', normalizedSearch);
        return normalized.includes(normalizedSearch) || normalized === normalizedSearch;
      });
      
      if (matchingLabels.length === 0) {
        console.error('[日期填充] 未找到匹配的标签');
        throw new Error('未找到包含文本 "' + labelText + '" 的标签');
      }
      
      console.log('[日期填充] 找到', matchingLabels.length, '个匹配的标签');
      
      // 使用指定索引或第一个匹配的标签
      const targetLabel = matchingLabels[index || 0];
      console.log('[日期填充] 找到标签:', targetLabel.textContent.trim());
      
      // 2. 获取输入框的 ID
      const inputId = targetLabel.getAttribute('for');
      if (!inputId) {
        // 如果标签没有 for 属性，尝试查找附近的日期输入框
        const nearbyInput = targetLabel.closest('.MuiFormControl-root')?.querySelector('.MuiPickersInputBase-root');
        if (nearbyInput) {
          console.log('[日期填充] 通过父容器找到输入框');
          await fillDatePicker(nearbyInput, day, month, year);
          return true;
        }
        throw new Error('未找到输入框 ID');
      }
      
      const inputContainer = document.getElementById(inputId);
      if (!inputContainer) {
        throw new Error('未找到输入框元素: ' + inputId);
      }
      
      const pickerContainer = inputContainer.closest('.MuiPickersInputBase-root');
      if (!pickerContainer) {
        throw new Error('未找到日期输入框容器');
      }
      
      console.log('[日期填充] 找到日期选择器容器');
      await fillDatePicker(pickerContainer, day, month, year);
      
      return true;
      
    } catch (error) {
      console.error('[日期填充] 自动填充日期失败:', error);
      return false;
    }
  }

  // 执行日期选择器填充
  async function fillDatePicker(pickerContainer, day, month, year) {
    // 3. 找到并点击日历图标按钮
    const calendarButton = pickerContainer.querySelector('button[aria-label*="date"], button[aria-label*="日期"], button[aria-label*="Choose"]');
    if (!calendarButton) {
      throw new Error('未找到日历按钮');
    }
  
    calendarButton.click();
    console.log('[日期填充] 已点击日历按钮');
  
    // 4. 等待日期选择器弹出
    await waitForElement('.MuiDateCalendar-root', 2000);
    console.log('[日期填充] 日期选择器已打开');
  
    // 5. 选择年份
    await selectYear(year);
    console.log('[日期填充] 已选择年份:', year);
  
    // 6. 选择月份
    await selectMonth(month);
    console.log('[日期填充] 已选择月份:', month);
  
    // 7. 选择具体日期
    await selectDay(day);
    console.log('[日期填充] 成功填充日期:', year + '/' + month + '/' + day);
  }

  // 等待元素出现
  function waitForElement(selector, timeout) {
    timeout = timeout || 3000;
    return new Promise(function(resolve, reject) {
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
        return;
      }
      
      const observer = new MutationObserver(function(mutations, obs) {
        const element = document.querySelector(selector);
        if (element) {
          obs.disconnect();
          resolve(element);
        }
      });
      
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
      
      setTimeout(function() {
        observer.disconnect();
        reject(new Error('元素 ' + selector + ' 未在 ' + timeout + 'ms 内出现'));
      }, timeout);
    });
  }

  // 选择年份
  async function selectYear(targetYear) {
    // 检查是否在年份选择视图
    let yearCalendar = document.querySelector('.MuiYearCalendar-root');
  
    if (!yearCalendar) {
      // 如果不在年份视图，点击切换按钮
      const switchButton = document.querySelector('.MuiPickersCalendarHeader-switchViewButton');
      if (switchButton) {
        switchButton.click();
        await new Promise(function(resolve) { setTimeout(resolve, 300); });
        yearCalendar = document.querySelector('.MuiYearCalendar-root');
      }
    }
  
    if (!yearCalendar) {
      throw new Error('无法打开年份选择视图');
    }
  
    // 查找目标年份按钮
    const yearButtons = Array.from(document.querySelectorAll('.MuiYearCalendar-button'));
    const targetYearButton = yearButtons.find(function(btn) {
      return btn.textContent.trim() === targetYear.toString();
    });
  
    if (!targetYearButton) {
      throw new Error('未找到年份: ' + targetYear);
    }
  
    targetYearButton.click();
    await new Promise(function(resolve) { setTimeout(resolve, 400); });
  }

  // 选择月份
  async function selectMonth(targetMonth) {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'];
    const targetMonthName = months[targetMonth - 1];
  
    // 等待日历视图出现
    await waitForElement('.MuiDayCalendar-root', 2000);
  
    let attempts = 0;
    const maxAttempts = 24;
  
    while (attempts < maxAttempts) {
      // 获取当前显示的月份
      const monthLabel = document.querySelector('.MuiPickersCalendarHeader-label');
      if (!monthLabel) {
        throw new Error('未找到月份标签');
      }
      
      const currentMonthText = monthLabel.textContent.trim();
      console.log('[日期填充] 当前月份:', currentMonthText, '目标月份:', targetMonthName);
      
      // 检查是否已经是目标月份
      if (currentMonthText.includes(targetMonthName)) {
        console.log('[日期填充] 已到达目标月份');
        break;
      }
      
      // 解析当前月份
      let currentMonth = -1;
      for (let i = 0; i < months.length; i++) {
        if (currentMonthText.includes(months[i])) {
          currentMonth = i + 1;
          break;
        }
      }
      
      if (currentMonth === -1) {
        throw new Error('无法识别当前月份: ' + currentMonthText);
      }
      
      // 决定点击上一个月还是下一个月
      const prevButton = document.querySelector('.MuiPickersArrowSwitcher-previousIconButton');
      const nextButton = document.querySelector('.MuiPickersArrowSwitcher-nextIconButton');
      
      if (!prevButton || !nextButton) {
        throw new Error('未找到月份导航按钮');
      }
      
      // 计算需要向前还是向后
      if (currentMonth > targetMonth) {
        if (!prevButton.disabled) {
          prevButton.click();
          await new Promise(function(resolve) { setTimeout(resolve, 300); });
        } else {
          throw new Error('无法继续向前导航');
        }
      } else {
        if (!nextButton.disabled) {
          nextButton.click();
          await new Promise(function(resolve) { setTimeout(resolve, 300); });
        } else {
          throw new Error('无法继续向后导航');
        }
      }
      
      attempts++;
    }
  
    if (attempts >= maxAttempts) {
      throw new Error('超过最大尝试次数，未能到达目标月份');
    }
  }

  // 选择具体日期
  async function selectDay(day) {
    await new Promise(function(resolve) { setTimeout(resolve, 300); });
  
    // 获取所有可点击的日期按钮
    const dayButtons = Array.from(document.querySelectorAll('.MuiPickersDay-root:not(.Mui-disabled):not(.MuiPickersDay-hiddenDaySpacingFiller)'));
    console.log('[日期填充] 可选日期数量:', dayButtons.length);
  
    // 查找目标日期
    const targetDayButton = dayButtons.find(function(btn) {
      const text = btn.textContent.trim();
      const btnDay = parseInt(text);
      return btnDay === day;
    });
  
    if (targetDayButton) {
      console.log('[日期填充] 找到目标日期按钮:', day);
      targetDayButton.click();
      await new Promise(function(resolve) { setTimeout(resolve, 300); });
    } else {
      throw new Error('未找到日期: ' + day);
    }
  }

  // 辅助函数：打印页面上所有可能的日期选择器标签
  function findDateLabels() {
    const labels = Array.from(document.querySelectorAll('label'));
    console.log('=== 页面上所有标签 ===');
    labels.forEach(function(label, index) {
      console.log(index + ':', label.textContent.trim());
    });
    console.log('======================');
  }

  // 示例 1: 查找页面上所有标签（调试用）
  // findDateLabels();

  // 示例 2: 填充中文标签的日期（如 "出生日期"）
  // autoFillDatePicker("出生日期", 15, 6, 1995);

  // 示例 3: 填充英文标签的日期
  // autoFillDatePicker("Date of birth", 15, 6, 1995);

  // 示例 4: 如果有多个相同标签，指定第二个（索引为1）
  // autoFillDatePicker("出生日期", 25, 12, 2000, 1);

  // 示例 5: 使用部分匹配（标签包含"出生"即可）
  // autoFillDatePicker("出生", 10, 5, 1975);

  // 尝试填充
  // autoFillDatePicker("Date of birth", 15, 6, 1995);

  // 选择下拉菜单选项
  async function selectFromDropdown(inputEl, targetText) {
    if (!inputEl || !targetText) return false;
    
    // 点击输入框展开下拉菜单
    simulateClick(inputEl);
    await sleep(300);
    
    // 查找下拉菜单
    let dropdown = document.querySelector('.MuiMenu-list');
    if (!dropdown) {
      // 尝试其他可能的选择器
      dropdown = document.querySelector('[role="listbox"]');
    }
    
    if (!dropdown) return false;
    
    // 查找匹配的选项
    const items = Array.from(dropdown.querySelectorAll('li[role="option"]'));
    let chosen = items.find(it => (it.getAttribute('data-value') || '').toLowerCase() === targetText.toLowerCase()) ||
                 items.find(it => (it.textContent || '').trim().toLowerCase() === targetText.toLowerCase()) ||
                 items[0];
    
    if (chosen) {
      dispatchMouseSequence(chosen);
      await sleep(200);
      return true;
    }
    
    return false;
  }

  // 填写乘客卡片
  async function fillPassengerCard(cardEl, data, index) {
    logToConsole(`开始填写第 ${index+1} 位乘客信息`);
    
    // 1. 称呼选择
    try {
      // 查找称呼选择器，根据用户提供的HTML结构
      const titleSelect = cardEl.querySelector('div.MuiSelect-root[aria-labelledby*="passenger Title"]') ||
                         cardEl.querySelector('div[id*="mui-component-select-passengers"][id*="title"]');
      if (titleSelect && data.gender) {
        // 点击选择器展开下拉菜单
        simulateClick(titleSelect);
        await sleep(300);
        
        // 查找下拉菜单
        let dropdown = document.querySelector('.MuiMenu-list');
        if (!dropdown) {
          // 尝试其他可能的选择器
          dropdown = document.querySelector('[role="listbox"]');
        }
        
        if (dropdown) {
          const targetTitle = data.gender === 'M' ? 'Mr' : (data.gender === 'F' ? 'Ms' : 'Mrs');
          // 查找匹配的选项
          const items = Array.from(dropdown.querySelectorAll('li[role="option"]'));
          const chosen = items.find(it => (it.getAttribute('data-value') || '').toLowerCase() === targetTitle.toLowerCase()) ||
                       items.find(it => (it.textContent || '').trim().toLowerCase() === targetTitle.toLowerCase());
          
          if (chosen) {
            dispatchMouseSequence(chosen);
            logToConsole('已设置称呼:', targetTitle);
          } else {
            logToConsole('未找到匹配的称呼选项:', targetTitle);
          }
        } else {
          logToConsole('未找到称呼下拉菜单');
        }
        await sleep(200);
      } else {
        logToConsole('未找到称呼选择器');
      }
    } catch (e) {
      logToConsole('设置称呼时异常', e);
    }
    
    // 2. SURNAME
    try {
      const surnameInput = cardEl.querySelector('input[name*="firstName"]') ||
                           cardEl.querySelector('input[aria-label*="Surname"]');
      if (surnameInput && data.surname) {
        setInputValue(surnameInput, data.surname);
        logToConsole('已设置姓:', data.surname);
        await sleep(150);
      }
    } catch (e) {
      logToConsole('设置姓时异常', e);
    }
    
    // 3. GIVEN NAME
    try {
      const givenNameInput = cardEl.querySelector('input[name*="lastName"]') ||
                             cardEl.querySelector('input[aria-label*="Given Name"]');
      if (givenNameInput && data.givenName) {
        setInputValue(givenNameInput, data.givenName);
        logToConsole('已设置名:', data.givenName);
        await sleep(150);
      }
    } catch (e) {
      logToConsole('设置名时异常', e);
    }
    
    // 4. 护照号
    try {
      const passportInput = cardEl.querySelector('input[name*="idNumber"]') ||
                             cardEl.querySelector('input[aria-label*="ID number"]');
      if (passportInput && data.passportNumber) {
        setInputValue(passportInput, data.passportNumber);
        logToConsole('已设置护照号:', data.passportNumber);
        await sleep(150);
      }
    } catch (e) {
      logToConsole('设置护照号时异常', e);
    }
    
    // 5. 国籍
    try {
      const nationalityInput = cardEl.querySelector('input[name*="idCountry"]') ||
                               cardEl.querySelector('input[aria-label*="Nationality"]');
      if (nationalityInput && data.nationality) {
        setInputValue(nationalityInput, data.nationality);
        logToConsole('已设置国籍:', data.nationality);
        await sleep(150);
      }
    } catch (e) {
      logToConsole('设置国籍时异常', e);
    }
    
    // 6. 签发国
    try {
      const issueCountryInput = cardEl.querySelector('input[name*="trCountry"]') ||
                                cardEl.querySelector('input[aria-label*="Issue country"]');
      if (issueCountryInput && data.issuingCountry) {
        setInputValue(issueCountryInput, data.issuingCountry);
        logToConsole('已设置签发国:', data.issuingCountry);
        await sleep(150);
      }
    } catch (e) {
      logToConsole('设置签发国时异常', e);
    }
    
    // 7. 出生日期
    try {
      if (data.birthdate) {
        // 解析日期
        const dateParts = data.birthdate.split('/');
        if (dateParts.length === 3) {
          const day = parseInt(dateParts[0], 10);
          const month = parseInt(dateParts[1], 10);
          const year = parseInt(dateParts[2], 10);
          
          // 使用autoFillDatePicker函数填充日期
          const success = await autoFillDatePicker('Date of birth', day, month, year, index);
          if (success) {
            logToConsole('已设置出生日期:', data.birthdate);
          } else {
            logToConsole('设置出生日期失败');
          }
        } else {
          logToConsole('出生日期格式不正确:', data.birthdate);
        }
      } else {
        logToConsole('未提供出生日期');
      }
      await sleep(150);
    } catch (e) {
      logToConsole('设置出生日期时异常', e);
    }
    
    // 8. 签发日期
    try {
      if (data.issueDate) {
        // 解析日期
        const dateParts = data.issueDate.split('/');
        if (dateParts.length === 3) {
          const day = parseInt(dateParts[0], 10);
          const month = parseInt(dateParts[1], 10);
          const year = parseInt(dateParts[2], 10);
          
          // 使用autoFillDatePicker函数填充日期
          const success = await autoFillDatePicker('Date of issued', day, month, year, index);
          if (success) {
            logToConsole('已设置签发日期:', data.issueDate);
          } else {
            logToConsole('设置签发日期失败');
          }
        } else {
          logToConsole('签发日期格式不正确:', data.issueDate);
        }
      } else {
        logToConsole('未提供签发日期');
      }
      await sleep(150);
    } catch (e) {
      logToConsole('设置签发日期时异常', e);
    }
    
    // 9. 证件过期时间
    try {
      if (data.expirationDate) {
        // 解析日期
        const dateParts = data.expirationDate.split('/');
        if (dateParts.length === 3) {
          const day = parseInt(dateParts[0], 10);
          const month = parseInt(dateParts[1], 10);
          const year = parseInt(dateParts[2], 10);
          
          // 使用autoFillDatePicker函数填充日期
          const success = await autoFillDatePicker('Date of expiry', day, month, year, index);
          if (success) {
            logToConsole('已设置证件过期时间:', data.expirationDate);
          } else {
            logToConsole('设置证件过期时间失败');
          }
        } else {
          logToConsole('证件过期时间格式不正确:', data.expirationDate);
        }
      } else {
        logToConsole('未提供证件过期时间');
      }
      await sleep(150);
    } catch (e) {
      logToConsole('设置证件过期时间时异常', e);
    }
    
    // 10. 手机号
    try {
      const phoneInput = cardEl.querySelector('input[name*="phoneNumber"]') ||
                        cardEl.querySelector('input[aria-label*="Phone number"]');
      if (phoneInput) {
        setInputValue(phoneInput, DEFAULT_PHONE);
        logToConsole('已设置手机号:', DEFAULT_PHONE);
        await sleep(150);
      }
    } catch (e) {
      logToConsole('设置手机号时异常', e);
    }
    
    // 11. 邮箱
    try {
      const emailInput = cardEl.querySelector('input[name*="emailAddress"]') ||
                         cardEl.querySelector('input[aria-label*="Email address"]');
      if (emailInput) {
        setInputValue(emailInput, DEFAULT_EMAIL);
        logToConsole('已设置邮箱:', DEFAULT_EMAIL);
        await sleep(150);
      }
    } catch (e) {
      logToConsole('设置邮箱时异常', e);
    }
    
    // 12. 性别
    try {
      const genderSelect = cardEl.querySelector('select[name*="passengerSexType"]') ||
                           cardEl.querySelector('input[name*="passengerSexType"]');
      if (genderSelect && data.gender) {
        const genderValue = data.gender.toUpperCase() === 'M' ? 'm' : 'f';
        if (genderSelect.tagName === 'SELECT') {
          genderSelect.value = genderValue;
          genderSelect.dispatchEvent(new Event('change', { bubbles: true }));
        } else {
          // 对于自定义下拉菜单
          simulateClick(genderSelect);
          await sleep(300);
          
          const dropdown = document.querySelector('.MuiMenu-list');
          if (dropdown) {
            const items = Array.from(dropdown.querySelectorAll('li[role="option"]'));
            const maleOption = items.find(it => (it.getAttribute('data-value') || '').toLowerCase() === genderValue) ||
                              items.find(it => (it.textContent || '').trim().toLowerCase().includes(genderValue === 'm' ? 'male' : 'female'));
            
            if (maleOption) {
              dispatchMouseSequence(maleOption);
              logToConsole('已设置性别:', genderValue === 'm' ? 'Male' : 'Female');
            }
          }
        }
        await sleep(200);
      }
    } catch (e) {
      logToConsole('设置性别时异常', e);
    }
    
    logToConsole(`第 ${index+1} 位乘客信息填写完成`);
  }

  // 填写所有乘客信息
  async function fillAllPassengers() {
    logToConsole('开始执行fillAllPassengers函数');

    const cards = detectPassengerCards();
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
  }

  // 注入UI面板
  function injectPanel() {
    if (document.getElementById('youshun-panel')) return;
    const panel = document.createElement('div');
    panel.id = 'youshun-panel';
    panel.style.cssText = `
      position:fixed;right:12px;top:80px;width:460px;z-index:999999;
      background:white;border:1px solid #ccc;box-shadow:0 6px 18px rgba(0,0,0,.12);
      border-radius:8px;font-family:Arial,sans-serif;font-size:13px;
    `;
    panel.innerHTML = `
      <div id="youshun-header" style="cursor:move;padding:6px 10px;background:#2d8cff;color:#fff;border-radius:8px 8px 0 0;display:flex;justify-content:space-between;align-items:center;position:relative;">
        <span>优顺护照自动填写   悦美华</span>
        <button id="youshun-min" style="background:transparent;border:none;color:#fff;font-size:14px;cursor:pointer;
        position:absolute;right:10px;top:50%;transform:translateY(-50%);padding:2px 6px;width:auto;min-width:20px;">—</button>
      </div>
      <div id="youshun-body" style="padding:8px;">
        <textarea id="youshun-input" style="width:100%;height:120px;font-size:12px;
                  border:1px solid #ddd;border-radius:4px;padding:6px;box-sizing:border-box;"
                  placeholder="请输入SSR护照信息..."></textarea>
        <div style="margin:8px 0;display:flex;justify-content:space-between;gap:6px;">
          <button id="youshun-parse" style="flex:1;padding:6px;border:1px solid #ddd;border-radius:4px;
                  background:#f5f5f5;cursor:pointer;">解析</button>
          <button id="youshun-detect" style="flex:1;padding:6px;border:1px solid #ddd;border-radius:4px;
                  background:#f5f5f5;cursor:pointer;">检测卡数量</button>
          <button id="youshun-fill-all" style="flex:1;padding:6px;border:1px solid #2d8cff;border-radius:4px;
                  background:#2d8cff;color:white;cursor:pointer;">填写全部</button>
        </div>
        <div style="margin:8px 0;display:flex;justify-content:center;gap:6px;">
          <button id="youshun-fill-first" style="flex:1;max-width:200px;padding:6px;border:1px solid #ddd;
                  border-radius:4px;background:#f5f5f5;cursor:pointer;">填写第1位</button>
          <button id="youshun-clear-log" style="flex:1;max-width:200px;padding:6px;border:1px solid #ddd;
                  border-radius:4px;background:#f5f5f5;cursor:pointer;">清日志</button>
        </div>
        <textarea id="youshun-log-area" style="width:100%;height:140px;font-size:12px;
                  border:1px solid #ddd;border-radius:4px;padding:6px;box-sizing:border-box;"
                  readonly placeholder="日志信息..."></textarea>
      </div>
    `;
    document.body.appendChild(panel);

    // 最小化
    document.getElementById('youshun-min').addEventListener('click',()=>{
      const body=document.getElementById('youshun-body');
      body.style.display=body.style.display==='none'?'block':'none';
    });

    // 拖动
    const header=document.getElementById('youshun-header');
    let isDrag=false,offsetX=0,offsetY=0;
    header.addEventListener('mousedown',e=>{
      isDrag=true; offsetX=e.clientX-panel.offsetLeft; offsetY=e.clientY-panel.offsetTop;
      document.addEventListener('mousemove',move); document.addEventListener('mouseup',stop);
    });
    function move(e){ if(!isDrag)return; panel.style.left=(e.clientX-offsetX)+'px'; panel.style.top=(e.clientY-offsetY)+'px'; panel.style.right='auto'; }
    function stop(){ isDrag=false; document.removeEventListener('mousemove',move); document.removeEventListener('mouseup',stop); }

    // 按钮
    document.getElementById('youshun-parse').addEventListener('click',()=>{
      clearLog();
      const txt=document.getElementById('youshun-input').value;
      const parsed=parsePassportsFromText(txt);
      logToConsole('解析到',parsed.length,'项');
      parsed.forEach((p,i)=>{
        logToConsole(
          `第${i+1}位 -> 姓:${p.surname}, 名:${p.givenName}, 性别:${p.gender}, 出生日期:${p.birthdate}, ` +
          `国籍:${p.nationality}, 签发国:${p.issuingCountry}, 护照号:${p.passportNumber}, 有效期:${p.expirationDate}`
        );
      });
    });
    
    document.getElementById('youshun-detect').addEventListener('click',()=>{
      const cards=detectPassengerCards();
      logToConsole('检测到乘客卡片数量：',cards.length);
    });
    
    document.getElementById('youshun-fill-all').addEventListener('click',fillAllPassengers);
    
    document.getElementById('youshun-fill-first').addEventListener('click',async()=>{
      const txt=document.getElementById('youshun-input').value;
      const arr=parsePassportsFromText(txt);
      const cards=detectPassengerCards();
      if (cards.length&&arr.length) await fillPassengerCard(cards[0],arr[0],0);
    });
    
    document.getElementById('youshun-clear-log').addEventListener('click',clearLog);

    // 自动解析（输入或失焦时）
    const inputArea=document.getElementById('youshun-input');
    ['input','blur'].forEach(ev=>{
      inputArea.addEventListener(ev,()=>{
        const parsed=parsePassportsFromText(inputArea.value);
        logToConsole(`自动解析: ${parsed.length} 条`);
      });
    });
  }

  // 主函数
  (async function () {
    'use strict';

    // 等待检测到乘机人卡片
    logToConsole('脚本已加载，等待乘客卡片...');
    await waitForPassengerCard();
    logToConsole('检测到乘客卡片，注入控制台面板');
    injectPanel();

  })();

})();