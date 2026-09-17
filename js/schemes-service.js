/**
 * MandiX - Official Government Agricultural Schemes Directory
 * Verified Indian agricultural schemes from official government ministries with authentic application URLs.
 */

export const GOVERNMENT_SCHEMES = [
  {
    id: 'pm_kisan',
    name: 'PM-KISAN (प्रधानमंत्री किसान सम्मान निधि योजना)',
    department: 'Department of Agriculture & Farmers Welfare, Ministry of Agriculture, GoI',
    type: 'Income Support (आय सहायता)',
    level: 'Central Government (केंद्र सरकार)',
    targetCategory: ['Small & Marginal Farmers', 'All Landholding Farmers'],
    lastVerified: 'September 2026',
    officialUrl: 'https://pmkisan.gov.in/',
    summary: 'Direct income support of ₹6,000 per year in three equal 4-monthly installments of ₹2,000 directly transferred to farmers’ Aadhaar-linked bank accounts.',
    benefits: [
      '₹6,000 direct bank transfer per year in 3 installments (₹2,000 each via DBT)',
      '100% funding by Central Government',
      'Instant verification through PM-KISAN mobile app & facial recognition'
    ],
    eligibility: [
      'All landholding farmer families with cultivable landholding in their names',
      'Exclusions: Institutional landholders, constitutional post holders, income tax payees, retired pensioners with monthly pension > ₹10,000'
    ],
    documents: [
      'Aadhaar Card (Linked with active mobile number for OTP/face auth)',
      'Land Ownership Documents (Khata / Khasra / Khatiyan / Jamabandi)',
      'Bank Account Passbook (Aadhaar Seeded & NPCI mapped)'
    ],
    process: 'Visit pmkisan.gov.in > Click "New Farmer Registration" > Enter Aadhaar & Mobile OTP > Fill state, district, sub-district & land details > Submit. Existing beneficiaries can verify e-KYC.'
  },
  {
    id: 'pmfby',
    name: 'PMFBY (प्रधानमंत्री फसल बीमा योजना - Crop Insurance)',
    department: 'Ministry of Agriculture & Farmers Welfare, GoI',
    type: 'Crop Insurance (फसल बीमा)',
    level: 'Central & State Government',
    targetCategory: ['All Farmers (Loanee & Non-Loanee)', 'Sharecroppers'],
    lastVerified: 'September 2026',
    officialUrl: 'https://pmfby.gov.in/',
    summary: 'Comprehensive crop insurance covering non-preventable natural risks from pre-sowing to post-harvest at an extremely low farmer premium (1.5% for Rabi, 2.0% for Kharif).',
    benefits: [
      'Maximum 2% premium for Kharif foodgrains/oilseeds',
      'Maximum 1.5% premium for Rabi crops',
      'Maximum 5% premium for annual commercial/horticultural crops',
      'Covers prevented sowing, localized calamities (hailstorm, landslide), and post-harvest losses'
    ],
    eligibility: [
      'All farmers growing notified crops in notified areas',
      'Voluntary for non-loanee farmers; applicable to sharecroppers and tenant farmers with valid lease declarations'
    ],
    documents: [
      'Aadhaar Card',
      'Land Record Document (ROR / LPC / Land Revenue Receipt)',
      'Sowing Certificate / Self-Declaration of Sown Area',
      'Cancelled Cheque / Bank Passbook'
    ],
    process: 'Go to pmfby.gov.in > Select "Farmer Corner" > Login/Register > Select State, Season & Year > Enter Bank & Land Survey numbers > Upload sowing certificate > Pay nominal premium online.'
  },
  {
    id: 'kcc',
    name: 'Kisan Credit Card (KCC - किसान क्रेडिट कार्ड)',
    department: 'NABARD & Reserve Bank of India / Ministry of Finance',
    type: 'Institutional Credit (रियायती कृषि ऋण)',
    level: 'Central Government',
    targetCategory: ['Small & Marginal Farmers', 'Fisheries', 'Animal Husbandry'],
    lastVerified: 'September 2026',
    officialUrl: 'https://www.myscheme.gov.in/schemes/kcc',
    summary: 'Timely, affordable institutional credit for agricultural inputs (seeds, fertilizers, pesticides) and allied activities at an effective subsidized interest rate of just 4% upon prompt repayment.',
    benefits: [
      'Credit limit up to ₹3,00,000 at 7% normal interest, reduced to 4% effective interest with 3% prompt repayment incentive',
      'Collateral-free loan up to ₹1,60,000',
      'ATM-enabled Rupay Kisan Card for easy withdrawals at mandis and cooperative stores'
    ],
    eligibility: [
      'Individual/joint farmers, tenant farmers, oral lessees, sharecroppers, and Self Help Groups (SHGs)'
    ],
    documents: [
      'Completed KCC application form',
      'Identity Proof (Aadhaar / Voter ID)',
      'Address Proof',
      'Land records showing crop pattern and area under cultivation'
    ],
    process: 'Download one-page KCC form from bank portal or visit nearest rural bank/cooperative branch with land records.'
  },
  {
    id: 'pmksy',
    name: 'PMKSY - Per Drop More Crop (प्रधानमंत्री कृषि सिंचाई योजना)',
    department: 'Department of Agriculture & Farmers Welfare, GoI',
    type: 'Irrigation & Subsidies (सूक्ष्म सिंचाई)',
    level: 'Central & State Government',
    targetCategory: ['All Farmers', 'Small & Marginal Priority', 'Women Farmers'],
    lastVerified: 'September 2026',
    officialUrl: 'https://pmksy.gov.in/',
    summary: 'Financial assistance of up to 55% subsidy for small/marginal farmers and 45% for other farmers for installing Drip and Sprinkler micro-irrigation systems.',
    benefits: [
      '55% capital subsidy on Drip and Sprinkler systems for small and marginal farmers',
      '45% subsidy for other landholding farmers',
      'Water savings up to 40-50% with 30-40% increase in crop yield'
    ],
    eligibility: [
      'Farmers possessing agricultural land with an assured water source (borewell, tubewell, canal outlet, farm pond)'
    ],
    documents: [
      'Land revenue records (Khatiyan / Jamabandi)',
      'Water source proof (Borewell certificate/electricity connection)',
      'Aadhaar Card and Bank details',
      'Field sketch map'
    ],
    process: 'Register on state agriculture department horticulture portal or pmksy.gov.in > Submit quotation from empaneled micro-irrigation manufacturer > Field inspection by Agri Officer > Subsidy released.'
  },
  {
    id: 'smam',
    name: 'SMAM - Farm Machinery Subsidy (कृषि यंत्रीकरण उप-मिशन)',
    department: 'Mechanization & Technology Division, Ministry of Agriculture, GoI',
    type: 'Farm Machinery (मशीनरी सब्सिडी)',
    level: 'Central & State Government',
    targetCategory: ['Small & Marginal Farmers', 'Women Farmers', 'SC/ST Farmers'],
    lastVerified: 'September 2026',
    officialUrl: 'https://agrimachinery.nic.in/',
    summary: 'Subsidies of 40% to 50% for purchasing modern farm machinery (Tractors, Power Tillers, Rotavators, Happy Seeders, Drone equipment) and up to 80% subsidy for setting up Custom Hiring Centers.',
    benefits: [
      '40% to 50% direct subsidy on individual machine purchases',
      'Up to ₹10,00,000 (80% financial assistance) for establishing village Custom Hiring Centers (CHCs)',
      'Subsidies for Agricultural Drones up to ₹5,00,000 for FPOs and ₹4,00,000 for CHCs'
    ],
    eligibility: [
      'Farmers having valid land records who have not availed machinery subsidy in the preceding 5 years'
    ],
    documents: [
      'Aadhaar Card',
      'Land records (LPC / Jamabandi)',
      'Caste Certificate (for SC/ST higher subsidy quota)',
      'Bank Passbook & Pan Card'
    ],
    process: 'Apply online on agrimachinery.nic.in > Select desired machine from authorized dealer list > Receive approval token > Purchase machine > Physical verification by committee > Subsidy credited to account.'
  },
  {
    id: 'soil_health_card',
    name: 'Soil Health Card Scheme (मृदा स्वास्थ्य कार्ड)',
    department: 'Ministry of Agriculture & Farmers Welfare, GoI',
    type: 'Soil Testing (मृदा परीक्षण)',
    level: 'Central Government',
    targetCategory: ['All Farmers'],
    lastVerified: 'September 2026',
    officialUrl: 'https://soilhealth.dac.gov.in/',
    summary: 'Free periodic soil health testing assessing 12 parameters (N, P, K, S, Zn, Fe, Cu, Mn, Bo, pH, EC, OC) with customized nutrient and fertilizer dosage recommendations.',
    benefits: [
      'Free testing of field soil samples every 2 years',
      'Precise crop-wise fertilizer dosage advice to avoid over-fertilization and reduce input cost by 15-25%',
      'Available digitally on Soil Health Portal'
    ],
    eligibility: ['All farmers cultivating agricultural land in India'],
    documents: ['Aadhaar Card', 'Khata / Khasra number where soil sample is extracted'],
    process: 'Contact local Krishi Salahkar or Krishi Vigyan Kendra (KVK) > Soil sample collected from field > Results and digital card accessible at soilhealth.dac.gov.in.'
  },
  {
    id: 'pm_kusum',
    name: 'PM-KUSUM (प्रधानमंत्री कुसुम योजना - Solar Agri Pump)',
    department: 'Ministry of New and Renewable Energy (MNRE), GoI',
    type: 'Solar Agriculture (सौर ऊर्जा सिंचाई)',
    level: 'Central & State Government',
    targetCategory: ['Individual Farmers', 'Water User Associations', 'FPOs'],
    lastVerified: 'September 2026',
    officialUrl: 'https://pmkusum.mnre.gov.in/',
    summary: 'Subsidies up to 60% (30% Central + 30% State) for setting up standalone off-grid solar agriculture pumps (3 HP to 10 HP) and solarizing existing grid-connected electric pumps.',
    benefits: [
      'Up to 60% total government subsidy on solar pump installation',
      '30% loan from commercial banks; farmer only invests 10% upfront',
      'Uninterrupted daytime solar irrigation with zero recurring electricity or diesel costs'
    ],
    eligibility: ['Farmers with cultivable land having an active tubewell/borewell or surface water source'],
    documents: ['Aadhaar Card', 'Land ownership documents (ROR)', 'Bank details', 'Borewell yield certificate'],
    process: 'Apply on state renewable energy development portal (or pmkusum.mnre.gov.in) > Select pump vendor > Pay 10% farmer share > Installation & DISCOM inspection.'
  },
  {
    id: 'enam',
    name: 'e-NAM (National Agriculture Market - राष्ट्रीय कृषि बाजार)',
    department: 'Small Farmers Agribusiness Consortium (SFAC), MoA&FW',
    type: 'Mandi Trading (ऑनलाइन मंडी व्यापार)',
    level: 'Pan-India',
    targetCategory: ['Farmers', 'FPOs', 'Registered Traders'],
    lastVerified: 'September 2026',
    officialUrl: 'https://enam.gov.in/',
    summary: 'Pan-India electronic trading portal networking physical APMC mandis to create a unified national market for agricultural commodities with transparent online bidding and direct bank settlement.',
    benefits: [
      'Access to buyers across India, eliminating middleman exploitation',
      'Real-time transparent online auction and price discovery',
      'Assay labs for quality testing before sale',
      'Direct payment into farmer’s bank account within 24 hours of weighing'
    ],
    eligibility: ['Any farmer bringing produce to an e-NAM integrated APMC mandi or FPO aggregator'],
    documents: ['Aadhaar Card', 'Bank Account details', 'Mandi gate entry slip'],
    process: 'Register on enam.gov.in or at the gate of any e-NAM mandi > Get gate entry pass > Assay quality check > Produce listed on electronic auction screen.'
  }
];

export const SCHEME_CATEGORIES = [
  'All',
  'Income Support',
  'Crop Insurance',
  'Institutional Credit',
  'Irrigation & Subsidies',
  'Farm Machinery',
  'Soil Testing',
  'Solar Agriculture',
  'Mandi Trading'
];
