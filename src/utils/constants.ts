/**
 * Centralized constants for countries, currencies, country codes, and flag mappings
 * This file consolidates all static definitions that were previously duplicated across multiple files
 */

// =============================================================================
// COUNTRIES
// =============================================================================

/**
 * Comprehensive list of countries used throughout the application
 * Sorted alphabetically for consistency
 */
export const COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Argentina", "Australia", "Austria",
  "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize",
  "Bermuda", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Bulgaria",
  "Cambodia", "Canada", "Chile", "China", "Colombia", "Costa Rica", "Croatia",
  "Cuba", "Cyprus", "Czech Republic", "Denmark", "Dominican Republic", "Ecuador",
  "Egypt", "El Salvador", "Estonia", "Ethiopia", "Finland", "France", "French Guiana",
  "Germany", "Ghana", "Greece", "Guatemala", "Guyana", "Haiti", "Honduras",
  "Hong Kong", "Hungary", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel",
  "Italy", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kuwait",
  "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Libya", "Lithuania", "Luxembourg",
  "Malaysia", "Malta", "Mexico", "Moldova", "Mongolia", "Montenegro", "Morocco",
  "Myanmar", "Namibia", "Nepal", "Netherlands", "Nicaragua", "Nigeria", "North Macedonia",
  "Norway", "Oman", "Pakistan", "Panama", "Paraguay", "Peru", "Philippines", "Poland",
  "Portugal", "Puerto Rico", "Qatar", "Romania", "Russia", "Rwanda", "Saudi Arabia",
  "Serbia", "Singapore", "Slovakia", "Slovenia", "South Africa", "South Korea",
  "Spain", "Sri Lanka", "Suriname", "Sweden", "Switzerland", "Syria", "Taiwan",
  "Tajikistan", "Tanzania", "Thailand", "Trinidad and Tobago", "Tunisia", "Turkey",
  "Turkmenistan", "UAE", "Uganda", "Ukraine", "United Kingdom", "United States",
  "Uruguay", "Uzbekistan", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"
].sort();

// =============================================================================
// COUNTRY CODES (Phone Codes)
// =============================================================================

/**
 * Country phone codes with their corresponding country abbreviations and flag codes
 * Used for phone number input fields throughout the application
 */
export const COUNTRY_CODES = [
  { code: "+1", country: "US/CA", flagCode: "US" },
  { code: "+7", country: "RU", flagCode: "RU" },
  { code: "+20", country: "EG", flagCode: "EG" },
  { code: "+27", country: "ZA", flagCode: "ZA" },
  { code: "+30", country: "GR", flagCode: "GR" },
  { code: "+31", country: "NL", flagCode: "NL" },
  { code: "+32", country: "BE", flagCode: "BE" },
  { code: "+33", country: "FR", flagCode: "FR" },
  { code: "+34", country: "ES", flagCode: "ES" },
  { code: "+36", country: "HU", flagCode: "HU" },
  { code: "+39", country: "IT", flagCode: "IT" },
  { code: "+40", country: "RO", flagCode: "RO" },
  { code: "+41", country: "CH", flagCode: "CH" },
  { code: "+43", country: "AT", flagCode: "AT" },
  { code: "+44", country: "UK", flagCode: "GB" },
  { code: "+45", country: "DK", flagCode: "DK" },
  { code: "+46", country: "SE", flagCode: "SE" },
  { code: "+47", country: "NO", flagCode: "NO" },
  { code: "+48", country: "PL", flagCode: "PL" },
  { code: "+49", country: "DE", flagCode: "DE" },
  { code: "+52", country: "MX", flagCode: "MX" },
  { code: "+54", country: "AR", flagCode: "AR" },
  { code: "+55", country: "BR", flagCode: "BR" },
  { code: "+56", country: "CL", flagCode: "CL" },
  { code: "+57", country: "CO", flagCode: "CO" },
  { code: "+60", country: "MY", flagCode: "MY" },
  { code: "+61", country: "AU", flagCode: "AU" },
  { code: "+62", country: "ID", flagCode: "ID" },
  { code: "+63", country: "PH", flagCode: "PH" },
  { code: "+65", country: "SG", flagCode: "SG" },
  { code: "+66", country: "TH", flagCode: "TH" },
  { code: "+81", country: "JP", flagCode: "JP" },
  { code: "+82", country: "KR", flagCode: "KR" },
  { code: "+84", country: "VN", flagCode: "VN" },
  { code: "+86", country: "CN", flagCode: "CN" },
  { code: "+90", country: "TR", flagCode: "TR" },
  { code: "+91", country: "IN", flagCode: "IN" },
  { code: "+92", country: "PK", flagCode: "PK" },
  { code: "+234", country: "NG", flagCode: "NG" },
  { code: "+351", country: "PT", flagCode: "PT" },
  { code: "+353", country: "IE", flagCode: "IE" },
  { code: "+358", country: "FI", flagCode: "FI" },
  { code: "+359", country: "BG", flagCode: "BG" },
  { code: "+370", country: "LT", flagCode: "LT" },
  { code: "+371", country: "LV", flagCode: "LV" },
  { code: "+372", country: "EE", flagCode: "EE" },
  { code: "+380", country: "UA", flagCode: "UA" },
  { code: "+381", country: "RS", flagCode: "RS" },
  { code: "+385", country: "HR", flagCode: "HR" },
  { code: "+386", country: "SI", flagCode: "SI" },
  { code: "+420", country: "CZ", flagCode: "CZ" },
  { code: "+421", country: "SK", flagCode: "SK" },
  { code: "+852", country: "HK", flagCode: "HK" },
  { code: "+966", country: "SA", flagCode: "SA" },
  { code: "+971", country: "AE", flagCode: "AE" }
];

