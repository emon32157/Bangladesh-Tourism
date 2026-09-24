import { Destination } from '../types';
import { RAW_483_PLACES, RawPlace } from './raw483Places';

export const DIVISION_MAP_EN: Record<string, string> = {
  'ঢাকা বিভাগ': 'Dhaka Division',
  'চট্টগ্রাম বিভাগ': 'Chittagong Division',
  'রাজশাহী বিভাগ': 'Rajshahi Division',
  'খুলনা বিভাগ': 'Khulna Division',
  'বরিশাল বিভাগ': 'Barishal Division',
  'সিলেট বিভাগ': 'Sylhet Division',
  'রংপুর বিভাগ': 'Rangpur Division',
  'ময়মনসিংহ বিভাগ': 'Mymensingh Division',
};

export const DISTRICT_MAP_EN: Record<string, string> = {
  'ঢাকা': "Dhaka",
  'গাজীপুর': "Gazipur",
  'নারায়ণগঞ্জ': "Narayanganj",
  'মুন্সীগঞ্জ': "Munshiganj",
  'নরসিংদী': "Narsingdi",
  'মানিকগঞ্জ': "Manikganj",
  'টাঙ্গাইল': "Tangail",
  'কিশোরগঞ্জ': "Kishoreganj",
  'ফরিদপুর': "Faridpur",
  'গোপালগঞ্জ': "Gopalganj",
  'মাদারীপুর': "Madaripur",
  'রাজবাড়ী': "Rajbari",
  'শরীয়তপুর': "Shariatpur",
  'চট্টগ্রাম': "Chittagong",
  'কক্সবাজার': "Cox's Bazar",
  'বান্দরবান': "Bandarban",
  'রাঙ্গামাটি': "Rangamati",
  'খাগড়াছড়ি': "Khagrachhari",
  'কুমিল্লা': "Cumilla",
  'ব্রাহ্মণবাড়িয়া': "Brahmanbaria",
  'চাঁদপুর': "Chandpur",
  'ফেনী': "Feni",
  'নোয়াখালী': "Noakhali",
  'লক্ষ্মীপুর': "Lakshmipur",
  'সিলেট': "Sylhet",
  'মৌলভীবাজার': "Moulvibazar",
  'হবিগঞ্জ': "Habiganj",
  'সুনামগঞ্জ': "Sunamganj",
  'রাজশাহী': "Rajshahi",
  'নওগাঁ': "Naogaon",
  'বগুড়া': "Bogura",
  'নাটোর': "Natore",
  'চাঁপাইনবাবগঞ্জ': "Chapainawabganj",
  'পাবনা': "Pabna",
  'সিরাজগঞ্জ': "Sirajganj",
  'জয়পুরহাট': "Joypurhat",
  'খুলনা': "Khulna",
  'বাগেরহাট': "Bagerhat",
  'সাতক্ষীরা': "Satkhira",
  'যশোর': "Jashore",
  'ঝিনাইদহ': "Jhenaidah",
  'মাগুরা': "Magura",
  'মেহেরপুর': "Meherpur",
  'নড়াইল': "Narail",
  'চুয়াডাঙ্গা': "Chuadanga",
  'কুষ্টিয়া': "Kushtia",
  'বরিশাল': "Barishal",
  'পটুয়াখালী': "Patuakhali",
  'ভোলা': "Bhola",
  'ঝালকাঠি': "Jhalokathi",
  'পিরোজপুর': "Pirojpur",
  'বরগুনা': "Barguna",
  'ময়মনসিংহ': "Mymensingh",
  'নেত্রকোণা': "Netrokona",
  'শেরপুর': "Sherpur",
  'জামালপুর': "Jamalpur",
  'রংপুর': "Rangpur",
  'দিনাজপুর': "Dinajpur",
  'ঠাকুরগাঁও': "Thakurgaon",
  'পঞ্চগড়': "Panchagarh",
  'নীলফামারী': "Nilphamari",
  'লালমনিরহাট': "Lalmonirhat",
  'কুড়িগ্রাম': "Kurigram",
  'গাইবান্ধা': "Gaibandha"
};

const BN_DIGITS: Record<string, string> = {
  '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
  '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9'
};

