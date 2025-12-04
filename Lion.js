// ==UserScript==
// @name         Lion Air 自动填充护照与联系信息
// @namespace    https://example.com/
// @version      1.0
// @description  在 Lion Air 乘客页自动填写护照和联系信息（SSR DOCS 粘贴解析）
// @author       悦美华
// @match        https://agent.lionair.co.id/*
// @updateURL    https://raw.githubusercontent.com/tryle17/yuemeihua-scripts/main/Lion.js
// @downloadURL  https://raw.githubusercontent.com/tryle17/yuemeihua-scripts/main/Lion.js
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
    'use strict';
  
    /**************** 基本配置 ****************/
    const passportsDataVarName = 'lionPassportsData';
    window[passportsDataVarName] = [];
  
    const DEFAULT_EMAIL = 'yuemeihuafly@163.com';
    const DEFAULT_MOBILE_CODE = '+86';
    const DEFAULT_MOBILE_NUMBER = '18610429740';
  
    const ORIGIN_AREA_CODE = '0062';
    const ORIGIN_PHONE_NUMBER = '8116880904';
  
    const defaultInput = ``;
  
    // 三字代码 -> 二字代码 & 英文国名（完整内嵌 country_codes_mapping.json）
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
      console.log('[LionFill]', ...args);
      appendLog(args.join(' '));
    }
  
    function sleep(ms) {
      return new Promise(r => setTimeout(r, ms));
    }
  
    function appendLog(text) {
      const area = document.getElementById('lionfill-log-area');
      if (!area) return;
      const now = new Date().toLocaleTimeString();
      area.value += `[${now}] ${text}\n`;
      area.scrollTop = area.scrollHeight;
    }
  
    function clearLog() {
      const area = document.getElementById('lionfill-log-area');
      if (area) area.value = '';
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
  
    function setSelectByValue(select, value) {
      if (!select) return;
      const opts = Array.from(select.options);
      const target = opts.find(o => (o.value || '').toUpperCase() === String(value).toUpperCase());
      if (target) {
        select.value = target.value;
        select.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
  
    function threeToTwoCountry(code) {
      if (!code) return '';
      const c = code.trim().toUpperCase();
      if (c.length === 2) return c;
      const m = COUNTRY_CODES_MAP[c];
      return m ? m.two_letter : '';
    }
  
    // 解析 SSR 日期（专门针对 29SEP70 这种）
    function parseSSRDateParts(s) {
      if (!s) return { day: '', monStr: '', year: '' };
      s = s.trim().toUpperCase();
      const m = s.match(/^(\d{1,2})([A-Z]{3})(\d{2,4})$/);
      if (!m) return { day: '', monStr: '', year: '' };
      const day = m[1].padStart(2, '0');
      const monStr = m[2];
      const yearRaw = m[3];
      let year;
      if (yearRaw.length === 2) {
        const n = parseInt(yearRaw, 10);
        year = n > 50 ? (1900 + n) : (2000 + n); // 和 S7 一致的逻辑
      } else {
        year = parseInt(yearRaw, 10);
      }
      return { day, monStr, year: String(year) };
    }
  
    function monthSSRToLion(monStr) {
      const map = {
        JAN: 'Jan', FEB: 'Feb', MAR: 'Mar', APR: 'Apr', MAY: 'May', JUN: 'Jun',
        JUL: 'Jul', AUG: 'Aug', SEP: 'Sep', OCT: 'Oct', NOV: 'Nov', DEC: 'Dec'
      };
      return map[monStr.toUpperCase()] || 'Jan';
    }
  
    /**************** SSR 解析 ****************/
    function parseSSRLine(line) {
      const out = {
        raw: line,
        issuingCountry: '',
        issuingCountry2: '',
        passportNumber: '',
        nationality: '',
        nationality2: '',
        birthdateRaw: '',
        birth: { day: '', mon: '', year: '' },
        gender: '',
        expirationRaw: '',
        expiry: { day: '', mon: '', year: '' },
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
        const parts = after.split('/').map(p => p.trim());
        if (parts.length < 6) throw new Error('字段不足');
  
        out.issuingCountry = (parts[0] || '').toUpperCase();
        out.passportNumber = (parts[1] || '').trim();
        out.nationality = (parts[2] || '').toUpperCase();
        out.birthdateRaw = parts[3] || '';
        out.gender = (parts[4] || '').toUpperCase().substr(0, 1);
        out.expirationRaw = parts[5] || '';
  
        const birth = parseSSRDateParts(out.birthdateRaw);
        const exp = parseSSRDateParts(out.expirationRaw);
        out.birth = { day: birth.day, mon: monthSSRToLion(birth.monStr), year: birth.year };
        out.expiry = { day: exp.day, mon: monthSSRToLion(exp.monStr), year: exp.year };
  
        const rest = parts.slice(6).filter(Boolean);
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
  
        out.nationality2 = threeToTwoCountry(out.nationality);
        out.issuingCountry2 = threeToTwoCountry(out.issuingCountry);
  
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
            results.push(parsed);
          }
        }
      }
      window[passportsDataVarName] = results;
      return results;
    }
  
    /**************** Lion Air 具体填充逻辑 ****************/
    function getPassengerRowCount() {
      const table = document.getElementById('PassengerTable');
      if (!table) return 0;
      const rows = table.querySelectorAll('tbody > tr');
      return rows.length;
    }
  
    function getNameBlockPrefix(index1) {
      // index1: 从 1 开始
      return 'NameBlock' + index1;
    }
  
    async function fillSinglePassenger(index0, data) {
      const i1 = index0 + 1;
      const prefix = getNameBlockPrefix(i1);
      logToConsole(`开始填写第 ${i1} 位乘客 (${prefix})`);
  
      // 1. 称谓（Title）: 男用 Mr，女用 Ms
      try {
        const titleSelect = document.getElementById(prefix + '_ddlTitle');
        if (titleSelect) {
          const gender = data.gender === 'M' ? 'Mr' : 'Ms';
          setSelectByValue(titleSelect, gender);
          logToConsole('已设置称谓为:', gender);
        } else {
          logToConsole('未找到称谓下拉:', prefix + '_ddlTitle');
        }
      } catch (e) {
        logToConsole('设置称谓异常', e);
      }
  
      // 2. 名 FirstName
      try {
        const firstInput = document.getElementById(prefix + '_txtFirstName');
        if (firstInput && data.givenName) {
          setInputValue(firstInput, data.givenName);
          logToConsole('已设置名:', data.givenName);
        } else {
          logToConsole('未找到名输入框或数据为空');
        }
      } catch (e) {
        logToConsole('设置名异常', e);
      }
  
      // 3. 姓 LastName
      try {
        const lastInput = document.getElementById(prefix + '_txtLastName');
        if (lastInput && data.surname) {
          setInputValue(lastInput, data.surname);
          logToConsole('已设置姓:', data.surname);
        } else {
          logToConsole('未找到姓输入框或数据为空');
        }
      } catch (e) {
        logToConsole('设置姓异常', e);
      }
  
      // 4. 性别
      try {
        const genderSelect = document.getElementById(prefix + '_ddlGender');
        if (genderSelect && data.gender) {
          setSelectByValue(genderSelect, data.gender === 'M' ? 'M' : 'F');
          logToConsole('已设置性别:', data.gender);
        } else {
          logToConsole('未找到性别下拉或数据为空');
        }
      } catch (e) {
        logToConsole('设置性别异常', e);
      }
  
      // 5. 出生日期（3个下拉）
      try {
        const daySel = document.getElementById(prefix + '_ddlDOBDay');
        const monSel = document.getElementById(prefix + '_ddlDOBMonth');
        const yearSel = document.getElementById(prefix + '_ddlDOBYear');
        const b = data.birth;
        if (daySel && monSel && yearSel && b.day && b.mon && b.year) {
          setSelectByValue(daySel, b.day);
          setSelectByValue(monSel, b.mon);
          setSelectByValue(yearSel, b.year);
          logToConsole('已设置出生日期:', `${b.day}-${b.mon}-${b.year}`);
        } else {
          logToConsole('未找到出生日期下拉或数据缺失');
        }
      } catch (e) {
        logToConsole('设置出生日期异常', e);
      }
  
      // 6. 护照号
      try {
        const passInput = document.getElementById(prefix + '_txtPassportNumber');
        if (passInput && data.passportNumber) {
          setInputValue(passInput, data.passportNumber);
          logToConsole('已设置护照号:', data.passportNumber);
        } else {
          logToConsole('未找到护照号输入框或数据为空');
        }
      } catch (e) {
        logToConsole('设置护照号异常', e);
      }
  
      // 7. 护照有效期（3个下拉）
      try {
        const expDaySel = document.getElementById(prefix + '_ddlPassportExpDay');
        const expMonSel = document.getElementById(prefix + '_ddlPassportExpMon');
        const expYearSel = document.getElementById(prefix + '_ddlPassportExpYear');
        const ex = data.expiry;
        if (expDaySel && expMonSel && expYearSel && ex.day && ex.mon && ex.year) {
          setSelectByValue(expDaySel, ex.day);
          setSelectByValue(expMonSel, ex.mon);
          setSelectByValue(expYearSel, ex.year);
          logToConsole('已设置护照有效期:', `${ex.day}-${ex.mon}-${ex.year}`);
        } else {
          logToConsole('未找到护照有效期下拉或数据缺失');
        }
      } catch (e) {
        logToConsole('设置护照有效期异常', e);
      }
  
      // 8. 签发国家
      try {
        const issuingTwo = data.issuingCountry2 || data.issuingCountry;
        let docCountrySelect =
          document.getElementById('NameBlock' + i1 + '_ddlDocCountry') ||
          document.getElementById('NameBlock2_ddlDocCountry');
        if (docCountrySelect && issuingTwo) {
          setSelectByValue(docCountrySelect, issuingTwo);
          logToConsole('已设置签发国家 (2字码):', issuingTwo);
        } else {
          logToConsole('未找到签发国家下拉或国家码缺失');
        }
      } catch (e) {
        logToConsole('设置签发国家异常', e);
      }
  
      // 9. 国籍
      try {
        const natTwo = data.nationality2 || data.nationality;
        const natSelect = document.getElementById(prefix + '_ddlPaxCountry');
        if (natSelect && natTwo) {
          setSelectByValue(natSelect, natTwo);
          logToConsole('已设置国籍 (2字码):', natTwo);
        } else {
          logToConsole('未找到国籍下拉或国家码缺失');
        }
      } catch (e) {
        logToConsole('设置国籍异常', e);
      }
  
      logToConsole(`第 ${i1} 位乘客填写完成`);
    }
  
    async function fillAllPassengersLion() {
      const cnt = getPassengerRowCount();
      const passports = window[passportsDataVarName] || [];
      logToConsole(`PassengerTable 行数: ${cnt}，解析到护照 ${passports.length} 条`);
  
      const fillCount = Math.min(cnt, passports.length);
      if (!fillCount) {
        logToConsole('无可匹配乘客/护照信息，跳过乘客自动填充');
        return;
      }
  
      for (let i = 0; i < fillCount; i++) {
        await fillSinglePassenger(i, passports[i]);
        await sleep(200);
      }
  
      await fillGlobalContactFromFirst(passports[0]);
    }
  
    async function fillFirstPassengerOnlyLion() {
      const cnt = getPassengerRowCount();
      const passports = window[passportsDataVarName] || [];
      if (!cnt || !passports.length) {
        logToConsole('未找到乘客行或护照信息为空，无法填写第一位');
        return;
      }
      await fillSinglePassenger(0, passports[0]);
      await fillGlobalContactFromFirst(passports[0]);
    }
  
    // 全局联系信息 & 个人信息
    async function fillGlobalContactFromFirst(firstData) {
      logToConsole('开始填写个人信息和联系信息（全局）');
      try {
        if (firstData) {
          // 个人称呼
          try {
            const contactTitle = document.getElementById('ContactTitle');
            if (contactTitle) {
              const gender = firstData.gender === 'M' ? 'Mr' : 'Ms';
              setSelectByValue(contactTitle, gender);
              logToConsole('已设置联系人称呼:', gender);
            }
          } catch (e) {
            logToConsole('设置联系人称呼异常', e);
          }
  
          // 个人名
          try {
            const cFirst = document.getElementById('ContactFirstName');
            if (cFirst && firstData.givenName) {
              setInputValue(cFirst, firstData.givenName);
              logToConsole('已设置联系人名:', firstData.givenName);
            }
          } catch (e) {
            logToConsole('设置联系人名异常', e);
          }
  
          // 个人姓
          try {
            const cLast = document.getElementById('ContactLastName');
            if (cLast && firstData.surname) {
              setInputValue(cLast, firstData.surname);
              logToConsole('已设置联系人姓:', firstData.surname);
            }
          } catch (e) {
            logToConsole('设置联系人姓异常', e);
          }
        }
  
        // 手机号国际区号 & 手机号
        try {
          const mobileCodeSelect = document.getElementById('ddlCountryCode3');
          if (mobileCodeSelect) {
            const opts = Array.from(mobileCodeSelect.options);
            const target = opts.find(o => {
              const val = (o.value || '').trim();
              const txt = (o.textContent || '').toLowerCase();
              return val === DEFAULT_MOBILE_CODE ||
                txt.includes(DEFAULT_MOBILE_CODE.toLowerCase()) ||
                txt.includes('china');
            });
            if (target) {
              mobileCodeSelect.value = target.value;
              mobileCodeSelect.dispatchEvent(new Event('change', { bubbles: true }));
              logToConsole('已设置手机区号为:', target.value);
            } else {
              logToConsole('未在手机区号下拉中找到 +86');
            }
          } else {
            logToConsole('未找到手机区号下拉 ddlCountryCode3');
          }
  
          const mobileInput = document.getElementById('txtPhoneNumber3');
          if (mobileInput) {
            setInputValue(mobileInput, DEFAULT_MOBILE_NUMBER);
            logToConsole('已填写手机号:', DEFAULT_MOBILE_NUMBER);
          } else {
            logToConsole('未找到手机号输入框 txtPhoneNumber3');
          }
        } catch (e) {
          logToConsole('设置手机号相关异常', e);
        }
  
        // 原籍手机号（国际区号不变，只填区号和号码）
        try {
          const areaInput = document.getElementById('txtAreaCode1');
          const phoneInput = document.getElementById('txtPhoneNumber1');
          if (areaInput) {
            setInputValue(areaInput, ORIGIN_AREA_CODE);
            logToConsole('已填写原籍区号:', ORIGIN_AREA_CODE);
          }
          if (phoneInput) {
            setInputValue(phoneInput, ORIGIN_PHONE_NUMBER);
            logToConsole('已填写原籍手机号:', ORIGIN_PHONE_NUMBER);
          }
        } catch (e) {
          logToConsole('设置原籍手机号异常', e);
        }
  
        // 邮箱
        try {
          const emailInput = document.getElementById('txtEmailAddress2');
          if (emailInput) {
            setInputValue(emailInput, DEFAULT_EMAIL);
            logToConsole('已填写邮箱:', DEFAULT_EMAIL);
          } else {
            logToConsole('未找到邮箱输入框 txtEmailAddress2');
          }
        } catch (e) {
          logToConsole('设置邮箱异常', e);
        }
  
      } catch (e) {
        logToConsole('填写全局联系信息异常', e);
      }
      logToConsole('全局个人/联系信息填写完成');
    }
  
    /**************** 控制面板 UI（复用 S7 风格，前缀 lionfill-） ****************/
    function injectPanelLion() {
      if (document.getElementById('lionfill-panel')) return;
      const panel = document.createElement('div');
      panel.id = 'lionfill-panel';
      panel.style.cssText = `
        position:fixed;right:12px;top:80px;width:460px;z-index:999999;
        background:white;border:1px solid #ccc;box-shadow:0 6px 18px rgba(0,0,0,.12);
        border-radius:8px;font-family:Arial,sans-serif;font-size:13px;
      `;
      panel.innerHTML = `
        <div id="lionfill-header" style="cursor:move;padding:6px 10px;background:#ff4b2b;color:#fff;border-radius:8px 8px 0 0;display:flex;justify-content:space-between;align-items:center;position:relative;">
          <span>Lion Air 护照自动填写&nbsp;&nbsp;悦美华</span>
          <button id="lionfill-min" style="background:transparent;border:none;color:#fff;font-size:14px;cursor:pointer;
          position:absolute;right:10px;top:50%;transform:translateY(-50%);padding:2px 6px;width:auto;min-width:20px;">—</button>
        </div>
        <div id="lionfill-body" style="padding:8px;">
          <textarea id="lionfill-input" style="width:100%;height:120px;font-size:12px;
                    border:1px solid #ddd;border-radius:4px;padding:6px;box-sizing:border-box;"
                    placeholder="在此粘贴 SSR DOCS 行，例如：SSR DOCS FJ HK1 P/VNM/E02689666/VNM/29SEP70/F/08OCT34/LUONG/THI AN/P1">${defaultInput}</textarea>
          <div style="margin:8px 0;display:flex;justify-content:space-between;gap:6px;">
            <button id="lionfill-parse" style="flex:1;padding:6px;border:1px solid #ddd;border-radius:4px;
                    background:#f5f5f5;cursor:pointer;">解析</button>
            <button id="lionfill-detect" style="flex:1;padding:6px;border:1px solid #ddd;border-radius:4px;
                    background:#f5f5f5;cursor:pointer;">检测旅客数</button>
            <button id="lionfill-fill-all" style="flex:1;padding:6px;border:1px solid #ff4b2b;border-radius:4px;
                    background:#ff4b2b;color:white;cursor:pointer;">填写全部</button>
          </div>
          <div style="margin:8px 0;display:flex;justify-content:center;gap:6px;">
            <button id="lionfill-fill-first" style="flex:1;max-width:200px;padding:6px;border:1px solid #ddd;
                    border-radius:4px;background:#f5f5f5;cursor:pointer;">填写第1位+联系信息</button>
            <button id="lionfill-clear-log" style="flex:1;max-width:200px;padding:6px;border:1px solid #ddd;
                    border-radius:4px;background:#f5f5f5;cursor:pointer;">清日志</button>
          </div>
          <textarea id="lionfill-log-area" style="width:100%;height:140px;font-size:12px;
                    border:1px solid #ddd;border-radius:4px;padding:6px;box-sizing:border-box;"
                    readonly placeholder="日志信息..."></textarea>
        </div>
      `;
      document.body.appendChild(panel);
  
      // 最小化
      document.getElementById('lionfill-min').addEventListener('click', () => {
        const body = document.getElementById('lionfill-body');
        body.style.display = body.style.display === 'none' ? 'block' : 'none';
      });
  
      // 拖动
      const header = document.getElementById('lionfill-header');
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
      document.getElementById('lionfill-parse').addEventListener('click', () => {
        clearLog();
        const txt = document.getElementById('lionfill-input').value;
        const parsed = parsePassportsFromText(txt);
        logToConsole('解析到', parsed.length, '条护照信息');
        parsed.forEach((p, i) => {
          logToConsole(
            `第${i + 1}位 -> 姓:${p.surname}, 名:${p.givenName}, 性别:${p.gender}, 出生:${p.birthdateRaw}, ` +
            `国籍(3字):${p.nationality}, 国籍(2字):${p.nationality2}, 护照号:${p.passportNumber}, 有效期:${p.expirationRaw}, P号:${p.passengerIndex}`
          );
        });
      });
  
      document.getElementById('lionfill-detect').addEventListener('click', () => {
        const cnt = getPassengerRowCount();
        logToConsole('PassengerTable 乘客行数：', cnt);
      });
  
      document.getElementById('lionfill-fill-all').addEventListener('click', fillAllPassengersLion);
      document.getElementById('lionfill-fill-first').addEventListener('click', fillFirstPassengerOnlyLion);
      document.getElementById('lionfill-clear-log').addEventListener('click', clearLog);
  
      // 输入框自动解析
      const inputArea = document.getElementById('lionfill-input');
      ['input', 'blur'].forEach(ev => {
        inputArea.addEventListener(ev, () => {
          const parsed = parsePassportsFromText(inputArea.value);
          logToConsole(`自动解析：${parsed.length} 条`);
        });
      });
    }
  
    /**************** 监听 PassengerTable，自动弹出面板 ****************/
    function waitForPassengerTable() {
      return new Promise(resolve => {
        if (document.getElementById('PassengerTable')) {
          resolve();
          return;
        }
        const observer = new MutationObserver(() => {
          if (document.getElementById('PassengerTable')) {
            observer.disconnect();
            resolve();
          }
        });
        observer.observe(document.body, { childList: true, subtree: true });
      });
    }
  
    (async function main() {
      console.log('[LionFill] 脚本已加载，等待 PassengerTable ...');
      await waitForPassengerTable();
      console.log('[LionFill] 检测到 PassengerTable，注入 Lion 控制面板');
      injectPanelLion();
    })();
  
  })();