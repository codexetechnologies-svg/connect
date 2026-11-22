'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type Language = 'en' | 'ta';

const translations: Record<Language, Record<string, string>> = {
  en: {},
  ta: {
    'Enter the 6-digit code sent to your email.': 'உங்கள் மின்னஞ்சலுக்கு அனுப்பப்பட்ட 6 இலக்கக் குறியீட்டை உள்ளிடவும்.',
    'Resend code in {seconds}s': '{seconds} வினாடிகளில் குறியீட்டை மீண்டும் அனுப்பு',
    'Resend code': 'குறியீட்டை மீண்டும் அனுப்பு',
    'Change email': 'மின்னஞ்சலை மாற்று',
    'Enter a valid email address.': 'சரியான மின்னஞ்சல் முகவரியை உள்ளிடவும்.',
    'Enter a valid email address and six-digit code.': 'சரியான மின்னஞ்சல் முகவரி மற்றும் ஆறு இலக்கக் குறியீட்டை உள்ளிடவும்.',
    'Please wait before requesting another code.': 'மற்றொரு குறியீட்டைக் கோருவதற்கு முன் காத்திருக்கவும்.',
    'The email sending limit has been reached. Please try later.': 'மின்னஞ்சல் அனுப்பும் வரம்பு எட்டப்பட்டது. பின்னர் முயற்சிக்கவும்.',
    'Unable to send a sign-in code right now. Please try later.': 'இப்போது உள்நுழைவு குறியீட்டை அனுப்ப முடியவில்லை. பின்னர் முயற்சிக்கவும்.',
    'The code is invalid or expired. Request a new code and try again.': 'குறியீடு தவறானது அல்லது காலாவதியானது. புதிய குறியீட்டைக் கோரி மீண்டும் முயற்சிக்கவும்.',
    'Unable to verify the code right now. Please try again.': 'இப்போது குறியீட்டைச் சரிபார்க்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்.',
    'Sign-in is temporarily unavailable. Please try again later.': 'உள்நுழைவு தற்காலிகமாக கிடைக்கவில்லை. பின்னர் முயற்சிக்கவும்.',
    'Sign-in setup is incomplete. Check the server logs and docs/auth-email-setup.md.': 'உள்நுழைவு அமைப்பு முழுமையடையவில்லை. சர்வர் பதிவுகள் மற்றும் docs/auth-email-setup.md வழிகாட்டியைப் பார்க்கவும்.',
    'Sign-in is not configured. Please contact support.': 'உள்நுழைவு அமைக்கப்படவில்லை. ஆதரவைத் தொடர்புகொள்ளவும்.',
    'Overview': 'கண்ணோட்டம்',
    'Search': 'தேடல்',
    'Map': 'வரைபடம்',
    'Catalogue': 'பட்டியல்',
    'Enquiries': 'விசாரணைகள்',
    'Approvals': 'ஒப்புதல்கள்',
    'Revenue': 'வருவாய்',
    'Plans': 'திட்டங்கள்',
    'Sign out': 'வெளியேறு',
    'Dashboard': 'டாஷ்போர்டு',
    'Account overview': 'கணக்கு கண்ணோட்டம்',
    'Refresh sample catalog': 'மாதிரி பட்டியலைப் புதுப்பிக்கவும்',
    'Sample catalog refreshed at': 'மாதிரி பட்டியல் புதுப்பிக்கப்பட்ட நேரம்',
    'Demo data is not connected to a live feed.': 'மாதிரி தரவு நேரடி தகவலுடன் இணைக்கப்படவில்லை.',
    'Average discount': 'சராசரி தள்ளுபடி',
    'Pending enquiries': 'நிலுவையிலுள்ள விசாரணைகள்',
    'Recent approvals': 'சமீபத்திய ஒப்புதல்கள்',
    'Verified': 'சரிபார்க்கப்பட்டது',
    'Account status': 'கணக்கு நிலை',
    'KYC verification': 'KYC சரிபார்ப்பு',
    'Approved': 'ஒப்புதல் அளிக்கப்பட்டது',
    'Subscription': 'சந்தா',
    'Professional': 'தொழில்முறை',
    'District coverage': 'மாவட்ட சேவைப் பகுதி',
    'Medical shop portal': 'மருந்தக போர்டல்',
    'Find the best wholesale price': 'சிறந்த மொத்த விலையைக் கண்டறியுங்கள்',
    'Medicine search': 'மருந்து தேடல்',
    'Compare suppliers': 'விநியோகஸ்தர்களை ஒப்பிடுங்கள்',
    'Medicine, supplier or city': 'மருந்து, விநியோகஸ்தர் அல்லது நகரம்',
    'Brand / generic': 'பிராண்ட் / ஜெனரிக்',
    'All': 'அனைத்தும்',
    'Branded': 'பிராண்டட்',
    'Generic': 'ஜெனரிக்',
    'Pack size': 'பேக் அளவு',
    'All pack sizes': 'அனைத்து பேக் அளவுகளும்',
    'Strip of 10': '10 மாத்திரைகள் கொண்ட ஸ்ட்ரிப்',
    'Strip of 15': '15 மாத்திரைகள் கொண்ட ஸ்ட்ரிப்',
    'Maximum distance': 'அதிகபட்ச தூரம்',
    'Within 20 km': '20 கி.மீ.க்குள்',
    'Within 50 km': '50 கி.மீ.க்குள்',
    'Exact-match price comparison': 'சரியான பொருத்த விலை ஒப்பீடு',
    'supplier': 'விநியோகஸ்தர்',
    'suppliers': 'விநியோகஸ்தர்கள்',
    'found': 'கண்டறியப்பட்டனர்',
    'Comparison updated with your selected filters.': 'தேர்ந்தெடுத்த வடிகட்டிகளுடன் ஒப்பீடு புதுப்பிக்கப்பட்டது.',
    'No suppliers match those filters. Try a broader search or distance.': 'இந்த வடிகட்டிகளுக்கு விநியோகஸ்தர்கள் இல்லை. தேடல் அல்லது தூர வரம்பை மாற்றவும்.',
    'Distance': 'தூரம்',
    'Stock': 'இருப்பு',
    'Rate': 'விலை',
    'GST': 'GST',
    'Scheme': 'சலுகை',
    'Effective': 'இறுதி விலை',
    'Verified licence': 'உரிமம் சரிபார்க்கப்பட்டது',
    'Pending verification': 'சரிபார்ப்பு நிலுவையில்',
    'In Stock': 'இருப்பில் உள்ளது',
    'Low Stock': 'குறைந்த இருப்பு',
    'Out of Stock': 'இருப்பில் இல்லை',
    'Supplier portal': 'விநியோகஸ்தர் போர்டல்',
    'Catalogue and pricing': 'பட்டியல் மற்றும் விலை',
    'Import CSV': 'CSV இறக்குமதி',
    'Columns: medicine, composition, brand, pack, basePrice, stock': 'நெடுவரிசைகள்: மருந்து, கலவை, பிராண்ட், பேக், அடிப்படை விலை, இருப்பு',
    'Active medicine SKUs': 'செயலில் உள்ள மருந்து SKU-கள்',
    'Medicine': 'மருந்து',
    'Composition': 'கலவை',
    'Brand': 'பிராண்ட்',
    'Pack': 'பேக்',
    'Base price': 'அடிப்படை விலை',
    'Medical shop enquiries': 'மருந்தக விசாரணைகள்',
    'Lead pipeline': 'விசாரணை நிலைகள்',
    'Quantity': 'அளவு',
    'New': 'புதியது',
    'Quoted': 'விலைப்புள்ளி அனுப்பப்பட்டது',
    'Respond': 'பதிலளி',
    'Cancel': 'ரத்து செய்',
    'Draft a quote response': 'விலைப்புள்ளி பதிலைத் தயாரிக்கவும்',
    'Enter price, availability, and delivery details': 'விலை, இருப்பு மற்றும் விநியோக விவரங்களை உள்ளிடவும்',
    'Save response': 'பதிலைச் சேமி',
    'This demo updates the lead status only; it does not send an email.': 'இந்த மாதிரி விசாரணை நிலையை மட்டும் மாற்றும்; மின்னஞ்சல் அனுப்பாது.',
    'Lead list downloaded as CSV.': 'விசாரணைப் பட்டியல் CSV ஆகப் பதிவிறக்கப்பட்டது.',
    'Response saved for this demo session; it was not sent to the shop.': 'மாதிரி அமர்வில் பதில் சேமிக்கப்பட்டது; கடைக்கு அனுப்பப்படவில்லை.',
    'Admin controls': 'நிர்வாகக் கட்டுப்பாடுகள்',
    'KYC approval queue': 'KYC ஒப்புதல் வரிசை',
    'Approve batch': 'தொகுதியை ஒப்புதல் அளி',
    'Pending in this sample': 'இந்த மாதிரியில் நிலுவையில்',
    'Approved in this sample': 'இந்த மாதிரியில் ஒப்புதல்',
    'Reports generated': 'உருவாக்கப்பட்ட அறிக்கைகள்',
    'Account review list': 'கணக்கு மதிப்பாய்வு பட்டியல்',
    'High risk': 'அதிக ஆபத்து',
    'Needs docs': 'ஆவணங்கள் தேவை',
    'Needs documents': 'ஆவணங்கள் தேவை',
    'Review': 'மதிப்பாய்வு',
    'View': 'பார்க்க',
    'Approve account': 'கணக்கை ஒப்புதல் அளி',
    'Request documents': 'ஆவணங்களைக் கோரு',
    'Platform analytics': 'தள பகுப்பாய்வு',
    'Monthly revenue and GST reporting': 'மாதாந்திர வருவாய் மற்றும் GST அறிக்கை',
    'Summary': 'சுருக்கம்',
    'Monthly revenue': 'மாத வருவாய்',
    'Active subscriptions': 'செயலில் உள்ள சந்தாக்கள்',
    'Pending renewals': 'நிலுவை புதுப்பிப்புகள்',
    'Revenue trend': 'வருவாய் போக்கு',
    'GST ready': 'GST தயாராக உள்ளது',
    'Plan management': 'திட்ட நிர்வாகம்',
    'Subscription engine': 'சந்தா அமைப்பு',
    'Choose a plan to save your demo selection in this browser. No payment will be collected.': 'இந்த உலாவியில் மாதிரி திட்டத்தைச் சேமிக்கத் தேர்ந்தெடுக்கவும். கட்டணம் வசூலிக்கப்படாது.',
    'Monthly': 'மாதாந்திரம்',
    'Launch offer': 'தொடக்க சலுகை',
    'Selected': 'தேர்ந்தெடுக்கப்பட்டது',
    'Select plan': 'திட்டத்தைத் தேர்ந்தெடுக்கவும்',
    'Up to': 'அதிகபட்சம்',
    'Map view': 'வரைபடக் காட்சி',
    'Google Maps · Dealer coverage and distance': 'Google Maps · விற்பனையாளர் பகுதி மற்றும் தூரம்',
    'Pins use example city-level supplier coordinates and circles show each supplier’s delivery radius.': 'குறியீடுகள் எடுத்துக்காட்டு நகர இருப்பிடங்களைக் காட்டும்; வட்டங்கள் விநியோக வரம்பைக் காட்டும்.',
    'Shop location': 'கடை இருப்பிடம்',
    'Madurai City · Example location': 'மதுரை நகரம் · எடுத்துக்காட்டு இடம்',
    'Loading Google Maps': 'Google Maps ஏற்றப்படுகிறது',
    'Connecting to the Google Maps JavaScript API.': 'Google Maps JavaScript API உடன் இணைக்கிறது.',
    'Google Maps API key required': 'Google Maps API key தேவை',
    'Set up Google Maps in Cloud Console': 'Cloud Console-இல் Google Maps அமைக்கவும்',
    'Google Maps could not load': 'Google Maps ஏற்ற முடியவில்லை',
    'Open Madurai in Google Maps': 'Google Maps-இல் மதுரையைத் திறக்கவும்',
    'Fit all suppliers': 'அனைத்து விநியோகஸ்தர்களையும் காண்பி',
    'Coverage': 'சேவைப் பகுதி',
    'Open location in Google Maps': 'Google Maps-இல் இருப்பிடத்தைத் திற',
    'Secure sign in': 'பாதுகாப்பான உள்நுழைவு',
    'Demo sign in': 'மாதிரி உள்நுழைவு',
    'Welcome back': 'மீண்டும் வருக',
    'Sign in with the email registered to your approved account.': 'ஒப்புதல் பெற்ற உங்கள் கணக்கில் பதிவு செய்த மின்னஞ்சல் முகவரியைப் பயன்படுத்தி உள்நுழையவும்.',
    'Email address': 'மின்னஞ்சல் முகவரி',
    'One-time code': 'ஒருமுறை கடவுக்குறியீடு',
    'If an approved account is registered, a one-time code has been sent.': 'ஒப்புதல் பெற்ற கணக்கு பதிவு செய்யப்பட்டிருந்தால், ஒருமுறை குறியீடு அனுப்பப்பட்டுள்ளது.',
    'Please wait…': 'காத்திருக்கவும்…',
    'Choose a sample account to explore its portal. Production authentication must replace this demo flow with OTP/identity-provider verification and server-side session validation.': 'போர்டலைப் பார்க்க மாதிரி கணக்கைத் தேர்ந்தெடுக்கவும். உண்மையான பயன்பாட்டில் OTP அல்லது அடையாளச் சரிபார்ப்பு தேவை.',
    'Demo account email': 'மாதிரி கணக்கு மின்னஞ்சல்',
    'Portal': 'போர்டல்',
    'Supplier': 'விநியோகஸ்தர்',
    'Medical Shop': 'மருந்தகம்',
    'Admin': 'நிர்வாகம்',
    'Opening portal…': 'போர்டல் திறக்கப்படுகிறது…',
    'Continue as': 'தொடரவும்:',
    'Privacy Policy': 'தனியுரிமைக் கொள்கை',
    'Terms & Conditions': 'விதிமுறைகள் மற்றும் நிபந்தனைகள்',
    'Contact': 'தொடர்பு',
    'Quick links': 'விரைவு இணைப்புகள்',
    'Medical shop search': 'மருந்தக தேடல்',
    'Supplier catalogue': 'விநியோகஸ்தர் பட்டியல்',
    'Sign in': 'உள்நுழைவு',
    'Wholesale medicine comparison, made simple.': 'மொத்த மருந்து ஒப்பீடு எளிதாக.',
    'Madurai, Tamil Nadu, India': 'மதுரை, தமிழ்நாடு, இந்தியா',
    'All rights reserved.': 'அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை.',
    'Please choose a CSV file. Excel workbook files are not supported in this demo.': 'CSV கோப்பைத் தேர்ந்தெடுக்கவும். இந்த மாதிரியில் Excel கோப்புகள் ஆதரிக்கப்படவில்லை.',
    'CSV headers must be medicine, composition, brand, pack, basePrice, and stock.': 'CSV தலைப்புகள் medicine, composition, brand, pack, basePrice, stock என இருக்க வேண்டும்.',
    'Row validation failed': 'வரி {row}-இல் தேவையான மதிப்பு இல்லை அல்லது விலை தவறாக உள்ளது.',
    'The CSV has headers but no catalogue rows.': 'CSV-யில் தலைப்புகள் உள்ளன, ஆனால் பட்டியல் வரிகள் இல்லை.',
    'Added {count} row to this page. Demo changes are not saved to a server.': '{count} வரி இந்தப் பக்கத்தில் சேர்க்கப்பட்டது. மாதிரி மாற்றங்கள் சேவையகத்தில் சேமிக்கப்படவில்லை.',
    'Added {count} rows to this page. Demo changes are not saved to a server.': '{count} வரிகள் இந்தப் பக்கத்தில் சேர்க்கப்பட்டன. மாதிரி மாற்றங்கள் சேவையகத்தில் சேமிக்கப்படவில்லை.',
    'The CSV file could not be read.': 'CSV கோப்பைப் படிக்க முடியவில்லை.',
    'Choose catalogue CSV': 'பட்டியல் CSV-ஐத் தேர்ந்தெடுக்கவும்',
    'Supplier CRM': 'விநியோகஸ்தர் CRM',
    'Export lead list': 'வாடிக்கையாளர் பட்டியலை ஏற்றுமதி செய்',
    'Account approved for {name} in this demo session.': '{name} கணக்கு இந்த மாதிரி அமர்வில் ஒப்புதல் பெற்றது.',
    'Documents requested from {name} for this demo session.': '{name} கணக்கிடமிருந்து ஆவணங்கள் கோரப்பட்டன.',
    'There are no pending sample accounts to approve.': 'ஒப்புதல் அளிக்க நிலுவையிலுள்ள மாதிரி கணக்குகள் இல்லை.',
    '{count} sample accounts approved for this demo session.': '{count} மாதிரி கணக்குகள் ஒப்புதல் பெற்றன.',
    'Review the submitted {type} for {name}.': '{name} கணக்கின் {type} ஆவணத்தை மதிப்பாய்வு செய்யவும்.',
    'Demo action only; no KYC documents are stored or checked.': 'இது மாதிரி செயல் மட்டுமே; KYC ஆவணங்கள் சேமிக்கப்படவோ சரிபார்க்கப்படவோ இல்லை.',
    'pending': 'நிலுவையில்',
    'review': 'மதிப்பாய்வு',
    'active SKUs': 'செயலில் உள்ள SKU-கள்',
    'Browser storage is unavailable; plan selection will only last until you leave this page.': 'உலாவி சேமிப்பு கிடைக்கவில்லை; இந்தப் பக்கத்தை விட்டு வெளியேறும் வரை மட்டுமே திட்டத் தேர்வு இருக்கும்.',
    'is your saved demo selection. Billing is not connected.': 'உங்கள் சேமிக்கப்பட்ட மாதிரி தேர்வு. கட்டண வசதி இணைக்கப்படவில்லை.',
    'is selected in this browser. Billing is not connected in this demo.': 'இந்த உலாவியில் தேர்ந்தெடுக்கப்பட்டது. மாதிரியில் கட்டணம் இணைக்கப்படவில்லை.',
    'is selected for this page only. Browser storage is unavailable; billing is not connected.': 'இந்தப் பக்கத்தில் மட்டும் தேர்ந்தெடுக்கப்பட்டது. உலாவி சேமிப்பு கிடைக்கவில்லை; கட்டணம் இணைக்கப்படவில்லை.',
    'km': 'கி.மீ.',
    'Add Google Maps API key to': 'Google Maps API key-ஐ இதில் சேர்க்கவும்:',
    'Enable Maps JavaScript API and billing for that key.': 'Maps JavaScript API மற்றும் billing-ஐ அந்த key-க்காக இயக்கவும்.',
    'Could not reach the demo sign-in service. Please try again.': 'மாதிரி உள்நுழைவு சேவையை அணுக முடியவில்லை. மீண்டும் முயற்சிக்கவும்.',
    'Unable to open this demo account.': 'இந்த மாதிரி கணக்கைத் திறக்க முடியவில்லை.',
    'Invalid login payload': 'உள்நுழைவு தகவல் தவறானது.',
    'Switch language to English': 'ஆங்கிலத்திற்கு மொழியை மாற்றவும்',
    'Basic': 'அடிப்படை',
    'Standard': 'தரநிலை',
    'Enterprise': 'நிறுவன',
    'Custom': 'தனிப்பயன்',
    'Compare Wholesale Medicine Prices Across Verified Suppliers.': 'சரிபார்க்கப்பட்ட விநியோகஸ்தர்களின் மொத்த மருந்து விலைகளை ஒப்பிடுங்கள்.',
    'Wholesale Drug Licence': 'மொத்த மருந்து உரிமம்',
    'Retail Drug Licence': 'சில்லறை மருந்து உரிமம்',
    'Connect Pharma respects your privacy. Information submitted through the platform is used only to provide marketplace, account, and support services. We do not sell personal information to third parties.': 'Connect Pharma உங்கள் தனியுரிமையை மதிக்கிறது. தளத்தின் மூலம் வழங்கப்படும் தகவல்கள் சந்தை, கணக்கு மற்றும் ஆதரவு சேவைகளுக்காக மட்டுமே பயன்படுத்தப்படும். தனிப்பட்ட தகவல்களை மூன்றாம் தரப்பினருக்கு விற்கமாட்டோம்.',
    'For privacy questions or data requests, contact': 'தனியுரிமை அல்லது தரவு கோரிக்கைகளுக்கு தொடர்பு கொள்ளவும்',
    'By using Connect Pharma, you agree to provide accurate information and use the platform lawfully. Suppliers are responsible for the accuracy of their listings, pricing, availability, licenses, and fulfilment terms.': 'Connect Pharma-ஐப் பயன்படுத்துவதன் மூலம் துல்லியமான தகவல்களை வழங்கவும் சட்டப்படி தளத்தைப் பயன்படுத்தவும் ஒப்புக்கொள்கிறீர்கள். பட்டியல், விலை, இருப்பு, உரிமம் மற்றும் நிறைவேற்ற நிபந்தனைகளின் துல்லியத்திற்கு விநியோகஸ்தர்களே பொறுப்பு.',
    'For terms and platform questions, contact': 'விதிமுறைகள் மற்றும் தளம் தொடர்பான கேள்விகளுக்கு தொடர்பு கொள்ளவும்'
  }
};

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  toggleLanguage: () => void;
  t: (text: string) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next);
    document.documentElement.lang = next;
    try {
      localStorage.setItem('connect-pharma-language', next);
    } catch {
      // Language remains active for this page when browser storage is unavailable.
    }
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguage(language === 'en' ? 'ta' : 'en');
  }, [language, setLanguage]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('connect-pharma-language');
      if (saved === 'en' || saved === 'ta') setLanguageState(saved);
    } catch {
      // Keep the default language when browser storage is unavailable.
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const value = useMemo<LanguageContextValue>(() => ({
    language,
    setLanguage,
    toggleLanguage,
    t: (text) => translations[language][text] ?? text
  }), [language, setLanguage, toggleLanguage]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider.');
  return context;
}
