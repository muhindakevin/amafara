import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// All 50 languages
const languages = [
  { code: 'en', name: 'English' },
  { code: 'rw', name: 'Kinyarwanda' },
  { code: 'fr', name: 'French' },
  { code: 'sw', name: 'Swahili' },
  { code: 'ar', name: 'Arabic' },
  { code: 'es', name: 'Spanish' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'tr', name: 'Turkish' },
  { code: 'zh', name: 'Chinese (Simplified)' },
  { code: 'zh-TW', name: 'Chinese (Traditional)' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'hi', name: 'Hindi' },
  { code: 'ur', name: 'Urdu' },
  { code: 'ru', name: 'Russian' },
  { code: 'uk', name: 'Ukrainian' },
  { code: 'nl', name: 'Dutch' },
  { code: 'el', name: 'Greek' },
  { code: 'pl', name: 'Polish' },
  { code: 'sv', name: 'Swedish' },
  { code: 'no', name: 'Norwegian' },
  { code: 'fi', name: 'Finnish' },
  { code: 'da', name: 'Danish' },
  { code: 'ro', name: 'Romanian' },
  { code: 'hu', name: 'Hungarian' },
  { code: 'cs', name: 'Czech' },
  { code: 'sk', name: 'Slovak' },
  { code: 'bg', name: 'Bulgarian' },
  { code: 'sr', name: 'Serbian' },
  { code: 'hr', name: 'Croatian' },
  { code: 'he', name: 'Hebrew' },
  { code: 'am', name: 'Amharic' },
  { code: 'yo', name: 'Yoruba' },
  { code: 'zu', name: 'Zulu' },
  { code: 'af', name: 'Afrikaans' },
  { code: 'th', name: 'Thai' },
  { code: 'ms', name: 'Malay' },
  { code: 'id', name: 'Indonesian' },
  { code: 'tl', name: 'Filipino' },
  { code: 'vi', name: 'Vietnamese' },
  { code: 'bn', name: 'Bengali' },
  { code: 'ne', name: 'Nepali' },
  { code: 'ta', name: 'Tamil' },
  { code: 'te', name: 'Telugu' },
  { code: 'fa', name: 'Persian' },
  { code: 'pt-BR', name: 'Portuguese (Brazil)' },
  { code: 'sw-KE', name: 'Kiswahili (Kenya)' }
];

