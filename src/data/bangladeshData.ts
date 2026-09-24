import { Destination, Experience, Festival, EditorialStory, ItineraryPlan, CommunityPost } from '../types';
import { getAll483Destinations } from './placesMapper';

export const DESTINATIONS: Destination[] = getAll483Destinations();


export const EXPERIENCES: Experience[] = [
  {
    id: 'exp-1',
    title: "Sundarbans Deep Creek Silent Boat Safari",
    titleBn: "সুন্দরবনের শান্ত খালে নিঃশব্দ নৌকা সাফারি",
    category: "Wildlife & Nature",
    duration: "Half Day",
    icon: "🛶",
    description: "Glide silently through narrow mangrove creeks at dawn on a wooden hand-rowed canoe, listening to birdsong and watching for royal tigers and deer coming to drink.",
    descriptionBn: "ভোরের আলোয় কাঠের দেশি নৌকায় ম্যানগ্রোভের সরু খাঁড়ি দিয়ে যাত্রা—পাখির কলতান এবং বন্যপ্রাণীদের জলপানের দৃশ্য উপভোগ।",
    location: "Kotka & Katka Forest, Sundarbans",
    tag: "Ecological"
  },
  {
    id: 'exp-2',
    title: "Old Dhaka Heritage Walk & Rickshaw Art Tour",
    titleBn: "পুরান ঢাকার ঐতিহ্য ও রিকশা আর্ট পদযাত্রা",
    category: "Culture & Living Heritage",
    duration: "4-5 Hours",
    icon: "🎨",
    description: "Explore 400-year-old Mughal alleys of Old Dhaka, visit UNESCO-recognized rickshaw art workshops, Ahsan Manzil Pink Palace, and taste authentic Kachchi Biryani.",
    descriptionBn: "চারশত বছরের মোগল ইতিহাসসমৃদ্ধ পুরান ঢাকার অলিগলি, লালবাগ কেল্লা, ইউনেস্কো স্বীকৃত রিকশা পেইন্টিং ও ঐতিহ্যবাহী কাচ্চি বিরিয়ানির স্বাদ।",
    location: "Old Dhaka & Shakhari Bazaar",
    tag: "Art & Gastronomy"
  },
  {
    id: 'exp-3',
    title: "Tea Plucking & Master Tea Tasting Session",
    titleBn: "চা পাতা সংগ্রহ ও বিশেষজ্ঞ চা পানের অভিজ্ঞতা",
    category: "Culinary & Agriculture",
    duration: "3 Hours",
    icon: "🍵",
    description: "Walk side-by-side with generations of tea estate artisans, learn the delicate art of 'two leaves and a bud', and participate in a sommelier-style single-origin tea cupping.",
    descriptionBn: "চা কারিগরদের সাথে সবুজ বাগানে চায়ের কুঁড়ি তোলা এবং খাঁটি বাংলাদেশি চায়ের বিশেষ ফ্লেভার স্বাদ পরীক্ষা।",
    location: "Finlay Tea Estate, Sreemangal",
    tag: "Taste of Bengal"
  },
  {
    id: 'exp-4',
    title: "Traditional Jamdani Weaving Village Immersion",
    titleBn: "ঐতিহ্যবাহী জামদানি তাঁতি পল্লী দর্শন",
    category: "UNESCO Craft",
    duration: "Full Day",
    icon: "🧵",
    description: "Witness master handloom weavers on the banks of the Shitalakshya River creating fine muslin and Jamdani geometric motifs by hand from memory without printed stencils.",
    descriptionBn: "শীতলক্ষ্যা নদীর তীরে বংশপরম্পরায় কোনো ছাঁচ ছাড়া নিখুঁত স্মৃতি থেকে সূক্ষ্ম জামদানি শাড়ি বুননের দৃশ্য অবলোকন।",
    location: "Demra & Sonargaon, Narayanganj",
    tag: "Living Treasure"
  },
  {
    id: 'exp-5',
    title: "Backwaters & Floating Guava Market Odyssey",
    titleBn: "বরিশালের ব্যাকওয়াটার ও ভাসমান পেয়ারা হাট",
    category: "River & Rural Life",
    duration: "1 Day",
    icon: "🍉",
    description: "Navigate south Asia's Venice in Barishal: thousands of small wooden boats brimming with fresh green guavas, hog plums, and water lilies trading on tidal canals.",
    descriptionBn: "নদীবেষ্টিত বরিশালের খালের উপর শতাধিক নৌকার ভাসমান বাজার—স্থানীয় কৃষকদের কাছ থেকে তাজা ফল কেনার মনোমুগ্ধকর দৃশ্য।",
    location: "Bhimruli & Kirtipasha, Jhalakathi",
    tag: "Local Life"
  },
  {
    id: 'exp-6',
    title: "Sunset Over the Bay of Bengal on Marine Drive",
    titleBn: "মেরিন ড্রাইভে বঙ্গোপসাগরে রক্তিম সূর্যাস্ত",
    category: "Scenic Adventure",
    duration: "3 Hours",
    icon: "🌅",
    description: "Cruise in an open-air convertible along the world's longest marine drive, bordered by towering green cliffs on one side and turquoise waves on the other.",
    descriptionBn: "একপাশে পাহাড়ের সতেজ সবুজ, অন্যপাশে সমুদ্রের গর্জন—খোলা গাড়িতে মেরিন ড্রাইভ ভ্রমণের রোমাঞ্চকর অনুভূতি।",
    location: "Cox's Bazar to Teknaf Marine Drive",
    tag: "Coastal Ride"
  }
];