// =============================================================================
// CURRENCIES
// =============================================================================

/**
 * Common currencies with their details including symbols and flag codes
 * Used for currency selection throughout the application
 */
export const CURRENCIES = [
  { code: "USD", name: "US Dollar", symbol: "$", flagCode: "US" },
  { code: "EUR", name: "Euro", symbol: "€", flagCode: "EU" },
  { code: "GBP", name: "British Pound", symbol: "£", flagCode: "GB" },
  { code: "CAD", name: "Canadian Dollar", symbol: "C$", flagCode: "CA" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$", flagCode: "AU" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥", flagCode: "JP" },
  { code: "CHF", name: "Swiss Franc", symbol: "CHF", flagCode: "CH" },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥", flagCode: "CN" },
  { code: "INR", name: "Indian Rupee", symbol: "₹", flagCode: "IN" },
  { code: "BRL", name: "Brazilian Real", symbol: "R$", flagCode: "BR" },
  { code: "MXN", name: "Mexican Peso", symbol: "MX$", flagCode: "MX" },
  { code: "ZAR", name: "South African Rand", symbol: "R", flagCode: "ZA" },
  { code: "SGD", name: "Singapore Dollar", symbol: "S$", flagCode: "SG" },
  { code: "HKD", name: "Hong Kong Dollar", symbol: "HK$", flagCode: "HK" },
  { code: "NZD", name: "New Zealand Dollar", symbol: "NZ$", flagCode: "NZ" },
  { code: "SEK", name: "Swedish Krona", symbol: "kr", flagCode: "SE" },
  { code: "NOK", name: "Norwegian Krone", symbol: "kr", flagCode: "NO" },
  { code: "DKK", name: "Danish Krone", symbol: "kr", flagCode: "DK" },
  { code: "PLN", name: "Polish Zloty", symbol: "zł", flagCode: "PL" },
  { code: "CZK", name: "Czech Koruna", symbol: "Kč", flagCode: "CZ" },
  { code: "HUF", name: "Hungarian Forint", symbol: "Ft", flagCode: "HU" },
  { code: "RUB", name: "Russian Ruble", symbol: "₽", flagCode: "RU" },
  { code: "TRY", name: "Turkish Lira", symbol: "₺", flagCode: "TR" },
  { code: "AED", name: "UAE Dirham", symbol: "د.إ", flagCode: "AE" },
  { code: "SAR", name: "Saudi Riyal", symbol: "﷼", flagCode: "SA" },
  { code: "QAR", name: "Qatari Riyal", symbol: "ر.ق", flagCode: "QA" },
  { code: "KWD", name: "Kuwaiti Dinar", symbol: "د.ك", flagCode: "KW" },
  { code: "BHD", name: "Bahraini Dinar", symbol: ".د.ب", flagCode: "BH" },
  { code: "OMR", name: "Omani Rial", symbol: "ر.ع.", flagCode: "OM" },
  { code: "JOD", name: "Jordanian Dinar", symbol: "د.ا", flagCode: "JO" },
  { code: "EGP", name: "Egyptian Pound", symbol: "£", flagCode: "EG" },
  { code: "NGN", name: "Nigerian Naira", symbol: "₦", flagCode: "NG" },
  { code: "KRW", name: "South Korean Won", symbol: "₩", flagCode: "KR" },
  { code: "THB", name: "Thai Baht", symbol: "฿", flagCode: "TH" },
  { code: "MYR", name: "Malaysian Ringgit", symbol: "RM", flagCode: "MY" },
  { code: "IDR", name: "Indonesian Rupiah", symbol: "Rp", flagCode: "ID" },
  { code: "PHP", name: "Philippine Peso", symbol: "₱", flagCode: "PH" },
  { code: "VND", name: "Vietnamese Dong", symbol: "₫", flagCode: "VN" }
];

