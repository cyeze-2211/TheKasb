// KASB Admin Panel - Mock Data

export type UserRole = 'CANDIDATE' | 'ADMIN' | 'SUPER_ADMIN' | 'AGENT';
export type ProfileStatus = 'PENDING' | 'REVIEWING' | 'APPROVED' | 'REJECTED';
export type VacancyStatus = 'DRAFT' | 'ACTIVE' | 'CLOSED' | 'ARCHIVED';
export type Experience = 'YEAR_1_3' | 'YEAR_3_5' | 'YEAR_5_PLUS';
export type Availability = 'READY_NOW' | 'WITHIN_1_MONTH' | 'WITHIN_3_MONTHS';
export type Language = 'RUSSIAN' | 'ENGLISH' | 'GERMAN' | 'KOREAN' | 'TURKISH' | 'POLISH' | 'OTHER';
export type LanguageLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
export type ScheduleType = 'FULL_TIME' | 'PART_TIME' | 'SHIFT' | 'CONTRACT' | 'SEASONAL';
export type Gender = 'MALE' | 'FEMALE' | 'ANY';

export const REGIONS = [
  '1-Toshkent shahri',
  '2-Toshkent viloyati',
  '3-Farg\'ona',
  '4-Andijon',
  '5-Namangan',
  '6-Samarqand',
  '7-Buxoro',
  '8-Navoiy',
  '9-Qashqadaryo',
  '10-Surxondaryo',
  '11-Jizzax',
  '12-Sirdaryo',
  '13-Xorazm',
  '14-QQR'
];

export const PROFESSIONS_CATEGORIES = [
  { id: 1, name: 'Oshpazchilik', emoji: '🍽️', count: 12 },
  { id: 2, name: 'Qurilish', emoji: '🏗️', count: 18 },
  { id: 3, name: 'Tibbiyot', emoji: '🏥', count: 8 },
  { id: 4, name: 'Qishloq xo\'jaligi', emoji: '🌾', count: 6 },
  { id: 5, name: 'Transport', emoji: '🚚', count: 11 },
  { id: 6, name: 'Uy va tozalik', emoji: '🧹', count: 9 },
  { id: 7, name: 'Sanoat', emoji: '🏭', count: 14 },
  { id: 8, name: 'Go\'zallik', emoji: '💇', count: 7 }
];

export const PROFESSIONS = {
  1: ['Oshpaz', 'Sous-shef', 'Konditer', 'Sushi master', 'Lavash tayyorlovchi', 'Pishiriqchi', 'Muzqaymoq ustasi', 'Choy ustasi', 'Grill oshpazi', 'Salatchi', 'Pazanda', 'Shirinlik ustasi'],
  2: ['Elektrik', 'Payvandchi', 'G\'isht teruvchi', 'Betonchi', 'Usta', 'Pleytachi', 'Svoarshchik', 'Santexnik', 'Kabel toruvchi', 'Qo\'l ustasi', 'Mollyarchik', 'Usta yordamchisi', 'Betonga ishchi', 'Kran operatori', 'Ekskavator haydovchisi', 'Stroitel', 'Armaturchik', 'Izolyatsiyachi'],
  3: ['Hamshira', 'Doktor yordamchisi', 'Tibbiy karyer', 'Tish texniki', 'Massajist', 'Parvarishchi', 'Laborant', 'Radiology yordamchisi'],
  4: ['Fermer', 'Bog\'bon', 'Traktorchi', 'Chorvadar', 'O\'rik terimchi', 'Issiqxona ishchisi'],
  5: ['Yuk mashinasi haydovchisi', 'Forklift operatori', 'Logistika yordamchisi', 'Kuryer', 'Taksi haydovchisi', 'Avtobus haydovchisi', 'Yengil mashina haydovchisi', 'Sklad ishchisi', 'Pogruzchik', 'Ekspeditor', 'Transport menejeri'],
  6: ['Tozalovchi', 'Janitor', 'Oshxona yordamchisi', 'Xizmatchi', 'Pekarixona ishchisi', 'Yuvinchi', 'Gladschi', 'Xonadon ishchisi', 'Tozalik brigadiri'],
  7: ['Stanokchi', 'Operator CNC', 'Svarshik', 'Elektrogaz payvandchi', 'Montajchi', 'Slesarshik', 'Naladchik', 'Tokarchik', 'Frezerovshik', 'Shlifovshchik', 'Kontrolyor OTK', 'Upakovshchik', 'Zavod ishchisi', 'Slesar-remontnik'],
  8: ['Sartarosh', 'Stilist', 'Kosmetolog', 'Manikyur ustasi', 'Massajist (spa)', 'Vizajist', 'Barber']
};