const BN_ROMAN: Record<string, string> = {
  "অ": "o", "আ": "a", "ই": "i", "ঈ": "i", "উ": "u", "ঊ": "u", "ঋ": "ri", "এ": "e", "ঐ": "oi", "ও": "o", "ঔ": "ou",
  "ক": "k", "খ": "kh", "গ": "g", "ঘ": "gh", "ঙ": "ng", "চ": "ch", "ছ": "chh", "জ": "j", "ঝ": "jh", "ঞ": "n",
  "ট": "t", "ঠ": "th", "ড": "d", "ঢ": "dh", "ণ": "n", "ত": "t", "থ": "th", "দ": "d", "ধ": "dh", "ন": "n",
  "প": "p", "ফ": "ph", "ব": "b", "ভ": "bh", "ম": "m", "য": "y", "র": "r", "ল": "l", "শ": "sh", "ষ": "sh", "স": "s", "হ": "h",
  "ড়": "r", "ঢ়": "rh", "য়": "y", "ৎ": "t", "ং": "ng", "ঃ": "h", "ঁ": "n"
};

const BN_VOWELS: Record<string, string> = {
  "া": "a", "ি": "i", "ী": "i", "ু": "u", "ূ": "u", "ৃ": "ri", "ে": "e", "ৈ": "oi", "ো": "o", "ৌ": "ou"
};

export function romanizeBN(input: string): string {
  if (!input) return "";
  let out = "";
  let pendingConsonant = false;
  const chars = Array.from(input);
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    if (BN_DIGITS[ch]) {
      out += BN_DIGITS[ch];
      pendingConsonant = false;
      continue;
    }
    if (BN_VOWELS[ch]) {
      out += BN_VOWELS[ch];
      pendingConsonant = false;
      continue;
    }
    if (ch === "্") {
      pendingConsonant = true;
      continue;
    }
    if (BN_ROMAN[ch]) {
      const r = BN_ROMAN[ch];
      out += r;
      if (r && !pendingConsonant && !/[aeiou]$/.test(r)) out += "a";
      pendingConsonant = false;
      continue;
    }
    out += ch;
    pendingConsonant = false;
  }
  return out
    .replace(/aa/g, "a")
    .replace(/([a-z])a([aeiou])/g, "$1$2")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function getCategoryFallbackImage(category: string, district?: string): string {
  const cat = (category || '').toLowerCase();
  const dist = (district || '').toLowerCase();

  if (cat.includes('beach') || dist.includes('কক্সবাজার') || dist.includes('পটুয়াখালী') || dist.includes('বরগুনা')) {
    return "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80";
  }
  if (cat.includes('forest') || cat.includes('wildlife') || dist.includes('সুন্দরবন') || cat.includes('park')) {
    return "https://images.unsplash.com/photo-1602498456745-e9503b30470b?w=800&auto=format&fit=crop&q=80";
  }
  if (cat.includes('hill') || cat.includes('cave') || cat.includes('tea') || cat.includes('garden') || cat.includes('plantation')) {
    return "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&auto=format&fit=crop&q=80";
  }
  if (cat.includes('water') || cat.includes('river') || cat.includes('waterfall') || cat.includes('lake') || cat.includes('haor') || cat.includes('beel')) {
    return "https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?w=800&auto=format&fit=crop&q=80";
  }
  return "https://images.unsplash.com/photo-1588083949404-c4f1ed1323b3?w=800&auto=format&fit=crop&q=80";
}

