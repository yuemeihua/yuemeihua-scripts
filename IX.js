// ==UserScript==
// @name         IX 航空自动填充护照信息
// @namespace    https://example.com/
// @version      1.0
// @description  Air India Express (IX) 乘客页自动填写护照信 - 悦美华
// @author       自动生成
// @match        https://www.airindiaexpress.com/*
// @grant        none
// @run-at       document-idle
// @updateURL    https://raw.githubusercontent.com/tryle17/yuemeihua-scripts/main/IX.js
// @downloadURL  https://raw.githubusercontent.com/tryle17/yuemeihua-scripts/main/IX.js
// ==/UserScript==

/*
更新日志：
v1.0 (2025-12-25)
- 添加自动解析功能
- 实现区号选择功能
- 添加护照开关功能
- 实现国家代码匹配功能
- 添加多乘客支持
- 合并COUNTRY_CODES_3_TO_2和COUNTRY_NAME_BY_CODE为一个集合
*/

(function () {
  'use strict';

  const DEFAULT_EMAIL = 'yuemeihuafly@163.com';
  const DEFAULT_PHONE = '18610429740';
  const passportsDataVarName = 'ix_passports';
  window[passportsDataVarName] = [];

  // 简易日志（与 SU.js 风格一致）
  function appendLog(text) {
    const area = document.getElementById('ixfill-log-area');
    if (!area) return;
    const now = new Date().toLocaleTimeString();
    area.value += `[${now}] ${text}\n`;
    area.scrollTop = area.scrollHeight;
  }
  function logToConsole(...args) { console.log('[IXFill]', ...args); appendLog(args.join(' ')); }

  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
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
    ['mousedown', 'mouseup', 'click'].forEach(evt => el.dispatchEvent(new MouseEvent(evt, { bubbles: true, cancelable: true, composed: true, view: window })));
  }
  function simulateClick(el) { if (!el) return; el.focus && el.focus(); dispatchMouseSequence(el); }

  function normalizeForMatch(s) {
    if (!s) return '';
    return s.replace(/\s+/g, ' ').trim().toLowerCase();
  }

  function escapeRegExp(str) {
    return (str || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // 在 MUI 列表项中寻找最佳匹配（优先严格整词匹配，再宽松包含匹配）
  function findMuiListItemByCandidates(items, candidates) {
    const normCandidates = (candidates || []).map(c => normalizeForMatch(c)).filter(Boolean);
    if (!normCandidates.length) return null;

    // 第一轮：整词或完全相等匹配
    for (const it of items) {
      const raw = it.textContent || '';
      const txt = normalizeForMatch(raw);
      for (const cand of normCandidates) {
        if (!cand) continue;
        if (txt === cand) return it;
        try {
          const re = new RegExp('\\b' + escapeRegExp(cand) + '\\b', 'i');
          if (re.test(raw)) return it;
        } catch (e) {}
      }
    }

    // 第二轮：包含 / 开头匹配
    for (const it of items) {
      const txt = normalizeForMatch(it.textContent || '');
      for (const cand of normCandidates) {
        if (!cand) continue;
        if (txt.includes(cand) || txt.startsWith(cand)) return it;
      }
    }

    return null;
  }

  // 完整国家代码映射（合并三字码/二字码/国家名）
  // 来源：country_codes_mapping.json
  const COUNTRY_CODES = {
    "AFG": { "two_letter": "AF", "country_name": "Afghanistan" },
    "ALA": { "two_letter": "AX", "country_name": "Aland Islands" },
    "ALB": { "two_letter": "AL", "country_name": "Albania" },
    "DZA": { "two_letter": "DZ", "country_name": "Algeria" },
    "ASM": { "two_letter": "AS", "country_name": "American Samoa" },
    "AND": { "two_letter": "AD", "country_name": "Andorra" },
    "AGO": { "two_letter": "AO", "country_name": "Angola" },
    "AIA": { "two_letter": "AI", "country_name": "Anguilla" },
    "ATA": { "two_letter": "AQ", "country_name": "Antarctica" },
    "ATG": { "two_letter": "AG", "country_name": "Antigua and Barbuda" },
    "ARG": { "two_letter": "AR", "country_name": "Argentina" },
    "ARM": { "two_letter": "AM", "country_name": "Armenia" },
    "ABW": { "two_letter": "AW", "country_name": "Aruba" },
    "AUS": { "two_letter": "AU", "country_name": "Australia" },
    "AUT": { "two_letter": "AT", "country_name": "Austria" },
    "AZE": { "two_letter": "AZ", "country_name": "Azerbaijan" },
    "BHS": { "two_letter": "BS", "country_name": "Bahamas" },
    "BHR": { "two_letter": "BH", "country_name": "Bahrain" },
    "BGD": { "two_letter": "BD", "country_name": "Bangladesh" },
    "BRB": { "two_letter": "BB", "country_name": "Barbados" },
    "BLR": { "two_letter": "BY", "country_name": "Belarus" },
    "BEL": { "two_letter": "BE", "country_name": "Belgium" },
    "BLZ": { "two_letter": "BZ", "country_name": "Belize" },
    "BEN": { "two_letter": "BJ", "country_name": "Benin" },
    "BMU": { "two_letter": "BM", "country_name": "Bermuda" },
    "BTN": { "two_letter": "BT", "country_name": "Bhutan" },
    "BOL": { "two_letter": "BO", "country_name": "Bolivia" },
    "BES": { "two_letter": "BQ", "country_name": "Bonaire, Saint Eustatius and Saba" },
    "BIH": { "two_letter": "BA", "country_name": "Bosnia and Herzegovina" },
    "BWA": { "two_letter": "BW", "country_name": "Botswana" },
    "BVT": { "two_letter": "BV", "country_name": "Bouvet Island" },
    "BRA": { "two_letter": "BR", "country_name": "Brazil" },
    "IOT": { "two_letter": "IO", "country_name": "British Indian Ocean Territory" },
    "BRN": { "two_letter": "BN", "country_name": "Brunei Darussalam" },
    "BGR": { "two_letter": "BG", "country_name": "Bulgaria" },
    "BFA": { "two_letter": "BF", "country_name": "Burkina Faso" },
    "BDI": { "two_letter": "BI", "country_name": "Burundi" },
    "CPV": { "two_letter": "CV", "country_name": "Cabo Verde" },
    "KHM": { "two_letter": "KH", "country_name": "Cambodia" },
    "CMR": { "two_letter": "CM", "country_name": "Cameroon" },
    "CAN": { "two_letter": "CA", "country_name": "Canada" },
    "CYM": { "two_letter": "KY", "country_name": "Cayman Islands" },
    "CAF": { "two_letter": "CF", "country_name": "Central African Republic" },
    "TCD": { "two_letter": "TD", "country_name": "Chad" },
    "CHL": { "two_letter": "CL", "country_name": "Chile" },
    "CHN": { "two_letter": "CN", "country_name": "China" },
    "CXR": { "two_letter": "CX", "country_name": "Christmas Island" },
    "CCK": { "two_letter": "CC", "country_name": "Cocos (Keeling) Islands" },
    "COL": { "two_letter": "CO", "country_name": "Colombia" },
    "COM": { "two_letter": "KM", "country_name": "Comoros" },
    "COG": { "two_letter": "CG", "country_name": "Congo" },
    "COD": { "two_letter": "CD", "country_name": "Congo (Democratic Republic)" },
    "COK": { "two_letter": "CK", "country_name": "Cook Islands" },
    "CRI": { "two_letter": "CR", "country_name": "Costa Rica" },
    "CIV": { "two_letter": "CI", "country_name": "Côte d'Ivoire" },
    "HRV": { "two_letter": "HR", "country_name": "Croatia" },
    "CUB": { "two_letter": "CU", "country_name": "Cuba" },
    "CUW": { "two_letter": "CW", "country_name": "Curaçao" },
    "CYP": { "two_letter": "CY", "country_name": "Cyprus" },
    "CZE": { "two_letter": "CZ", "country_name": "Czechia" },
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
    "FLK": { "two_letter": "FK", "country_name": "Falkland Islands (Malvinas)" },
    "FRO": { "two_letter": "FO", "country_name": "Faroe Islands" },
    "FJI": { "two_letter": "FJ", "country_name": "Fiji" },
    "FIN": { "two_letter": "FI", "country_name": "Finland" },
    "FRA": { "two_letter": "FR", "country_name": "France" },
    "GUF": { "two_letter": "GF", "country_name": "French Guiana" },
    "PYF": { "two_letter": "PF", "country_name": "French Polynesia" },
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
    "VAT": { "two_letter": "VA", "country_name": "Holy See" },
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
    "PRK": { "two_letter": "KP", "country_name": "Korea (Democratic People's Republic)" },
    "KOR": { "two_letter": "KR", "country_name": "Korea (Republic of)" },
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
    "MHL": { "two_letter": "MH", "country_name": "Marshall Islands" },
    "MTQ": { "two_letter": "MQ", "country_name": "Martinique" },
    "MRT": { "two_letter": "MR", "country_name": "Mauritania" },
    "MUS": { "two_letter": "MU", "country_name": "Mauritius" },
    "MYT": { "two_letter": "YT", "country_name": "Mayotte" },
    "MEX": { "two_letter": "MX", "country_name": "Mexico" },
    "FSM": { "two_letter": "FM", "country_name": "Micronesia (Federated States of)" },
    "MDA": { "two_letter": "MD", "country_name": "Moldova (Republic of)" },
    "MCO": { "two_letter": "MC", "country_name": "Monaco" },
    "MNG": { "two_letter": "MN", "country_name": "Mongolia" },
    "MNE": { "two_letter": "ME", "country_name": "Montenegro" },
    "MSR": { "two_letter": "MS", "country_name": "Montserrat" },
    "MAR": { "two_letter": "MA", "country_name": "Morocco" },
    "MOZ": { "two_letter": "MZ", "country_name": "Mozambique" },
    "MMR": { "two_letter": "MM", "country_name": "Myanmar" },
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
    "PSE": { "two_letter": "PS", "country_name": "Palestine, State of" },
    "PAN": { "two_letter": "PA", "country_name": "Panama" },
    "PNG": { "two_letter": "PG", "country_name": "Papua New Guinea" },
    "PRY": { "two_letter": "PY", "country_name": "Paraguay" },
    "PER": { "two_letter": "PE", "country_name": "Peru" },
    "PHL": { "two_letter": "PH", "country_name": "Philippines" },
    "PCN": { "two_letter": "PN", "country_name": "Pitcairn" },
    "POL": { "two_letter": "PL", "country_name": "Poland" },
    "PRT": { "two_letter": "PT", "country_name": "Portugal" },
    "PRI": { "two_letter": "PR", "country_name": "Puerto Rico" },
    "QAT": { "two_letter": "QA", "country_name": "Qatar" },
    "MKD": { "two_letter": "MK", "country_name": "North Macedonia" },
    "ROU": { "two_letter": "RO", "country_name": "Romania" },
    "RUS": { "two_letter": "RU", "country_name": "Russia" },
    "RWA": { "two_letter": "RW", "country_name": "Rwanda" },
    "REU": { "two_letter": "RE", "country_name": "Réunion" },
    "BLM": { "two_letter": "BL", "country_name": "Saint Barthélemy" },
    "SHN": { "two_letter": "SH", "country_name": "Saint Helena, Ascension and Tristan da Cunha" },
    "KNA": { "two_letter": "KN", "country_name": "Saint Kitts and Nevis" },
    "LCA": { "two_letter": "LC", "country_name": "Saint Lucia" },
    "MAF": { "two_letter": "MF", "country_name": "Saint Martin (French part)" },
    "SPM": { "two_letter": "PM", "country_name": "Saint Pierre and Miquelon" },
    "VCT": { "two_letter": "VC", "country_name": "Saint Vincent and the Grenadines" },
    "WSM": { "two_letter": "WS", "country_name": "Samoa" },
    "SMR": { "two_letter": "SM", "country_name": "San Marino" },
    "STP": { "two_letter": "ST", "country_name": "Sao Tome and Principe" },
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
    "SYR": { "two_letter": "SY", "country_name": "Syrian Arab Republic" },
    "TWN": { "two_letter": "TW", "country_name": "Taiwan" },
    "TJK": { "two_letter": "TJ", "country_name": "Tajikistan" },
    "TZA": { "two_letter": "TZ", "country_name": "Tanzania, United Republic of" },
    "THA": { "two_letter": "TH", "country_name": "Thailand" },
    "TLS": { "two_letter": "TL", "country_name": "Timor-Leste" },
    "TGO": { "two_letter": "TG", "country_name": "Togo" },
    "TKL": { "two_letter": "TK", "country_name": "Tokelau" },
    "TON": { "two_letter": "TO", "country_name": "Tonga" },
    "TTO": { "two_letter": "TT", "country_name": "Trinidad and Tobago" },
    "TUN": { "two_letter": "TN", "country_name": "Tunisia" },
    "TUR": { "two_letter": "TR", "country_name": "Turkey" },
    "TKM": { "two_letter": "TM", "country_name": "Turkmenistan" },
    "TCA": { "two_letter": "TC", "country_name": "Turks and Caicos Islands" },
    "TUV": { "two_letter": "TV", "country_name": "Tuvalu" },
    "UGA": { "two_letter": "UG", "country_name": "Uganda" },
    "UKR": { "two_letter": "UA", "country_name": "Ukraine" },
    "ARE": { "two_letter": "AE", "country_name": "United Arab Emirates" },
    "GBR": { "two_letter": "GB", "country_name": "United Kingdom" },
    "USA": { "two_letter": "US", "country_name": "United States" },
    "UMI": { "two_letter": "UM", "country_name": "United States Minor Outlying Islands" },
    "URY": { "two_letter": "UY", "country_name": "Uruguay" },
    "UZB": { "two_letter": "UZ", "country_name": "Uzbekistan" },
    "VUT": { "two_letter": "VU", "country_name": "Vanuatu" },
    "VEN": { "two_letter": "VE", "country_name": "Venezuela (Bolivarian Republic)" },
    "VNM": { "two_letter": "VN", "country_name": "Viet Nam" },
    "VGB": { "two_letter": "VG", "country_name": "British Virgin Islands" },
    "VIR": { "two_letter": "VI", "country_name": "United States Virgin Islands" },
    "WLF": { "two_letter": "WF", "country_name": "Wallis and Futuna" },
    "ESH": { "two_letter": "EH", "country_name": "Western Sahara" },
    "YEM": { "two_letter": "YE", "country_name": "Yemen" },
    "ZMB": { "two_letter": "ZM", "country_name": "Zambia" },
    "ZWE": { "two_letter": "ZW", "country_name": "Zimbabwe" }
  };

  // 根据任意二字或三字代码解析出国家名（若找不到则返回原始 code）
  function resolveCountryName(code) {
    if (!code) return code;
    const C = code.toUpperCase();
    
    // 直接查找
    if (COUNTRY_CODES[C] && COUNTRY_CODES[C].country_name) {
      return COUNTRY_CODES[C].country_name;
    }
    
    // 如果传入的是二字码但未直接命中，尝试按 two_letter 查找
    for (const k in COUNTRY_CODES) {
      const entry = COUNTRY_CODES[k];
      if (entry && entry.two_letter === C) {
        return entry.country_name || C;
      }
    }
    
    return code;
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
      return `${day}/${month}/${year}`;
    }
    const parts = s.split(/[.\-\/]/).map(p => p.trim());
    if (parts.length === 3) {
      if (parts[0].length === 4) return `${parts[2]}/${parts[1]}/${parts[0]}`;
      if (parts[2].length === 4) return `${parts[0]}/${parts[1]}/${parts[2]}`;
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
    } catch (e) { out.error = e.message; }
    return out;
  }

  function parsePassportsFromText(text) {
    const lines = text.split(/\r?\n/).map(l=>l.trim()).filter(Boolean);
    const results = [];
    for (const line of lines) {
      if (/^SSR\s+DOCS/i.test(line)) {
        const parsed = parseSSRLine(line);
        if (parsed.ok) {
          results.push(parsed);
          logToConsole('解析到SSR:', 'surname=' + parsed.surname, 'givenName=' + parsed.givenName, 'nationality=' + parsed.nationalityFull, 'issuing=' + parsed.issuingCountryFull, 'passport=' + parsed.passportNumber);
        } else {
          logToConsole('解析SSR失败:', line, parsed.error || 'unknown');
        }
      }
    }
    window[passportsDataVarName] = results;
    return results;
  }

  function findGuestCards() {
    const root = document.getElementById('guest_detail');
    if (!root) return [];
    // children divs represent passenger cards
    return Array.from(root.children).filter(el => el.tagName === 'DIV');
  }

  // 验证下拉是否已经显示为期望文本（宽松验证）
  function verifySelectValue(selectEl, expectedText) {
    if (!selectEl) return false;
    const shown = (selectEl.textContent || '').trim();
    if (!expectedText) return !!shown;
    const a = normalizeForMatch(shown);
    const b = normalizeForMatch(expectedText);
    return a === b || a.includes(b) || b.includes(a);
  }

  async function selectMuiMenuItemByText(candidates) {
    // candidates 可以传入字符串或字符串数组
    const candArray = Array.isArray(candidates) ? candidates : [candidates];
    const list = Array.from(document.querySelectorAll('.MuiMenu-list, .MuiList-root')).find(u => u.offsetParent !== null);
    if (!list) return false;
    const items = Array.from(list.querySelectorAll('li, .MuiListItem-root, .MuiMenuItem-root'));
    if (!items.length) return false;
    const target = findMuiListItemByCandidates(items, candArray);
    const chosen = target || items[0];
    if (chosen) { dispatchMouseSequence(chosen); await sleep(200); return true; }
    return false;
  }

  // 手机号区号选择
  async function selectChinaCountryCode(cardEl) {
    try {
      // 1. 打开下拉框 - 在指定卡片内查找
      const countryCodeSelect = cardEl ?
        cardEl.querySelector('.passanger-info-form-mobile-prefix-select-countrycode') :
        document.querySelector('.passanger-info-form-mobile-prefix-select-countrycode');
        
      if (!countryCodeSelect) {
        logToConsole('未找到区号选择器');
        return false;
      }

      simulateClick(countryCodeSelect);
      logToConsole('已点击区号选择器');
      await sleep(300);

      // 2. 查找搜索框 - 在指定卡片内查找
      const searchInput = cardEl ?
        cardEl.querySelector('input[id^="searchCountry"]') :
        document.getElementById('searchCountryADT1');
        
      if (!searchInput) {
        logToConsole('未找到区号搜索框');
        return false;
      }

      // 3. 输入China进行搜索
      setInputValue(searchInput, 'China');
      await sleep(300);

      // 4. 查找China选项
      const options = Array.from(document.querySelectorAll('.countrycodeOptionFields'));
      const chinaOption = options.find(option => {
        const text = option.textContent || '';
        return text.includes('China') && text.includes('+86');
      });

      if (chinaOption) {
        simulateClick(chinaOption);
        logToConsole('已选择中国区号 +86');
        await sleep(300);
        return true;
      } else {
        logToConsole('未找到中国区号选项');
        return false;
      }
    } catch (e) {
      logToConsole('选择区号时异常:', e);
      return false;
    }
  }

  // 新方法：点击整个下拉框区域而不是ID元素 - 设置签发国
  async function setIssuingCountry(countryCode, cardEl) {
    console.log('=== 开始设置签发国 ===');
    console.log('传入签发国代码:', countryCode);
    
    // 通过COUNTRY_CODES映射获取完整国家名
    let countryName = '';
    if (countryCode) {
      const upperCode = countryCode.toUpperCase();
      // 直接查找三字码
      if (COUNTRY_CODES[upperCode] && COUNTRY_CODES[upperCode].country_name) {
        countryName = COUNTRY_CODES[upperCode].country_name;
      } else {
        // 尝试通过二字码查找
        for (const key in COUNTRY_CODES) {
          if (COUNTRY_CODES[key].two_letter === upperCode) {
            countryName = COUNTRY_CODES[key].country_name;
            break;
          }
        }
      }
    }
    
    if (!countryName) {
      console.error('❌ 无法解析签发国代码:', countryCode);
      return false;
    }
    
    console.log('解析到的签发国名称:', countryName);
    
    // 1. 查找签发国的整个下拉框容器 - 在指定卡片内查找
    let issuingContainer;
    if (cardEl) {
      issuingContainer = Array.from(cardEl.querySelectorAll('.MuiSelect-root'))
          .find(el => el.getAttribute('aria-label') === 'Issuing Country');
    }
    
    // 如果在卡片内没找到，则全局查找
    if (!issuingContainer) {
      issuingContainer = Array.from(document.querySelectorAll('.MuiSelect-root'))
          .find(el => el.getAttribute('aria-label') === 'Issuing Country');
    }
    
    if (!issuingContainer) {
      console.error('❌ 未找到签发国下拉框');
      return false;
    }
    
    console.log('✓ 找到签发国容器，点击...');
    
    // 点击整个容器
    issuingContainer.click();
    
    // 尝试触发多种事件
    issuingContainer.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    issuingContainer.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    
    // 增加等待时间
    await sleep(600);
    
    console.log('检查菜单...');
    
    // 查找弹出的菜单
    const menu = document.querySelector('.MuiMenu-paper') ||
                document.querySelector('.MuiPopover-paper') ||
                document.querySelector('[role="listbox"]');
    
    const items = document.querySelectorAll('.MuiMenuItem-root');
    console.log(`找到 ${items.length} 个选项`);
    
    if (items.length === 0) {
      console.error('❌ 菜单未打开');
      return false;
    }
    
    // 尝试多种匹配方式
    const candidates = [countryName, countryCode];
    let target = null;
    
    for (const candidate of candidates) {
      target = Array.from(items).find(i =>
        i.textContent.toLowerCase().includes(candidate.toLowerCase())
      );
      if (target) {
        console.log('找到匹配项:', candidate);
        break;
      }
    }
    
    if (target) {
      target.click();
      console.log('✅ 签发国已选择:', countryName);
      return true;
    } else {
      console.error(`❌ 未找到 ${countryName} 或 ${countryCode} 选项`);
      // 输出所有可用选项用于调试
      console.log('可用选项:', Array.from(items).map(i => i.textContent).join(', '));
      return false;
    }
  }

  // 新方法：点击整个下拉框区域而不是ID元素 - 设置国籍
  async function setResidenceCountry(countryCode, cardEl) {
    console.log('=== 开始设置国籍 ===');
    console.log('传入国籍代码:', countryCode);
    
    // 通过COUNTRY_CODES映射获取完整国家名
    let countryName = '';
    if (countryCode) {
      const upperCode = countryCode.toUpperCase();
      // 直接查找三字码
      if (COUNTRY_CODES[upperCode] && COUNTRY_CODES[upperCode].country_name) {
        countryName = COUNTRY_CODES[upperCode].country_name;
      } else {
        // 尝试通过二字码查找
        for (const key in COUNTRY_CODES) {
          if (COUNTRY_CODES[key].two_letter === upperCode) {
            countryName = COUNTRY_CODES[key].country_name;
            break;
          }
        }
      }
    }
    
    if (!countryName) {
      console.error('❌ 无法解析国籍代码:', countryCode);
      return false;
    }
    
    console.log('解析到的国籍名称:', countryName);
    
    // 查找国籍的整个下拉框容器 - 在指定卡片内查找
    let residenceContainer;
    if (cardEl) {
      residenceContainer = Array.from(cardEl.querySelectorAll('.MuiSelect-root'))
          .find(el => el.getAttribute('aria-label') === 'Country of Residence');
    }
    
    // 如果在卡片内没找到，则全局查找
    if (!residenceContainer) {
      residenceContainer = Array.from(document.querySelectorAll('.MuiSelect-root'))
          .find(el => el.getAttribute('aria-label') === 'Country of Residence');
    }
    
    if (!residenceContainer) {
      console.error('❌ 未找到国籍下拉框');
      return false;
    }
    
    console.log('✓ 找到国籍容器，点击...');
    
    // 点击整个容器
    residenceContainer.click();
    
    // 尝试触发多种事件
    residenceContainer.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    residenceContainer.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    
    // 增加等待时间
    await sleep(600);
    
    console.log('检查菜单...');
    
    // 查找弹出的菜单
    const menu = document.querySelector('.MuiMenu-paper') ||
                document.querySelector('.MuiPopover-paper') ||
                document.querySelector('[role="listbox"]');
    
    const items = document.querySelectorAll('.MuiMenuItem-root');
    console.log(`找到 ${items.length} 个选项`);
    
    if (items.length === 0) {
      console.error('❌ 菜单未打开');
      return false;
    }
    
    // 尝试多种匹配方式
    const candidates = [countryName, countryCode];
    let target = null;
    
    for (const candidate of candidates) {
      target = Array.from(items).find(i =>
        i.textContent.toLowerCase().includes(candidate.toLowerCase())
      );
      if (target) {
        console.log('找到匹配项:', candidate);
        break;
      }
    }
    
    if (target) {
      target.click();
      console.log('✅ 国籍已选择:', countryName);
      return true;
    } else {
      console.error(`❌ 未找到 ${countryName} 或 ${countryCode} 选项`);
      // 输出所有可用选项用于调试
      console.log('可用选项:', Array.from(items).map(i => i.textContent).join(', '));
      return false;
    }
  }

  // 护照开关
  async function togglePassportDetails(cardEl) {
    try {
      // 在指定卡片内查找护照开关
      const passportSwitch = cardEl ?
        cardEl.querySelector('button[aria-label*="passport"]') :
        document.querySelector('button[aria-label*="passport"]');
        
      if (!passportSwitch) {
        logToConsole('未找到护照开关');
        return false;
      }

      // 检查是否已经打开
      if (passportSwitch.getAttribute('aria-checked') === 'true') {
        logToConsole('护照详情已展开');
        return true;
      }

      simulateClick(passportSwitch);
      logToConsole('已点击护照开关');
      await sleep(500);
      return true;
    } catch (e) {
      logToConsole('切换护照开关时异常:', e);
      return false;
    }
  }

  async function fillPassengerCard(cardEl, data, index) {
    logToConsole('开始填写第', index+1, '位');
    try {
      // First name
      const firstInput = cardEl.querySelector('input[id^="firstname"]');
      if (firstInput && data.givenName) {
        setInputValue(firstInput, data.givenName);
        logToConsole('已设置名:', data.givenName);
        await sleep(200);
      }

      // Last name
      const lastInput = cardEl.querySelector('input[id^="lastname"]');
      if (lastInput && data.surname) {
        setInputValue(lastInput, data.surname);
        logToConsole('已设置姓:', data.surname);
        await sleep(200);
      }

      // DOB
      const dobInput = cardEl.querySelector('input[aria-label*="DOB"]');
      if (dobInput && data.birthdate) {
        setInputValue(dobInput, data.birthdate);
        logToConsole('已设置出生日期:', data.birthdate);
        await sleep(200);
      }

      // Email
      const emailInput = cardEl.querySelector('input[id^="email"]');
      if (emailInput) {
        setInputValue(emailInput, DEFAULT_EMAIL);
        logToConsole('已设置邮箱:', DEFAULT_EMAIL);
        await sleep(200);
      }

      // 手机号区号选择
      await selectChinaCountryCode(cardEl);

      // 手机号
      const phoneInput = cardEl.querySelector('input[id^="mobileNo"]');
      if (phoneInput) {
        setInputValue(phoneInput, DEFAULT_PHONE);
        logToConsole('已设置手机号:', DEFAULT_PHONE);
        await sleep(200);
      }

      // 护照开关
      await togglePassportDetails(cardEl);

      // 护照号
      const passportInput = cardEl.querySelector('input[id^="passportNum"]');
      if (passportInput && data.passportNumber) {
        setInputValue(passportInput, data.passportNumber);
        logToConsole('已设置护照号:', data.passportNumber);
        await sleep(200);
      }

      // 护照过期时间
      const expiryInput = cardEl.querySelector('input[aria-label*="Expiry"]');
      if (expiryInput && data.expirationDate) {
        setInputValue(expiryInput, data.expirationDate);
        logToConsole('已设置有效期:', data.expirationDate);
        await sleep(200);
      }

      // 签发国 - 使用新的选择方法
      if (data.issuingCountry) {
        try {
          await setIssuingCountry(data.issuingCountry, cardEl);
        } catch (e) {
          logToConsole('设置签发国失败:', e);
        }
      }

      // 国籍 - 使用新的选择方法
      if (data.nationality) {
        try {
          await setResidenceCountry(data.nationality, cardEl);
        } catch (e) {
          logToConsole('设置国籍失败:', e);
        }
      }

      // 性别选择 - 移到最后
      const genderButtons = Array.from(cardEl.querySelectorAll('input[name="title"]'));
      if (genderButtons.length > 0 && data.gender) {
        const targetGender = data.gender === 'M' ? 'Mr' : 'Ms';
        const genderButton = genderButtons.find(btn => btn.value === targetGender);
        if (genderButton) {
          const label = cardEl.querySelector(`label[for="${genderButton.id}"]`);
          if (label) {
            simulateClick(label);
            logToConsole('已设置性别为', targetGender);
            await sleep(200);
          } else {
            // 如果找不到label，尝试直接点击radio按钮
            genderButton.click();
            logToConsole('已直接点击性别按钮:', targetGender);
            await sleep(200);
          }
        } else {
          logToConsole('未找到性别按钮:', targetGender, '可用按钮:', genderButtons.map(btn => btn.value).join(', '));
        }
      }

      logToConsole('第', index+1, '位填写完成');
    } catch (e) {
      logToConsole('填写乘客时错误:', e && e.message || e);
    }
  }

  async function fillAllPassengers() {
    const cards = findGuestCards();
    const passports = window[passportsDataVarName] || [];
    logToConsole('找到卡片', cards.length, '条，解析到', passports.length, '条SSR');
    const count = Math.min(cards.length, passports.length);
    for (let i = 0; i < count; i++) {
      await fillPassengerCard(cards[i], passports[i], i);
      await sleep(300);
    }
    logToConsole('全部填写完成');
  }

  function clearLog() {
    const area = document.getElementById('ixfill-log-area');
    if (area) area.value = '';
  }

  function injectPanel() {
    if (document.getElementById('ixfill-panel')) return;
    const panel = document.createElement('div');
    panel.id = 'ixfill-panel';
    panel.style.cssText = `
      position:fixed;right:12px;top:80px;width:460px;z-index:999999;
      background:white;border:1px solid #ccc;box-shadow:0 6px 18px rgba(0,0,0,.12);
      border-radius:8px;font-family:Arial,sans-serif;font-size:13px;
    `;
    panel.innerHTML = `
      <div id="ixfill-header" style="cursor:move;padding:6px 10px;background:#2d8cff;color:#fff;border-radius:8px 8px 0 0;display:flex;justify-content:space-between;align-items:center;position:relative;">
        <span>IX护照自动填写   悦美华</span>
        <button id="ixfill-min" style="background:transparent;border:none;color:#fff;font-size:14px;cursor:pointer;
        position:absolute;right:10px;top:50%;transform:translateY(-50%);padding:2px 6px;width:auto;min-width:20px;">—</button>
      </div>
      <div id="ixfill-body" style="padding:8px;">
        <textarea id="ixfill-input" style="width:100%;height:144px;font-size:14px;
                  border:1px solid #ddd;border-radius:4px;padding:8px;box-sizing:border-box;"
                  placeholder="请输入信息..."></textarea>
        <div style="margin:8px 0;display:flex;justify-content:space-between;gap:6px;">
	          <button id="ixfill-parse" style="flex:1;padding:6px;border:1px solid #ddd;border-radius:4px;
                  background:#f5f5f5;cursor:pointer;">解析</button>
          <button id="ixfill-detect" style="flex:1;padding:6px;border:1px solid #ddd;border-radius:4px;
                  background:#f5f5f5;cursor:pointer;">检测卡数量</button>
          <button id="ixfill-fill-all" style="flex:1;padding:6px;border:1px solid #ff962dff;border-radius:4px;
                  background:#2d8cff;color:white;cursor:pointer;">填写全部</button>
        </div>
        <div style="margin:8px 0;display:flex;justify-content:center;gap:6px;">
	          <button id="ixfill-fill-first" style="flex:1;max-width:200px;padding:6px;border:1px solid #ddd;
                  border-radius:4px;background:#f5f5f5;cursor:pointer;">填写第1位</button>
          <button id="ixfill-clear-log" style="flex:1;max-width:200px;padding:6px;border:1px solid #ddd;
                  border-radius:4px;background:#f5f5f5;cursor:pointer;">清日志</button>
        </div>
        <textarea id="ixfill-log-area" style="width:100%;height:140px;font-size:12px;
                  border:1px solid #ddd;border-radius:4px;padding:8px;box-sizing:border-box;"
                  readonly placeholder="日志信息..."></textarea>
      </div>
    `;
    document.body.appendChild(panel);

    // 最小化
    document.getElementById('ixfill-min').addEventListener('click',()=>{
      const body=document.getElementById('ixfill-body');
      body.style.display=body.style.display==='none'?'block':'none';
    });

    // 拖动
    const header=document.getElementById('ixfill-header');
    let isDrag=false,offsetX=0,offsetY=0;
    header.addEventListener('mousedown',e=>{
      isDrag=true; offsetX=e.clientX-panel.offsetLeft; offsetY=e.clientY-panel.offsetTop;
      document.addEventListener('mousemove',move); document.addEventListener('mouseup',stop);
    });
    function move(e){ if(!isDrag)return; panel.style.left=(e.clientX-offsetX)+'px'; panel.style.top=(e.clientY-offsetY)+'px'; panel.style.right='auto'; }
    function stop(){ isDrag=false; document.removeEventListener('mousemove',move); document.removeEventListener('mouseup',stop); }

    // 按钮
    document.getElementById('ixfill-parse').addEventListener('click',()=>{
      clearLog();
      const txt=document.getElementById('ixfill-input').value;
      const parsed=parsePassportsFromText(txt);
      logToConsole('解析到',parsed.length,'项');
      parsed.forEach((p,i)=>{
        logToConsole(
          `第${i+1}位 -> 姓:${p.surname}, 名:${p.givenName}, 性别:${p.gender}, 出生日期:${p.birthdate}, ` +
          `国籍:${p.nationalityFull}, 签发国:${p.issuingCountryFull}, 护照号:${p.passportNumber}, 有效期:${p.expirationDate}`
        );
      });
    });

    document.getElementById('ixfill-detect').addEventListener('click',()=>{
      const cards=findGuestCards();
      logToConsole('检测到Adult容器数量：',cards.length);
    });

    document.getElementById('ixfill-fill-all').addEventListener('click',fillAllPassengers);

    document.getElementById('ixfill-fill-first').addEventListener('click',async()=>{
      const txt=document.getElementById('ixfill-input').value;
      const arr=parsePassportsFromText(txt);
      const cards=findGuestCards();
      // 填写第一位乘客
      if (cards.length&&arr.length) await fillPassengerCard(cards[0],arr[0],0);
    });

    document.getElementById('ixfill-clear-log').addEventListener('click',clearLog);

    // 自动解析（输入或失焦时）
    const inputArea=document.getElementById('ixfill-input');
    ['input','blur'].forEach(ev=>{
      inputArea.addEventListener(ev,()=>{
        const parsed=parsePassportsFromText(inputArea.value);
        logToConsole(`自动解析: ${parsed.length} 条`);
      });
    });
  }

  async function waitForGuestDetail() {
    return new Promise(resolve => {
      if (document.getElementById('guest_detail')) { resolve(); return; }
      const o = new MutationObserver(()=> { if (document.getElementById('guest_detail')) { o.disconnect(); resolve(); } });
      o.observe(document.body, { childList:true, subtree:true });
    });
  }

  (async function () {
    logToConsole('IX脚本加载，等待 #guest_detail ...');
    await waitForGuestDetail();
    logToConsole('检测到 #guest_detail，注入面板');
    injectPanel();
  })();

})();