export const COUNTRIES = [
  { code: 'KOR', name: 'Koreya Respublikasi', flag: '🇰🇷' },
  { code: 'DEU', name: 'Germaniya', flag: '🇩🇪' },
  { code: 'POL', name: 'Polsha', flag: '🇵🇱' },
  { code: 'TUR', name: 'Turkiya', flag: '🇹🇷' },
  { code: 'RUS', name: 'Rossiya', flag: '🇷🇺' },
  { code: 'UAE', name: 'BAA', flag: '🇦🇪' },
  { code: 'KAZ', name: 'Qozog\'iston', flag: '🇰🇿' },
  { code: 'CZE', name: 'Chexiya', flag: '🇨🇿' },
  { code: 'LTU', name: 'Litva', flag: '🇱🇹' },
  { code: 'UZB', name: 'O‘zbekiston', flag: '🇺🇿' },
  { code: 'USA', name: 'AQSH', flag: '🇺🇸' },
  { code: 'GBR', name: 'Buyuk Britaniya', flag: '🇬🇧' },
];

// Mock Users
export const mockUsers = [
  { id: 1, phone: '+998901234567', name: 'Alisher N.', role: 'CANDIDATE' as UserRole, active: true, verified: true, lastLogin: '2 soat oldin' },
  { id: 2, phone: '+998772000001', name: '—', role: 'CANDIDATE' as UserRole, active: true, verified: false, lastLogin: 'Hech qachon' },
  { id: 3, phone: '+998901111222', name: 'Sardor M.', role: 'ADMIN' as UserRole, active: true, verified: true, lastLogin: 'Bugun 09:14' },
  { id: 4, phone: '+998909876543', name: 'Kamola A.', role: 'AGENT' as UserRole, active: true, verified: true, lastLogin: '1 soat oldin' },
  { id: 5, phone: '+998935551234', name: 'Dilshod T.', role: 'SUPER_ADMIN' as UserRole, active: true, verified: true, lastLogin: '5 daqiqa oldin' },
  { id: 6, phone: '+998912345678', name: 'Nodira K.', role: 'CANDIDATE' as UserRole, active: false, verified: true, lastLogin: '3 kun oldin' },
  { id: 7, phone: '+998977123456', name: 'Bobur Y.', role: 'CANDIDATE' as UserRole, active: true, verified: true, lastLogin: '1 kun oldin' },
  { id: 8, phone: '+998881234567', name: 'Malika S.', role: 'AGENT' as UserRole, active: true, verified: true, lastLogin: 'Bugun 11:30' },
];