export const FESTIVALS: Festival[] = [
  {
    id: 'pohela-boishakh',
    title: "Pohela Boishakh (Bengali New Year)",
    titleBn: "পহেলা বৈশাখ (শুভ নববর্ষ)",
    date: "April 14 (Annually)",
    dateBn: "১৪ই এপ্রিল (প্রতি বছর)",
    location: "Ramna Batamul & Nationwide",
    locationBn: "রমনা বটমূল ও সমগ্র বাংলাদেশ",
    description: "The grandest non-communal cultural festival celebrating the first day of the Bengali solar calendar. Welcomed at sunrise with classical songs by Chhayanaut at Ramna Park, followed by the vibrant UNESCO-recognized Mangal Shobhajatra carnival parade.",
    descriptionBn: "বাংলা নববর্ষের প্রথম দিন। ভোরে রমনা বটমূলে ছায়ানটের সুরের মূর্ছনায় নতুন বছরকে বরণ এবং ইউনেস্কো স্বীকৃত মঙ্গল শোভাযাত্রার বর্ণিল আয়োজন।",
    emoji: "🐯",
    badge: "UNESCO Heritage Event"
  },
  {
    id: 'rash-mela',
    title: "Rash Mela & Dublar Char Gathering",
    titleBn: "রাস মেলা ও দুবলার চর উৎসব",
    date: "Full Moon of Kartik (November)",
    dateBn: "কার্তিক পূর্ণিমা (নভেম্বর)",
    location: "Dublar Char, Sundarbans",
    locationBn: "দুবলার চর, সুন্দরবন",
    description: "A two-century-old coastal spiritual festival where tens of thousands of pilgrims, fishermen, and travelers gather on an isolated sandy island in the Sundarbans under the full moon to bathe in the holy waters of the sea.",
    descriptionBn: "সুন্দরবনের বিচ্ছিন্ন দ্বীপ দুবলার চরে পূর্ণিমার চাঁদের আলোয় অনুষ্ঠিত শতবর্ষী ঐতিহ্যবাহী লোকজ মেলা ও সমুদ্র স্নান।",
    emoji: "🌕",
    badge: "Coastal Spiritual"
  },
  {
    id: 'nowka-bais',
    title: "Nowka Bais (Traditional Boat Racing)",
    titleBn: "ঐতিহ্যবাহী নৌকা বাইচ",
    date: "Monsoon & Autumn (July-October)",
    dateBn: "বর্ষা ও শরৎকাল (জুলাই-অক্টোবর)",
    location: "Buriganga, Padma & Meghna Rivers",
    locationBn: "বুড়িগঙ্গা, পদ্মা ও মেঘনা নদী",
    description: "Centuries-old folk sport where 100-foot slender wooden racing boats (Sarangas and Gheenis) powered by 80+ synchronized rowers sprint across mighty rivers to the rhythm of live dhol drums and folk chants.",
    descriptionBn: "বাংলার লোক সংস্কৃতির অন্যতম গৌরবময় উৎসব। ঢোলের তাল ও সারি গানের সুরে ৮০-১০০ জন মাঝির একসাথে দাঁড় টানার চোখ জুড়ানো প্রতিযোগিতা।",
    emoji: "🚣",
    badge: "Folk River Sport"
  },
  {
    id: 'dhaka-art-summit',
    title: "Dhaka Art Summit & Lit Fest",
    titleBn: "ঢাকা আর্ট সামিট ও লিট ফেস্ট",
    date: "Bi-annual (Winter)",
    dateBn: "দ্বিবার্ষিক (শীতকাল)",
    location: "Bangladesh Shilpakala Academy",
    locationBn: "বাংলাদেশ শিল্পকলা একাডেমি, ঢাকা",
    description: "South Asia's premier international contemporary art and architecture festival, bringing together global thinkers, artists, writers, and cultural icons for immersive public exhibitions.",
    descriptionBn: "দক্ষিণ এশিয়ার বৃহত্তম সমকালীন শিল্প ও সাহিত্যের আন্তর্জাতিক মিলনমেলা, যেখানে বিশ্ববরেণ্য শিল্পী ও চিন্তাবিদরা একত্রিত হন।",
    emoji: "🎭",
    badge: "Contemporary Arts"
  }
];