/**
 * System currencies (limited set for admin/system settings)
 * Used in Settings page for system currency selection
 */
export const SYSTEM_CURRENCIES = [
  { code: "USD", name: "US Dollar", symbol: "$", flagCode: "US" },
  { code: "EUR", name: "Euro", symbol: "€", flagCode: "EU" },
  { code: "GBP", name: "British Pound", symbol: "£", flagCode: "GB" }
];

// =============================================================================
// COUNTRY NAME TO FLAG CODE MAPPING
// =============================================================================

/**
 * Mapping from full country names to their corresponding ISO country codes for flags
 * Used to display flags next to country names in dropdowns and forms
 */
export const COUNTRY_NAME_TO_FLAG_CODE: { [key: string]: string } = {
  "Afghanistan": "AF",
  "Albania": "AL",
  "Algeria": "DZ",
  "Argentina": "AR",
  "Australia": "AU",
  "Austria": "AT",
  "Bahamas": "BS",
  "Bahrain": "BH",
  "Bangladesh": "BD",
  "Barbados": "BB",
  "Belarus": "BY",
  "Belgium": "BE",
  "Belize": "BZ",
  "Bermuda": "BM",
  "Bolivia": "BO",
  "Bosnia and Herzegovina": "BA",
  "Botswana": "BW",
  "Brazil": "BR",
  "Bulgaria": "BG",
  "Cambodia": "KH",
  "Canada": "CA",
  "Chile": "CL",
  "China": "CN",
  "Colombia": "CO",
  "Costa Rica": "CR",
  "Croatia": "HR",
  "Cuba": "CU",
  "Cyprus": "CY",
  "Czech Republic": "CZ",
  "Denmark": "DK",
  "Dominican Republic": "DO",
  "Ecuador": "EC",
  "Egypt": "EG",
  "El Salvador": "SV",
  "Estonia": "EE",
  "Ethiopia": "ET",
  "Finland": "FI",
  "France": "FR",
  "French Guiana": "GF",
  "Germany": "DE",
  "Ghana": "GH",
  "Greece": "GR",
  "Guatemala": "GT",
  "Guyana": "GY",
  "Haiti": "HT",
  "Honduras": "HN",
  "Hong Kong": "HK",
  "Hungary": "HU",
  "India": "IN",
  "Indonesia": "ID",
  "Iran": "IR",
  "Iraq": "IQ",
  "Ireland": "IE",
  "Israel": "IL",
  "Italy": "IT",
  "Jamaica": "JM",
  "Japan": "JP",
  "Jordan": "JO",
  "Kazakhstan": "KZ",
  "Kenya": "KE",
  "Kuwait": "KW",
  "Kyrgyzstan": "KG",
  "Laos": "LA",
  "Latvia": "LV",
  "Lebanon": "LB",
  "Libya": "LY",
  "Lithuania": "LT",
  "Luxembourg": "LU",
  "Malaysia": "MY",
  "Malta": "MT",
  "Mexico": "MX",
  "Moldova": "MD",
  "Mongolia": "MN",
  "Montenegro": "ME",
  "Morocco": "MA",
  "Myanmar": "MM",
  "Namibia": "NA",
  "Nepal": "NP",
  "Netherlands": "NL",
  "Nicaragua": "NI",
  "Nigeria": "NG",
  "North Macedonia": "MK",
  "Norway": "NO",
  "Oman": "OM",
  "Pakistan": "PK",
  "Panama": "PA",
  "Paraguay": "PY",
  "Peru": "PE",
  "Philippines": "PH",
  "Poland": "PL",
  "Portugal": "PT",
  "Puerto Rico": "PR",
  "Qatar": "QA",
  "Romania": "RO",
  "Russia": "RU",
  "Rwanda": "RW",
  "Saudi Arabia": "SA",
  "Serbia": "RS",
  "Singapore": "SG",
  "Slovakia": "SK",
  "Slovenia": "SI",
  "South Africa": "ZA",
  "South Korea": "KR",
  "Spain": "ES",
  "Sri Lanka": "LK",
  "Suriname": "SR",
  "Sweden": "SE",
  "Switzerland": "CH",
  "Syria": "SY",
  "Taiwan": "TW",
  "Tajikistan": "TJ",
  "Tanzania": "TZ",
  "Thailand": "TH",
  "Trinidad and Tobago": "TT",
  "Tunisia": "TN",
  "Turkey": "TR",
  "Turkmenistan": "TM",
  "UAE": "AE",
  "United Arab Emirates": "AE",
  "Uganda": "UG",
  "Ukraine": "UA",
  "United Kingdom": "GB",
  "United States": "US",
  "Uruguay": "UY",
  "Uzbekistan": "UZ",
  "Venezuela": "VE",
  "Vietnam": "VN",
  "Yemen": "YE",
  "Zambia": "ZM",
  "Zimbabwe": "ZW"
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get the flag code for a country name
 * @param countryName - The full country name
 * @returns The ISO country code for the flag, defaults to "US" if not found
 */
export const getCountryFlagCode = (countryName: string): string => {
  return COUNTRY_NAME_TO_FLAG_CODE[countryName] || "US";
};

/**
 * Find currency by code
 * @param code - The currency code (e.g., "USD", "EUR")
 * @returns The currency object or undefined if not found
 */
export const getCurrencyByCode = (code: string) => {
  return CURRENCIES.find(currency => currency.code === code);
};

/**
 * Find country code by phone code
 * @param phoneCode - The phone code (e.g., "+1", "+44")
 * @returns The country code object or undefined if not found
 */
export const getCountryCodeByPhone = (phoneCode: string) => {
  return COUNTRY_CODES.find(cc => cc.code === phoneCode);
};

// =============================================================================
// ADDITIONAL CONSTANTS
// =============================================================================

/**
 * Font options for opt-in pages
 * Used in OptInPages customization
 */
export const FONT_OPTIONS = [
  { value: "Inter", label: "Inter", cssName: "'Inter', sans-serif" },
  { value: "Roboto", label: "Roboto", cssName: "'Roboto', sans-serif" },
  { value: "Open Sans", label: "Open Sans", cssName: "'Open Sans', sans-serif" },
  { value: "Lato", label: "Lato", cssName: "'Lato', sans-serif" },
  { value: "Montserrat", label: "Montserrat", cssName: "'Montserrat', sans-serif" },
  { value: "Poppins", label: "Poppins", cssName: "'Poppins', sans-serif" },
  { value: "Source Sans Pro", label: "Source Sans Pro", cssName: "'Source Sans Pro', sans-serif" },
  { value: "Nunito", label: "Nunito", cssName: "'Nunito', sans-serif" },
  { value: "Raleway", label: "Raleway", cssName: "'Raleway', sans-serif" },
  { value: "Ubuntu", label: "Ubuntu", cssName: "'Ubuntu', sans-serif" }
];

/**
 * Custom event names for tracking
 * Used in SubmissionEditModal and Connections
 */
export const CUSTOM_EVENT_NAMES = [
  "Purchase",
  "Lead", 
  "Deposit",
  // Additional event names can be added here as needed
  // "CompleteRegistration",
  // "AddToCart",
  // "ViewContent",
  // "InitiateCheckout",
  // "AddPaymentInfo",
  // "Subscribe"
];

/**
 * Commission tiers
 * Used in SubmissionEditModal
 */
export const COMMISSION_TIERS = [
  "1",
  "2", 
  "3",
  "4",
  "5",
  "VIP",
  "Premium",
  "Standard",
  "Basic"
];