// Mock Candidates
export const mockCandidates = [
  {
    id: 1,
    name: 'Alisher Nazarov',
    phone: '+998901234567',
    region: 'Toshkent shahri',
    profession: 'Oshpaz',
    category: 'Oshpazchilik',
    experience: 'YEAR_1_3' as Experience,
    languages: [
      { lang: 'RUSSIAN' as Language, level: 'B2' as LanguageLevel, hasCert: true },
      { lang: 'ENGLISH' as Language, level: 'A1' as LanguageLevel, hasCert: false }
    ],
    targetCountries: ['KOR', 'DEU'],
    salaryMin: 800,
    salaryMax: 1200,
    currency: 'USD',
    score: 82,
    status: 'APPROVED' as ProfileStatus,
    availability: 'READY_NOW' as Availability,
    registeredAt: '15.03.2025',
    lastLogin: '2 soat oldin'
  },
  {
    id: 2,
    name: 'Sardor Mahmudov',
    phone: '+998772000044',
    region: 'Farg\'ona viloyati',
    profession: 'Elektrik',
    category: 'Qurilish',
    experience: 'YEAR_3_5' as Experience,
    languages: [
      { lang: 'RUSSIAN' as Language, level: 'C1' as LanguageLevel, hasCert: true }
    ],
    targetCountries: ['POL'],
    salaryMin: 1000,
    salaryMax: 1500,
    currency: 'EUR',
    score: 96,
    status: 'PENDING' as ProfileStatus,
    availability: 'WITHIN_1_MONTH' as Availability,
    registeredAt: '18.03.2025',
    lastLogin: '1 soat oldin'
  },
  {
    id: 3,
    name: 'Kamola Azimova',
    phone: '+998909876543',
    region: 'Samarqand viloyati',
    profession: 'Hamshira',
    category: 'Tibbiyot',
    experience: 'YEAR_5_PLUS' as Experience,
    languages: [
      { lang: 'GERMAN' as Language, level: 'B2' as LanguageLevel, hasCert: true },
      { lang: 'ENGLISH' as Language, level: 'B1' as LanguageLevel, hasCert: false }
    ],
    targetCountries: ['DEU'],
    salaryMin: 2000,
    salaryMax: 2800,
    currency: 'EUR',
    score: 91,
    status: 'REVIEWING' as ProfileStatus,
    availability: 'WITHIN_3_MONTHS' as Availability,
    registeredAt: '10.03.2025',
    lastLogin: '3 soat oldin'
  },
  {
    id: 4,
    name: 'Bobur Yusupov',
    phone: '+998977123456',
    region: 'Andijon viloyati',
    profession: 'Svarshik',
    category: 'Sanoat',
    experience: 'YEAR_3_5' as Experience,
    languages: [
      { lang: 'RUSSIAN' as Language, level: 'B2' as LanguageLevel, hasCert: false },
      { lang: 'KOREAN' as Language, level: 'A2' as LanguageLevel, hasCert: true }
    ],
    targetCountries: ['KOR', 'RUS'],
    salaryMin: 1200,
    salaryMax: 1800,
    currency: 'USD',
    score: 75,
    status: 'APPROVED' as ProfileStatus,
    availability: 'READY_NOW' as Availability,
    registeredAt: '01.03.2025',
    lastLogin: '1 kun oldin'
  },
  {
    id: 5,
    name: 'Dilnoza Karimova',
    phone: '+998935551234',
    region: 'Toshkent shahri',
    profession: 'Konditer',
    category: 'Oshpazchilik',
    experience: 'YEAR_1_3' as Experience,
    languages: [
      { lang: 'RUSSIAN' as Language, level: 'C1' as LanguageLevel, hasCert: false },
      { lang: 'TURKISH' as Language, level: 'B1' as LanguageLevel, hasCert: true }
    ],
    targetCountries: ['TUR', 'RUS'],
    salaryMin: 600,
    salaryMax: 900,
    currency: 'USD',
    score: 68,
    status: 'PENDING' as ProfileStatus,
    availability: 'WITHIN_1_MONTH' as Availability,
    registeredAt: '22.03.2025',
    lastLogin: '30 daqiqa oldin'
  },
  {
    id: 6,
    name: 'Javohir Rahimov',
    phone: '+998881234567',
    region: 'Namangan viloyati',
    profession: 'Yuk mashinasi haydovchisi',
    category: 'Transport',
    experience: 'YEAR_5_PLUS' as Experience,
    languages: [
      { lang: 'RUSSIAN' as Language, level: 'B2' as LanguageLevel, hasCert: true },
      { lang: 'POLISH' as Language, level: 'A1' as LanguageLevel, hasCert: false }
    ],
    targetCountries: ['POL', 'DEU'],
    salaryMin: 1500,
    salaryMax: 2200,
    currency: 'EUR',
    score: 88,
    status: 'APPROVED' as ProfileStatus,
    availability: 'READY_NOW' as Availability,
    registeredAt: '05.03.2025',
    lastLogin: '4 soat oldin'
  },
  {
    id: 7,
    name: 'Malika Shukurova',
    phone: '+998912345678',
    region: 'Buxoro viloyati',
    profession: 'Sartarosh',
    category: 'Go\'zallik',
    experience: 'YEAR_3_5' as Experience,
    languages: [
      { lang: 'RUSSIAN' as Language, level: 'C1' as LanguageLevel, hasCert: false }
    ],
    targetCountries: ['RUS', 'TUR'],
    salaryMin: 800,
    salaryMax: 1200,
    currency: 'USD',
    score: 45,
    status: 'REJECTED' as ProfileStatus,
    availability: 'READY_NOW' as Availability,
    registeredAt: '28.02.2025',
    lastLogin: '2 kun oldin'
  }
];