export const EDITORIAL_STORIES: EditorialStory[] = [
  {
    id: 'story-jamdani',
    title: "The Gossamer Thread: Reviving Bengal's Imperial Jamdani",
    titleBn: "মসলিনের উত্তরসূরি: ঐতিহ্যের জামদানি শিল্প",
    author: "Farhana Ahmed",
    readTime: "6 min read",
    category: "Heritage & Craft",
    date: "Autumn Issue 2024",
    image: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=1000&auto=format&fit=crop&q=80",
    videoUrl: '<iframe width="560" height="315" src="https://www.youtube.com/embed/vV2tU4q45L4" title="YouTube video player" frameborder="0" allowfullscreen></iframe>',
    excerpt: "On the breezy banks of the Shitalakshya River, generational weavers continue to practice an art form once favored by Mughal emperors.",
    excerptBn: "শীতলক্ষ্যা নদীর তীরে বংশপরম্পরায় মোগল রাজদরবারে সমাদৃত সূক্ষ্ম জামদানি বুননের জাদুকরী গল্প।",
    pullQuote: "“We don’t draw the patterns on paper. The motifs live in our eyes and the rhythm of our hands.”",
    content: [
      "For centuries, Bengal was world-renowned for its legendary Dhaka Muslin—a fabric so ethereal that an entire saree could pass through a woman's finger ring. While original Dhaka cotton vanished in the colonial era, its artistic heir, Jamdani, continues to flourish in the weaving villages of Sonargaon and Demra.",
      "Jamdani weaving is recognized by UNESCO as an Intangible Cultural Heritage of Humanity. What sets it apart from all other textile traditions is the supplemental weft technique: master weavers sit at wooden pit-looms in pairs, inserting geometric floral and peacock motifs by hand using bamboo needles (kandis) without any pre-drawn templates or mechanical automation.",
      "Today, young textile revivalists and master weavers are collaborating to blend organic natural dyes—indigo, madder, pomegranate rinds, and catechu—ensuring that this treasured thousand-year-old art form thrives sustainably for generations to come."
    ]
  },
  {
    id: 'story-sundarbans',
    title: "Tides, Tigers, and Bonbibi: Living on the Edge of the Mangroves",
    titleBn: "ভাটির দেশের গল্প: সুন্দরবনের বনবিবি ও জীবন সংগ্রাম",
    author: "Tanvir Chowdhury",
    readTime: "8 min read",
    category: "Nature & Ecology",
    date: "Monsoon Issue 2024",
    image: "https://images.unsplash.com/photo-1544644181-1484b3fdfc62?w=1000&auto=format&fit=crop&q=80",
    videoUrl: 'https://www.youtube.com/watch?v=0kLhL7Z-L4g',
    excerpt: "In the world's largest mangrove forest, honey hunters and fishermen place their faith in Bonbibi, the guardian spirit of the woods.",
    excerptBn: "জোয়ার-ভাটার লীলাভূমি সুন্দরবনের মৌয়াল ও বাওয়ালিদের অসীম সাহসিকতা এবং বনবিবির ঐতিহ্যবাহী আখ্যান।",
    pullQuote: "“The forest does not belong to humans or to the tiger; it belongs to the balance between the two.”",
    content: [
      "Twice every day, the tides of the Bay of Bengal flood and recede through thousands of serpentine waterways, entirely reshaping the topography of the Sundarbans. Here, land and water exist in constant transformation.",
      "For the Mauals (traditional honey collectors) who brave dense mangrove thickets every spring to harvest wild honeycomb from the giant Asian honey bee, danger is constant. Before stepping foot into the forest, every harvester—regardless of religion—bows before shrines of Bonbibi, offering prayers for safe passage through the territory of the Royal Bengal Tiger.",
      "Eco-tourism in the Sundarbans has evolved: travelers now board low-impact wooden cruising vessels equipped with solar power, sailing deep into silent reserves where kingfishers dart over mudflats and spotted deer graze beneath tall Sundari and Golpata trees."
    ]
  },
  {
    id: 'story-flavors',
    title: "A Culinary Cartography: From Coastal Hilsa to Seven-Layer Tea",
    titleBn: "বাংলার স্বাদভ্রমণ: পদ্মার ইলিশ থেকে সাত রঙের চা",
    author: "Shamsul Alam",
    readTime: "5 min read",
    category: "Gastronomy",
    date: "Winter Issue 2024",
    image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=1000&auto=format&fit=crop&q=80",
    videoUrl: 'https://youtu.be/kYJv8ZlX4Bw',
    excerpt: "Exploring the rich culinary geography of Bangladesh through mustard-steamed Padma Hilsa, Old Dhaka biryani, and artisanal sweets.",
    excerptBn: "সর্ষে ইলিশ, পুরান ঢাকার কাচ্চি, খুলনার চুইঝাল এবং নাটোরের কাঁচাগোল্লা—স্বাদের এক সমৃদ্ধ ঐতিহ্য।",
    pullQuote: "“Food in Bengal is not merely nourishment; it is our primary language of hospitality and poetic celebration.”",
    content: [
      "To understand Bangladesh, one must understand its kitchens. The national fish, Ilish (Hilsa), caught from the sparkling waters of the Padma and Meghna rivers, is celebrated in dozens of preparation styles: Shorshe Ilish (mustard steam), Ilish Polao, and Bhapa Ilish wrapped in banana leaves.",
      "Travel further north and east to Sreemangal, and you encounter the legendary Nilkantha Tea Cabin where layers of green, black, and condensed-milk spiced tea sit in gravity-defying strata inside a single glass goblet.",
      "Meanwhile, the historic sweetmeat artisans of Natore (Kanchagolla), Tangail (Chomchom), and Comilla (Rasmalai) preserve century-old dairy confectionery techniques using slow-simmered pure cow milk curds."
    ]
  }
];