// Translation mappings for common terms (simplified - in production, use professional translation services)
const translations = {
  en: {
    groupManagement: "Group Management",
    manageGroupMembers: "Manage group members and their accounts",
    groupInformation: "Group Information",
    groupName: "Group Name",
    groupCode: "Group Code",
    district: "District",
    sector: "Sector",
    cell: "Cell",
    description: "Description",
    status: "Status",
    contributionAmount: "Contribution Amount",
    contributionFrequency: "Contribution Frequency",
    assignLeadershipRoles: "Assign Leadership Roles",
    groupAdmin: "Group Admin",
    cashier: "Cashier",
    secretary: "Secretary",
    groupRules: "Group Rules",
    registerGroup: "Register Group",
    editGroup: "Edit Group",
    mergeGroups: "Merge Groups",
    sourceGroup: "Source Group",
    targetGroup: "Target Group",
    confirmMerge: "Confirm Merge",
    registering: "Registering...",
    merging: "Merging...",
    groupAdminInfoRequired: "Group Admin information is required (name, phone, email, national ID, password)",
    groupNameCodeRequired: "Group name and code are required",
    groupAndLeadershipRegistered: "Group and leadership team registered successfully!",
    failedToRegisterGroup: "Failed to register group. Please try again.",
    groupActivatedSuccessfully: "Group activated successfully!",
    groupDeactivatedSuccessfully: "Group deactivated successfully!",
    groupUpdatedSuccessfully: "Group updated successfully!",
    groupMergedSuccessfully: "Group merged successfully!",
    cashierName: "Cashier name",
    cashierPhone: "Cashier phone",
    cashierEmail: "Cashier email",
    secretaryName: "Secretary name",
    secretaryPhone: "Secretary phone",
    secretaryEmail: "Secretary email",
    groupAdminRequired: "Group Admin is required. Cashier and Secretary are optional.",
    groupRulesGuidelines: "Group Rules & Guidelines"
  },
  rw: {
    groupManagement: "Gucunga Ibyiciro",
    manageGroupMembers: "Gucunga abanyamuryango b'icyiciro n'amakonti yabo",
    groupInformation: "Amakuru y'icyiciro",
    groupName: "Amazina y'icyiciro",
    groupCode: "Kode y'icyiciro",
    district: "Akarere",
    sector: "Umurenge",
    cell: "Akagari",
    description: "Ibisobanuro",
    status: "Imimerere",
    contributionAmount: "Umubare w'inyongera",
    contributionFrequency: "Igihe cyo kwongeramo",
    assignLeadershipRoles: "Guhagurura abayobozi",
    groupAdmin: "Umuyobozi w'icyiciro",
    cashier: "Umucuruzi",
    secretary: "Umwanditsi",
    groupRules: "Amabwiriza y'icyiciro",
    registerGroup: "Kwiyandikisha icyiciro",
    editGroup: "Guhindura icyiciro",
    mergeGroups: "Guhuza ibyiciro",
    sourceGroup: "Icyiciro cyo guhuza",
    targetGroup: "Icyiciro cyo guhuza",
    confirmMerge: "Emeza guhuza",
    registering: "Birimo kwiyandikisha...",
    merging: "Birimo guhuza...",
    groupAdminInfoRequired: "Amakuru y'umuyobozi w'icyiciro akenewe (amazina, telefoni, imeri, numero y'irangamuntu, ijambobanga)",
    groupNameCodeRequired: "Amazina y'icyiciro na kode byakenewe",
    groupAndLeadershipRegistered: "Icyiciro n'itsinda ry'abayobozi byiyandikishijwe neza!",
    failedToRegisterGroup: "Kwiyandikisha icyiciro byanze. Ongera ugerageze.",
    groupActivatedSuccessfully: "Icyiciro cyakoreshwa neza!",
    groupDeactivatedSuccessfully: "Icyiciro cyahagaritswe neza!",
    groupUpdatedSuccessfully: "Icyiciro cyavugururwa neza!",
    groupMergedSuccessfully: "Ibyiciro byahuzwe neza!",
    cashierName: "Amazina y'umucuruzi",
    cashierPhone: "Telefoni y'umucuruzi",
    cashierEmail: "Imeri y'umucuruzi",
    secretaryName: "Amazina y'umwanditsi",
    secretaryPhone: "Telefoni y'umwanditsi",
    secretaryEmail: "Imeri y'umwanditsi",
    groupAdminRequired: "Umuyobozi w'icyiciro akenewe. Umucuruzi na Umwanditsi ni byohereza.",
    groupRulesGuidelines: "Amabwiriza n'ubuyobozi bw'icyiciro"
  }
  // Add more translations as needed - for production, use professional translation services
};

const localesDir = path.join(__dirname, 'public', 'locales');
const namespaces = ['common', 'dashboard', 'navigation', 'forms', 'notifications', 'settings', 'errors', 'auth', 'agent', 'cashier', 'secretary', 'systemAdmin', 'groupAdmin', 'member'];

// Ensure all language directories exist
languages.forEach(lang => {
  const langDir = path.join(localesDir, lang.code);
  if (!fs.existsSync(langDir)) {
    fs.mkdirSync(langDir, { recursive: true });
  }
  
  // Create empty JSON files for each namespace if they don't exist
  namespaces.forEach(ns => {
    const filePath = path.join(langDir, `${ns}.json`);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify({}, null, 2), 'utf8');
    }
  });
});

console.log(`Created directories and files for ${languages.length} languages and ${namespaces.length} namespaces.`);
console.log('Note: This script creates the structure. Actual translations should be done by professional translators.');