// Mock Vacancies
export const mockVacancies = [
  {
    id: 1,
    title: 'Oshpaz — Seul, Koreya',
    country: 'KOR',
    category: 'Oshpazchilik',
    profession: 'Oshpaz',
    experience: 'YEAR_1_3' as Experience,
    urgent: true,
    status: 'ACTIVE' as VacancyStatus,
    creator: 'Sardor A.',
    createdAt: '10.03.2025'
  },
  {
    id: 2,
    title: 'Elektrik — Varshava',
    country: 'POL',
    category: 'Qurilish',
    profession: 'Elektrik',
    experience: 'YEAR_3_5' as Experience,
    urgent: false,
    status: 'DRAFT' as VacancyStatus,
    creator: 'Admin',
    createdAt: '18.03.2025'
  },
  {
    id: 3,
    title: 'Hamshira — Frankfurt',
    country: 'DEU',
    category: 'Tibbiyot',
    profession: 'Hamshira',
    experience: 'YEAR_5_PLUS' as Experience,
    urgent: false,
    status: 'CLOSED' as VacancyStatus,
    creator: 'Sardor A.',
    createdAt: '01.03.2025'
  },
  {
    id: 4,
    title: 'Payvandchi — Berlin',
    country: 'DEU',
    category: 'Qurilish',
    profession: 'Payvandchi',
    experience: 'YEAR_3_5' as Experience,
    urgent: true,
    status: 'ACTIVE' as VacancyStatus,
    creator: 'Kamola A.',
    createdAt: '15.03.2025'
  },
  {
    id: 5,
    title: 'Yuk haydovchisi — Krakov',
    country: 'POL',
    category: 'Transport',
    profession: 'Yuk mashinasi haydovchisi',
    experience: 'YEAR_5_PLUS' as Experience,
    urgent: false,
    status: 'ACTIVE' as VacancyStatus,
    creator: 'Admin',
    createdAt: '20.03.2025'
  }
];

// Mock Custom Professions
export const mockCustomProfessions = [
  { id: 1, name: 'Yuk mashinasi haydovchisi', usage: 247, reviewed: false },
  { id: 2, name: 'Qo\'riqchi', usage: 183, reviewed: false },
  { id: 3, name: 'Sartarosh', usage: 91, reviewed: true },
  { id: 4, name: 'Taxi haydovchi', usage: 156, reviewed: false },
  { id: 5, name: 'Omborchi', usage: 78, reviewed: false },
  { id: 6, name: 'Kuryer', usage: 203, reviewed: true },
];

// Dashboard Stats - Premium
export const dashboardStats = {
  totalCandidates: { value: 10847, change: 234, trend: 12, label: 'bu hafta' },
  activeVacancies: { value: 103, urgent: 18, label: 'ta shoshilinch' },
  todayApplications: { value: 47, trend: 23, label: 'kechagidan' },
  pendingApproval: { value: 847, overdue: 23, label: 'ta kechikkan' },
  activeUsers: { value: 312, label: 'Bugungi kirish' }
};

export const last30DaysData = [
  { id: 'day-1', date: 'Apr 5', newRegistrations: 127, approved: 98 },
  { id: 'day-2', date: 'Apr 8', newRegistrations: 145, approved: 112 },
  { id: 'day-3', date: 'Apr 11', newRegistrations: 189, approved: 134 },
  { id: 'day-4', date: 'Apr 14', newRegistrations: 156, approved: 121 },
  { id: 'day-5', date: 'Apr 17', newRegistrations: 198, approved: 156 },
  { id: 'day-6', date: 'Apr 20', newRegistrations: 234, approved: 189 },
  { id: 'day-7', date: 'Apr 23', newRegistrations: 178, approved: 145 },
  { id: 'day-8', date: 'Apr 26', newRegistrations: 212, approved: 167 },
  { id: 'day-9', date: 'Apr 29', newRegistrations: 245, approved: 198 },
  { id: 'day-10', date: 'May 2', newRegistrations: 267, approved: 212 },
  { id: 'day-11', date: 'May 4', newRegistrations: 289, approved: 234 }
];