export const ITINERARY_PLANS: ItineraryPlan[] = [
  {
    id: 'plan-3days',
    days: 3,
    title: "Capital & Mangrove Wilderness Highlights",
    titleBn: "ঢাকা ও সুন্দরবনের ৩ দিনের সংক্ষিপ্ত সফর",
    focus: "Mughal History + Sundarbans Boat Cruise",
    recommendedFor: "Short-break explorers & history enthusiasts",
    daysList: [
      {
        day: 1,
        title: "Old Dhaka Mughal & River Heritage",
        description: "Visit Lalbagh Fort, Ahsan Manzil Pink Palace, Armenian Church, and embark on a private sunset wooden boat ride along the Buriganga River.",
        location: "Dhaka"
      },
      {
        day: 2,
        title: "Journey to Khulna & Forest Gateway",
        description: "Fly to Jashore/Khulna, board your boutique river cruiser at Mongla Port, and sail through Sundarbans tidal channels to Kotka Wildlife Sanctuary.",
        location: "Khulna & Sundarbans"
      },
      {
        day: 3,
        title: "Silent Creek Safari & Tiger Watchtower",
        description: "Dawn canoe safari through narrow mangrove creeks, visit Katka watchtower for deer herds, and tour Karamjal wildlife rehabilitation center.",
        location: "Sundarbans Biosphere"
      }
    ]
  },
  {
    id: 'plan-7days',
    days: 7,
    title: "Grand Bangladesh: Tea Hills, Ancient Viharas & Bay of Bengal",
    titleBn: "৭ দিনের ক্লাসিক বাংলাদেশ পরিভ্রমণ",
    focus: "Archaeology, Tea Estates, Tropical Beaches",
    recommendedFor: "First-time international travelers & cultural explorers",
    daysList: [
      {
        day: 1,
        title: "Arrival in Dhaka & Textile Walk",
        description: "Explore Dhaka historical quarter and visit Jamdani weaving workshops in Sonargaon.",
        location: "Dhaka / Sonargaon"
      },
      {
        day: 2,
        title: "Paharpur Buddhist Somapura Mahavihara",
        description: "Travel to Rajshahi region to marvel at the 8th-century UNESCO monastery and terracotta architecture.",
        location: "Naogaon / Rajshahi"
      },
      {
        day: 3,
        title: "Scenic Train to the Tea Capital Sreemangal",
        description: "Scenic overland journey to lush tea gardens, visit Lawachara rainforest for hoolock gibbons.",
        location: "Sreemangal"
      },
      {
        day: 4,
        title: "Tea Tasting & Ratargul Freshwater Swamp Forest",
        description: "Morning tea estate cycling and afternoon wooden boat ride through the submerged canopy of Ratargul.",
        location: "Sylhet"
      },
      {
        day: 5,
        title: "Flight to Cox's Bazar & Marine Drive Coast",
        description: "Fly south to Cox's Bazar. Check into coastal resort and take an open-top ride down the Marine Drive.",
        location: "Cox's Bazar"
      },
      {
        day: 6,
        title: "Saint Martin's Coral Island Excursion",
        description: "Board sea cruise to Saint Martin's Island. Snorkel over reefs and explore the peaceful shores of Chera Dwip.",
        location: "Saint Martin's Island"
      },
      {
        day: 7,
        title: "Himchari Waterfalls & Return to Dhaka",
        description: "Morning beachcombing, Inani coral stone walks, and evening departure back to Dhaka.",
        location: "Cox's Bazar / Dhaka"
      }
    ]
  }
];