export function getFeaturedVideoForPlace(raw: RawPlace): string | undefined {
  if ((raw as any).video_url) return (raw as any).video_url;
  if ((raw as any).videoUrl) return (raw as any).videoUrl;

  const name = (raw.name_bn || '') + ' ' + (raw.name_en || '') + ' ' + (raw.district || '');
  if (name.includes('কক্সবাজার') || name.includes("Cox's Bazar") || name.includes('ইনানী')) {
    return 'https://www.youtube.com/watch?v=kYJv8ZlX4Bw';
  }
  if (name.includes('সুন্দরবন') || name.includes('Sundarbans') || name.includes('কটকা')) {
    return 'https://www.youtube.com/watch?v=0kLhL7Z-L4g';
  }
  if (name.includes('সাজেক') || name.includes('Sajek') || name.includes('বান্দরবান')) {
    return 'https://www.youtube.com/watch?v=vV2tU4q45L4';
  }
  if (name.includes('শ্রীমঙ্গল') || name.includes('Sreemangal') || name.includes('চা বাগান')) {
    return 'https://www.youtube.com/watch?v=kYJv8ZlX4Bw';
  }
  if (name.includes('সেন্টমার্টিন') || name.includes("Saint Martin") || name.includes('ছেঁড়া দ্বীপ')) {
    return 'https://www.youtube.com/watch?v=0kLhL7Z-L4g';
  }
  if (name.includes('রাতারগুল') || name.includes('জাফলং') || name.includes('বিছানাকান্দি')) {
    return 'https://www.youtube.com/watch?v=vV2tU4q45L4';
  }
  if (name.includes('লালবাগ') || name.includes('আহসান মঞ্জিল') || name.includes('পাহাড়পুর')) {
    return 'https://www.youtube.com/watch?v=0kLhL7Z-L4g';
  }
  if (name.includes('কুয়াকাটা') || name.includes('Kuakata')) {
    return 'https://www.youtube.com/watch?v=kYJv8ZlX4Bw';
  }
  return undefined;
}

export function mapRawToDestination(raw: RawPlace): Destination {
  const titleEn = raw.name_en && raw.name_en.trim() ? raw.name_en : romanizeBN(raw.name_bn);
  const divEn = DIVISION_MAP_EN[raw.division] || raw.division;
  const distEn = DISTRICT_MAP_EN[raw.district] || romanizeBN(raw.district);

  let mappedCategory = 'heritage';
  const cLower = (raw.category || '').toLowerCase();
  if (cLower.includes('beach')) mappedCategory = 'coastal';
  else if (cLower.includes('forest') || cLower.includes('wildlife')) mappedCategory = 'wildlife';
  else if (cLower.includes('hill') || cLower.includes('cave') || cLower.includes('tea') || cLower.includes('garden')) mappedCategory = 'hills_tea';
  else if (cLower.includes('water') || cLower.includes('river') || cLower.includes('waterfall')) mappedCategory = 'river';

  const defaultImg = raw.image_url && raw.image_url.trim() ? raw.image_url : getCategoryFallbackImage(raw.category, raw.district);

  return {
    id: `spot-${raw.id}`,
    title: titleEn,
    titleBn: raw.name_bn,
    division: divEn,
    district: distEn,
    districtBn: raw.district,
    upazila: raw.upazila || '',
    address: raw.address || `${raw.name_bn}, ${raw.district}, Bangladesh`,
    googleMapsUrl: raw.google_maps_url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(raw.address || raw.name_bn)}`,
    lat: raw._map_lat || raw.latitude || 23.685,
    lng: raw._map_lng || raw.longitude || 90.3563,
    category: mappedCategory,
    image: defaultImg,
    tag: raw.category || "Tourist Spot",
    tagBn: raw.category || "পর্যটন স্থান",
    summary: raw.description ? raw.description.slice(0, 100) : `${titleEn} is a top tourist spot in ${distEn}, ${divEn}.`,
    summaryBn: raw.description ? raw.description.slice(0, 100) : `${raw.name_bn} - ${raw.district} জেলার আকর্ষণীয় পর্যটন স্থান।`,
    description: raw.description || `${titleEn} (${raw.name_bn}) is a famous tourist location situated at ${raw.address || raw.district + ', Bangladesh'}. It belongs to the ${raw.category} category.`,
    descriptionBn: raw.description || `${raw.name_bn} (${titleEn}) - ${raw.district} জেলার ${raw.category} পর্যটন আকর্ষণ। ঠিকানা: ${raw.address || (raw.name_bn + ', ' + raw.district)}।`,
    bestSeason: raw.best_time || "All Year",
    bestSeasonBn: raw.best_time || "সারা বছর",
    rating: 4.7,
    reviewsCount: 150 + (raw.id * 3) % 400,
    highlights: [raw.category || "Tourist Sight", `${raw.district} District Landmark`],
    duration: "1 Day",
    nearestAirport: "Dhaka / Regional Domestic Airport",
    videoUrl: getFeaturedVideoForPlace(raw),
  };
}

export function getAll483Destinations(): Destination[] {
  return RAW_483_PLACES.map(mapRawToDestination);
}