export const topCountries = [
  { id: 'country-1', country: 'Koreya', flag: '🇰🇷', count: 3241, percentage: 38 },
  { id: 'country-2', country: 'Polsha', flag: '🇵🇱', count: 2108, percentage: 24 },
  { id: 'country-3', country: 'Germaniya', flag: '🇩🇪', count: 1876, percentage: 22 },
  { id: 'country-4', country: 'Isroil', flag: '🇮🇱', count: 834, percentage: 10 },
  { id: 'country-5', country: 'Chexiya', flag: '🇨🇿', count: 412, percentage: 5 }
];

export const topProfessions = [
  { id: 'prof-1', rank: 1, name: 'Oshpaz', count: 2341, trend: 12 },
  { id: 'prof-2', rank: 2, name: 'Qurilishchi', count: 1876, trend: 8 },
  { id: 'prof-3', rank: 3, name: 'Haydovchi', count: 1543, trend: 3 },
  { id: 'prof-4', rank: 4, name: 'Hamshira', count: 987, trend: -2 },
  { id: 'prof-5', rank: 5, name: 'Elektrik', count: 834, trend: 15 },
  { id: 'prof-6', rank: 6, name: 'Payvandchi', count: 721, trend: 7 },
  { id: 'prof-7', rank: 7, name: 'Konditer', count: 643, trend: 4 },
  { id: 'prof-8', rank: 8, name: 'Sartarosh', count: 512, trend: -1 }
];

export const languageDistribution = [
  { id: 'lang-1', language: 'Rus tili', flag: '🇷🇺', count: 6240, color: '#3B82F6' },
  { id: 'lang-2', language: 'Ingliz tili', flag: '🇬🇧', count: 3180, color: '#10B981' },
  { id: 'lang-3', language: 'Nemis tili', flag: '🇩🇪', count: 1420, color: '#8B5CF6' },
  { id: 'lang-4', language: 'Koreya tili', flag: '🇰🇷', count: 891, color: '#EF4444' },
  { id: 'lang-5', language: 'Turk tili', flag: '🇹🇷', count: 640, color: '#F59E0B' },
  { id: 'lang-6', language: 'Polyak tili', flag: '🇵🇱', count: 312, color: '#14B8A6' }
];

export const recentActivity = [
  { id: 'act-1', time: '14:31', type: 'success', event: 'Alisher N. profili tasdiqlandi', actor: 'ADMIN tomonidan' },
  { id: 'act-2', time: '14:28', type: 'info', event: 'Yangi vakansiya: "Oshpaz — Seul"', actor: 'Sardor A. tomonidan' },
  { id: 'act-3', time: '14:25', type: 'warning', event: '+998901234567 ro\'yxatdan o\'tdi', actor: 'OTP orqali' },
  { id: 'act-4', time: '14:20', type: 'danger', event: 'Bobur T. profili rad etildi', actor: 'ADMIN tomonidan' },
  { id: 'act-5', time: '14:18', type: 'success', event: 'Dilnoza K. profili tasdiqlandi', actor: '—' },
  { id: 'act-6', time: '14:15', type: 'info', event: 'Vakansiya yopildi: "Elektrik — Varsh."', actor: '—' },
  { id: 'act-7', time: '14:12', type: 'warning', event: '+998772004521 ro\'yxatdan o\'tdi', actor: 'OTP orqali' },
  { id: 'act-8', time: '14:09', type: 'info', event: 'Yangi vakansiya: "Haydovchi — Berlin"', actor: '—' }
];

export const candidateStatusDistribution = [
  { id: 'status-pending', name: 'PENDING', value: 3847, color: '#D97706' },
  { id: 'status-reviewing', name: 'REVIEWING', value: 2156, color: '#2563EB' },
  { id: 'status-approved', name: 'APPROVED', value: 4287, color: '#16A34A' },
  { id: 'status-rejected', name: 'REJECTED', value: 557, color: '#DC2626' }
];

export const weeklyRegistrations = [
  { id: 'day-1', day: 'Dush', value: 127 },
  { id: 'day-2', day: 'Sesh', value: 145 },
  { id: 'day-3', day: 'Chor', value: 189 },
  { id: 'day-4', day: 'Pay', value: 156 },
  { id: 'day-5', day: 'Juma', value: 198 },
  { id: 'day-6', day: 'Shan', value: 234 },
  { id: 'day-7', day: 'Yak', value: 178 }
];