export const BANGLADESH_FACTS = [
  { label: "Geography", labelBn: "ভৌগোলিক আয়তন", value: "147,570 sq km", valueBn: "১,৪৭,৫৭০ বর্গ কিমি" },
  { label: "Official Language", labelBn: "রাষ্ট্রভাষা", value: "Bengali (Bangla)", valueBn: "বাংলা" },
  { label: "Climate", labelBn: "জলবায়ু", value: "Tropical Monsoon", valueBn: "গ্রীষ্মমণ্ডলীয় মৌসুমি" },
  { label: "River Network", labelBn: "নদী ব্যবস্থা", value: "700+ Rivers & Tributaries", valueBn: "৭০০+ নদ-নদী" },
  { label: "UNESCO Heritage", labelBn: "ইউনেস্কো ঐতিহ্য", value: "3 World Heritage Sites", valueBn: "৩টি বিশ্ব ঐতিহ্য" },
];

export const SEED_COMMUNITY_POSTS: CommunityPost[] = [
  {
    id: 'seed-1',
    userId: 'traveler_1',
    userName: 'Rashidul Hasan',
    userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    title: 'Morning mist over Ratargul Swamp Forest',
    caption: 'Navigating through the emerald green waters in a traditional wooden dinghy. Truly the Amazon of Bangladesh.',
    location: 'Ratargul, Sylhet',
    division: 'sylhet',
    imageUrl: 'https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?auto=format&fit=crop&w=1000&q=80',
    videoUrl: '<iframe width="560" height="315" src="https://www.youtube.com/embed/vV2tU4q45L4" frameborder="0" allowfullscreen></iframe>',
    likesCount: 42,
    likedBy: [],
    createdAt: Date.now() - 86400000 * 2,
    tags: ['Sylhet', 'SwampForest', 'Kayaking'],
  },
  {
    id: 'seed-2',
    userId: 'traveler_2',
    userName: 'Farzana Chowdhury',
    userAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80',
    title: 'Golden Hour at Saint Martin’s Coral Island',
    caption: 'Crystal clear azure waters and fresh green coconuts right at Chera Dwip point.',
    location: "Saint Martin's Island, Cox's Bazar",
    division: 'chittagong',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=80',
    videoUrl: 'https://www.youtube.com/watch?v=kYJv8ZlX4Bw',
    likesCount: 89,
    likedBy: [],
    createdAt: Date.now() - 86400000 * 4,
    tags: ['Island', 'Coral', 'BeachSunset'],
  },
  {
    id: 'seed-3',
    userId: 'traveler_3',
    userName: 'Sabbir Hossain',
    userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    title: 'Majestic Somapura Mahavihara Terracotta',
    caption: 'Ancient 8th-century Buddhist architecture standing with grand spiritual serenity in Naogaon.',
    location: 'Paharpur, Naogaon',
    division: 'rajshahi',
    imageUrl: 'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1000&q=80',
    videoUrl: 'https://www.youtube.com/watch?v=0kLhL7Z-L4g',
    likesCount: 35,
    likedBy: [],
    createdAt: Date.now() - 86400000 * 6,
    tags: ['UNESCO', 'History', 'Archaeology'],
  },
];

