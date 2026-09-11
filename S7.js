// ==UserScript==
// @name         S7官网自动填充护照信息
// @namespace    https://example.com/
// @version      1.1
// @description  在 S7 乘客页自动填写护照和联系信息（SSR DOCS 粘贴解析）
// @author       悦美华
// @match        https://www.s7.ru/*
// @match        https://ibe.s7.ru/*
// @grant        none
// @run-at       document-idle
// @updateURL    https://raw.githubusercontent.com/yuemeihua/yuemeihua-scripts/main/S7.js
// @downloadURL  https://raw.githubusercontent.com/yuemeihua/yuemeihua-scripts/main/S7.js
// ==/UserScript==

(function () {
  'use strict';

  /**************** 基本配置 ****************/
  const passportsDataVarName = 's7PassportsData';
  window[passportsDataVarName] = [];

  // 固定邮箱 & 手机号（按你的要求）
  const DEFAULT_EMAIL = 'yuemeihuafly@163.com';
  const DEFAULT_PHONE = '18610429740';

  // 默认输入框内容（留空，方便直接粘贴）
  const defaultInput = ``;

  // 三字代码 -> 二字代码 & 英文国名 （直接内嵌 country_codes_mapping.json）
  const COUNTRY_CODES_MAP = {
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
    "CIV": { "two_letter": "CI", "country_name": "C?te d’Ivoire" },
    "KEN": { "two_letter": "KE", "country_name": "Kenya" },
    "MNG": { "two_letter": "MN", "country_name": "Mongolia" }
  };

  /**************** 工具函数 ****************/

  function logToConsole(...args) {
    console.log('[S7Fill]', ...args);
    appendLog(args.join(' '));
  }

  function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  // 追加日志到面板
  function appendLog(text) {
    const area = document.getElementById('s7fill-log-area');
    if (!area) return;
    const now = new Date().toLocaleTimeString();
    area.value += `[${now}] ${text}\n`;
    area.scrollTop = area.scrollHeight;
  }

  function clearLog() {
    const area = document.getElementById('s7fill-log-area');
    if (area) area.value = '';
  }

  // 模拟点击（比直接 .click() 更稳）
  function simulateClick(el) {
    if (!el) return;
    el.focus && el.focus();
    el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    el.click && el.click();
  }

  function nativeSetValue(input, val) {
    if (!input) return;
    const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
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
    } catch (e) {
      console.error(e);
    }
  }

  // 日期格式规范：支持 20MAY25、20.05.2002、2002-05-20 等，统一输出 dd.MM.yyyy
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
      let year = yearRaw.length === 2
        ? (parseInt(yearRaw, 10) > 50 ? '19' + yearRaw : '20' + yearRaw)
        : yearRaw;
      return `${day}.${month}.${year}`;
    }
    const parts = s.split(/[.\-\/]/).map(p => p.trim());
    if (parts.length === 3) {
      if (parts[0].length === 4) return `${parts[2]}.${parts[1]}.${parts[0]}`; // yyyy.mm.dd
      if (parts[2].length === 4) return `${parts[0]}.${parts[1]}.${parts[2]}`; // dd.mm.yyyy
    }
    return s;
  }

  /**************** SSR 解析 ****************/

  // 解析一行 SSR DOCS
  function parseSSRLine(line) {
    const out = {
      raw: line,
      issuingCountry: '',
      passportNumber: '',
      nationality: '',
      nationality2: '',
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

      // 三字国籍码 -> 二字码
      const mapEntry = COUNTRY_CODES_MAP[out.nationality];
      if (mapEntry) {
        out.nationality2 = mapEntry.two_letter;
      } else if (out.nationality.length === 2) {
        out.nationality2 = out.nationality;
      }

      out.ok = true;
    } catch (e) {
      out.error = e.message;
    }
    return out;
  }

  // 从多行文本中解析所有 SSR DOCS
  function parsePassportsFromText(text) {
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const results = [];
    for (const line of lines) {
      if (/^SSR\s+DOCS/i.test(line)) {
        const parsed = parseSSRLine(line);
        if (parsed.ok) {
          results.push(parsed);
        }
      }
    }
    window[passportsDataVarName] = results;
    return results;
  }

  /**************** S7 具体填充逻辑 ****************/

  // 填写单个 pax_x 区块
  async function fillPaxBlock(paxEl, data, index) {
    if (!paxEl || !data) return;
    logToConsole(`开始填写第 ${index + 1} 位乘客`);

    // 推断 pax index（id="pax_0"）
    let paxIndex = 0;
    const id = paxEl.id || '';
    const m = id.match(/pax_(\d+)/);
    if (m) paxIndex = parseInt(m[1], 10);

    // 性别
    try {
      if (data.gender) {
        const isMale = data.gender === 'M';
        const val = isMale ? 'MALE' : 'FEMALE';
        const genderInput = paxEl.querySelector(`input.js_pax_gender[value="${val}"]`)
          || paxEl.querySelector(`#genderm_${paxIndex}`)
          || paxEl.querySelector(`#genderf_${paxIndex}`);
        if (genderInput) {
          const label = paxEl.querySelector(`label[for="${genderInput.id}"]`) || genderInput;
          simulateClick(label);
          logToConsole('已设置性别为', isMale ? '男' : '女');
        } else {
          logToConsole('未找到性别控件');
        }
      }
    } catch (e) {
      logToConsole('设置性别异常', e);
    }

    // 姓 lastName
    try {
      const lastNameInput =
        paxEl.querySelector('input.js_last_name') ||
        paxEl.querySelector(`input[data-name-substitution="passengersRequest.passengers[${paxIndex}].name.lastName"]`);
      if (lastNameInput && data.surname) {
        setInputValue(lastNameInput, data.surname);
        logToConsole('已设置姓:', data.surname);
      } else {
        logToConsole('未找到姓输入框');
      }
    } catch (e) {
      logToConsole('设置姓异常', e);
    }

    // 名 firstName
    try {
      const firstNameInput =
        paxEl.querySelector('input.js_first_name') ||
        paxEl.querySelector(`input[data-name-substitution="passengersRequest.passengers[${paxIndex}].name.firstName"]`) ||
        paxEl.querySelector(`#givenName${paxIndex}`);
      if (firstNameInput && data.givenName) {
        setInputValue(firstNameInput, data.givenName);
        logToConsole('已设置名:', data.givenName);
      } else {
        logToConsole('未找到名输入框');
      }
    } catch (e) {
      logToConsole('设置名异常', e);
    }

    // 证件类型 Document -> OTHER
    try {
      const docSelect = paxEl.querySelector(`#doc_passportType${paxIndex}`) ||
        paxEl.querySelector('select.js_pax_doc_type');
      if (docSelect) {
        docSelect.value = 'OTHER';
        docSelect.dispatchEvent(new Event('change', { bubbles: true }));
        logToConsole('已设置证件类型为 OTHER');
      } else {
        logToConsole('未找到证件类型下拉');
      }
    } catch (e) {
      logToConsole('设置证件类型异常', e);
    }

    // 护照号
    try {
      const docNumInput = paxEl.querySelector(`#documentNumber${paxIndex}`) ||
        paxEl.querySelector('input.js_pax_doc_number');
      if (docNumInput && data.passportNumber) {
        setInputValue(docNumInput, data.passportNumber);
        logToConsole('已设置护照号:', data.passportNumber);
      } else {
        logToConsole('未找到护照号输入框');
      }
    } catch (e) {
      logToConsole('设置护照号异常', e);
    }

    // 出生日期 Date of birth
    try {
      const birthInput =
        paxEl.querySelector('input.js_pax_doc_birth_date') ||
        paxEl.querySelector('input[data-validator-id="docBirthday"]');
      if (birthInput && data.birthdate) {
        setInputValue(birthInput, data.birthdate);
        logToConsole('已设置出生日期:', data.birthdate);
      } else {
        logToConsole('未找到出生日期输入框');
      }
    } catch (e) {
      logToConsole('设置出生日期异常', e);
    }

    // 证件有效期 Expiry date
    try {
      const expInput =
        paxEl.querySelector(`#doc_expiryDate${paxIndex}`) ||
        paxEl.querySelector('input.js_pax_doc_expiry');
      if (expInput && data.expirationDate) {
        setInputValue(expInput, data.expirationDate);
        logToConsole('已设置证件有效期:', data.expirationDate);
      } else {
        logToConsole('未找到证件有效期输入框');
      }
    } catch (e) {
      logToConsole('设置证件有效期异常', e);
    }

    // 国籍 citizenship（根据两字代码选）
    try {
      if (data.nationality2) {
        const natSelect = paxEl.querySelector(`#doc_citizenship${paxIndex}`) ||
          paxEl.querySelector('select.js_pax_doc_citizenship');
        if (natSelect) {
          const two = data.nationality2;
          const opt = Array.from(natSelect.options).find(o => (o.value || '').toUpperCase() === two.toUpperCase());
          if (opt) {
            natSelect.value = opt.value;
            natSelect.dispatchEvent(new Event('change', { bubbles: true }));
            logToConsole('已设置国籍为两字码:', two);
          } else {
            logToConsole('国籍两字码未在下拉中找到:', two);
          }
        } else {
          logToConsole('未找到国籍下拉框');
        }
      } else {
        logToConsole('SSR 中未解析出国籍两字码');
      }
    } catch (e) {
      logToConsole('设置国籍异常', e);
    }

    logToConsole(`第 ${index + 1} 位乘客填写完成`);
  }

  // 填写全体乘客
  async function fillAllPassengers() {
    const paxBlocks = Array.from(document.querySelectorAll('div[id^="pax_"]'));
    const passports = window[passportsDataVarName] || [];
    logToConsole(`检测到乘客区块 ${paxBlocks.length} 个，解析到护照 ${passports.length} 条`);
    const count = Math.min(paxBlocks.length, passports.length);
    if (count === 0) {
      logToConsole('无可匹配的乘客/护照信息，跳过乘客自动填充');
    } else {
      for (let i = 0; i < count; i++) {
        await fillPaxBlock(paxBlocks[i], passports[i], i);
        await sleep(200);
      }
    }
    await fillContactInfo();
  }

  // 填写第一个乘客
  async function fillFirstPassengerOnly() {
    const paxBlocks = Array.from(document.querySelectorAll('div[id^="pax_"]'));
    const passports = window[passportsDataVarName] || [];
    if (!paxBlocks.length || !passports.length) {
      logToConsole('未找到乘客区块或护照信息，无法填写第一位');
      return;
    }
    await fillPaxBlock(paxBlocks[0], passports[0], 0);
    await fillContactInfo();
  }

  // 填写全局联系信息（邮箱、电话区号、手机号）
  async function fillContactInfo() {
    logToConsole('开始填写联系信息');
    try {
      // 邮箱
      const emailInput = document.getElementById('contacts_eml_0') ||
        document.querySelector('input[name="multiContactsRequest.contacts[0].emails[0].email"]');
      if (emailInput) {
        setInputValue(emailInput, DEFAULT_EMAIL);
        logToConsole('已填写邮箱:', DEFAULT_EMAIL);
      } else {
        logToConsole('未找到邮箱输入框');
      }

      // 电话国家区号：选 +86（China）
      try {
        const phoneCodeSelect = document.getElementById('contacts_phoneCode_0') ||
          document.querySelector('select.js_contacts_phone_code');
        if (phoneCodeSelect) {
          const opts = Array.from(phoneCodeSelect.options);
          const chinaOpt = opts.find(o => {
            const t = (o.dataset.text || o.textContent || '').toLowerCase();
            // option 文本可能由自定义组件渲染（textContent 为空），需按 value=86 兜底
            return t.includes('+86') || t.includes('china') || (o.value || '').replace(/\D/g, '') === '86';
          });
          if (chinaOpt) {
            phoneCodeSelect.value = chinaOpt.value;
            phoneCodeSelect.dispatchEvent(new Event('change', { bubbles: true }));
            logToConsole('已选择电话区号为 China(+86)');
          } else {
            logToConsole('未在区号下拉中找到 China(+86)');
          }
        } else {
          logToConsole('未找到电话区号下拉');
        }
      } catch (e) {
        logToConsole('设置电话区号异常', e);
      }

      // 手机号
      const phoneInput = document.getElementById('contacts_phoneNo_0') ||
        document.querySelector('input[name="multiContactsRequest.contacts[0].phones[0].number"]');
      if (phoneInput) {
        setInputValue(phoneInput, DEFAULT_PHONE);
        logToConsole('已填写手机号:', DEFAULT_PHONE);
      } else {
        logToConsole('未找到手机号输入框');
      }
    } catch (e) {
      logToConsole('填写联系信息异常', e);
    }
    logToConsole('联系信息填写完成');
  }

  /**************** 控制面板 UI（复用 SU 风格） ****************/
  function injectPanel() {
    if (document.getElementById('s7fill-panel')) return;
    const panel = document.createElement('div');
    panel.id = 's7fill-panel';
    panel.style.cssText = `
      position:fixed;right:12px;top:80px;width:460px;z-index:999999;
      background:white;border:1px solid #ccc;box-shadow:0 6px 18px rgba(0,0,0,.12);
      border-radius:8px;font-family:Arial,sans-serif;font-size:13px;
    `;
    panel.innerHTML = `
      <div id="s7fill-header" style="cursor:move;padding:6px 10px;background:#2d8cff;color:#fff;border-radius:8px 8px 0 0;display:flex;justify-content:space-between;align-items:center;position:relative;">
        <span>S7护照自动填写&nbsp;&nbsp;悦美华</span>
        <button id="s7fill-min" style="background:transparent;border:none;color:#fff;font-size:14px;cursor:pointer;
        position:absolute;right:10px;top:50%;transform:translateY(-50%);padding:2px 6px;width:auto;min-width:20px;">—</button>
      </div>
      <div id="s7fill-body" style="padding:8px;">
        <textarea id="s7fill-input" style="width:100%;height:120px;font-size:12px;
                  border:1px solid #ddd;border-radius:4px;padding:6px;box-sizing:border-box;"
                  placeholder="在此粘贴 SSR DOCS 行，例如：SSR DOCS SU HKGPVG NN1 /P/CHN/xxxxxxxxx/CHN/20MAY02/M/20MAY30/LI/MEI P1">${defaultInput}</textarea>
        <div style="margin:8px 0;display:flex;justify-content:space-between;gap:6px;">
          <button id="s7fill-parse" style="flex:1;padding:6px;border:1px solid #ddd;border-radius:4px;
                  background:#f5f5f5;cursor:pointer;">解析</button>
          <button id="s7fill-detect" style="flex:1;padding:6px;border:1px solid #ddd;border-radius:4px;
                  background:#f5f5f5;cursor:pointer;">检测旅客数</button>
          <button id="s7fill-fill-all" style="flex:1;padding:6px;border:1px solid #2d8cff;border-radius:4px;
                  background:#2d8cff;color:white;cursor:pointer;">填写全部</button>
        </div>
        <div style="margin:8px 0;display:flex;justify-content:center;gap:6px;">
          <button id="s7fill-fill-first" style="flex:1;max-width:200px;padding:6px;border:1px solid #ddd;
                  border-radius:4px;background:#f5f5f5;cursor:pointer;">填写第1位+联系信息</button>
          <button id="s7fill-clear-log" style="flex:1;max-width:200px;padding:6px;border:1px solid #ddd;
                  border-radius:4px;background:#f5f5f5;cursor:pointer;">清日志</button>
        </div>
        <textarea id="s7fill-log-area" style="width:100%;height:140px;font-size:12px;
                  border:1px solid #ddd;border-radius:4px;padding:6px;box-sizing:border-box;"
                  readonly placeholder="日志信息..."></textarea>
      </div>
    `;
    document.body.appendChild(panel);

    // 最小化
    document.getElementById('s7fill-min').addEventListener('click', () => {
      const body = document.getElementById('s7fill-body');
      body.style.display = body.style.display === 'none' ? 'block' : 'none';
    });

    // 拖动
    const header = document.getElementById('s7fill-header');
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
    document.getElementById('s7fill-parse').addEventListener('click', () => {
      clearLog();
      const txt = document.getElementById('s7fill-input').value;
      const parsed = parsePassportsFromText(txt);
      logToConsole('解析到', parsed.length, '条护照信息');
      parsed.forEach((p, i) => {
        logToConsole(
          `第${i + 1}位 -> 姓:${p.surname}, 名:${p.givenName}, 性别:${p.gender}, 出生:${p.birthdate}, ` +
          `国籍(3字):${p.nationality}, 国籍(2字):${p.nationality2}, 护照号:${p.passportNumber}, 有效期:${p.expirationDate}, P号:${p.passengerIndex}`
        );
      });
    });

    document.getElementById('s7fill-detect').addEventListener('click', () => {
      const paxBlocks = document.querySelectorAll('div[id^="pax_"]');
      logToConsole('检测到 pax_x 乘客区块数量：', paxBlocks.length);
    });

    document.getElementById('s7fill-fill-all').addEventListener('click', fillAllPassengers);
    document.getElementById('s7fill-fill-first').addEventListener('click', fillFirstPassengerOnly);
    document.getElementById('s7fill-clear-log').addEventListener('click', clearLog);

    // 输入框自动解析
    const inputArea = document.getElementById('s7fill-input');
    ['input', 'blur'].forEach(ev => {
      inputArea.addEventListener(ev, () => {
        const parsed = parsePassportsFromText(inputArea.value);
        logToConsole(`自动解析：${parsed.length} 条`);
      });
    });
  }

  /**************** 监听乘客区块，自动弹出面板 ****************/

  function waitForPaxBlocks() {
    const found = () =>
      document.querySelector('div[id^="pax_"]') ||
      document.querySelector('input.js_last_name') ||
      document.querySelector('input[name*="passengersRequest.passengers"]');
    return new Promise(resolve => {
      if (found()) {
        resolve();
        return;
      }
      const observer = new MutationObserver(() => {
        if (found()) {
          observer.disconnect();
          resolve();
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
    });
  }

  (async function main() {
    logToConsole('脚本已加载，等待乘客信息区块 #pax_0 ...');
    await waitForPaxBlocks();
    logToConsole('检测到乘客信息区块，注入 S7 控制面板');
    injectPanel();
  })();

})();


