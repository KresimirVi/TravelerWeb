require("dotenv").config();
const { pool } = require("./pool");

const img = (id, w = 800) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

// slike od apartmana, stavljene random po objektima
const USER_PHOTOS = [
  "Screenshot_2026-09-06_185527.png",
  "Screenshot_2026-09-06_185533.png",
  "Screenshot_2026-09-06_185539.png",
  "Screenshot_2026-09-06_185549.png",
  "Screenshot_2026-09-06_185555.png",
  "Screenshot_2026-09-06_185604.png",
  "Screenshot_2026-09-06_185610.png",
  "Screenshot_2026-09-06_185615.png",
  "Screenshot_2026-09-06_185621.png",
  "Screenshot_2026-09-06_190248.png",
  "Screenshot_2026-09-06_190256.png",
  "Screenshot_2026-09-06_190304.png",
  "Screenshot_2026-09-06_190310.png",
  "Screenshot_2026-09-06_190317.png",
  "Screenshot_2026-09-06_190321.png",
  "Screenshot_2026-09-06_190326.png",
  "Screenshot_2026-09-06_190334.png",
  "Screenshot_2026-09-06_190346.png",
  "Screenshot_2026-09-06_190445.png",
  "Screenshot_2026-09-06_190452.png",
  "Screenshot_2026-09-06_190456.png",
  "Screenshot_2026-09-06_190500.png",
  "Screenshot_2026-09-06_190505.png",
  "Screenshot_2026-09-06_190509.png",
  "Screenshot_2026-09-06_190513.png",
  "Screenshot_2026-09-06_190518.png",
  "Screenshot_2026-09-06_190522.png",
  "Screenshot_2026-09-06_190532.png",
  "Screenshot_2026-09-06_190538.png",
  "Screenshot_2026-09-06_190545.png",
  "Screenshot_2026-09-06_190725.png",
  "Screenshot_2026-09-06_190744.png",
  "Screenshot_2026-09-06_190751.png",
  "Screenshot_2026-09-06_190756.png",
  "Screenshot_2026-09-06_190805.png",
  "Screenshot_2026-09-06_190810.png",
  "Screenshot_2026-09-06_190815.png",
  "Screenshot_2026-09-06_190819.png",
  "Screenshot_2026-09-06_190823.png",
  "Screenshot_2026-09-06_190828.png",
  "Screenshot_2026-09-06_191231.png",
  "Screenshot_2026-09-06_191236.png",
  "Screenshot_2026-09-06_191242.png",
  "Screenshot_2026-09-06_191246.png",
  "Screenshot_2026-09-06_191252.png",
  "Screenshot_2026-09-06_191257.png",
  "Screenshot_2026-09-06_191304.png",
  "Screenshot_2026-09-06_191310.png",
  "Screenshot_2026-09-06_191315.png",
  "Screenshot_2026-09-06_191420.png",
  "Screenshot_2026-09-06_191427.png",
  "Screenshot_2026-09-06_191431.png",
  "Screenshot_2026-09-06_191443.png",
  "Screenshot_2026-09-06_191448.png",
  "Screenshot_2026-09-06_191454.png",
  "Screenshot_2026-09-06_191459.png",
  "Screenshot_2026-09-06_191505.png",
  "Screenshot_2026-09-06_191512.png",
  "Screenshot_2026-09-06_191517.png",
  "Screenshot_2026-09-06_191525.png",
  "Screenshot_2026-09-06_191532.png",
  "Screenshot_2026-09-06_191538.png",
  "Screenshot_2026-09-06_191546.png",
  "Screenshot_2026-09-06_191555.png",
  "Screenshot_2026-09-06_191607.png",
  "Screenshot_2026-09-06_191717.png",
  "Screenshot_2026-09-06_191723.png",
  "Screenshot_2026-09-06_191733.png",
  "Screenshot_2026-09-06_191740.png",
  "Screenshot_2026-09-06_191746.png",
  "Screenshot_2026-09-06_191752.png",
  "Screenshot_2026-09-06_191758.png",
  "Screenshot_2026-09-06_191808.png",
  "Screenshot_2026-09-06_191822.png",
  "Screenshot_2026-09-06_191831.png",
  "Screenshot_2026-09-06_191839.png",
  "Screenshot_2026-09-06_191850.png",
  "Screenshot_2026-09-06_191859.png",
  "Screenshot_2026-09-06_191914.png",
  "Screenshot_2026-09-06_191926.png",
];
const USER_PHOTO_URLS = USER_PHOTOS.map((name) => `/uploads/seed-photos/${name}`);

const ALL_EXTERIORS = [
  "1730131255658-c51e724003c2",
  "1667388487644-b8c64c213f84",
  "1729881001108-93ceee132220",
  "1704750843798-e7655f99a643",
  "1692886760687-018a851f5fb3",
  "1592965799290-4a4efc591de9",
  "1650134405603-ceacf013fbf0",
  "1679757244096-f8df3f2999d5",
  "1681038267437-e1fc3f85e1cf",
  "1592928578997-335917adaa98",
  "1611046594907-4effcd809241",
  "1786966485314-47d35985e5d3",
  "1597211833712-5e41faa202ea",
  "1620674288932-37726b796715",
  "1597211887448-57b1d99d1d1c",
  "1616367201645-6f01b8987266",
  "1622473635194-f928d7b02a72",
  "1713121577029-bf271baec1c5",
  "1656326125839-d3c414764674",
  "1622473542222-6717ac349a10",
  "1697529291604-6f56bca13bea",
  "1661722086407-06dc1eaed4e1",
  "1697529589486-4b167b1ba3f8",
  "1622473431797-f665cfb3f3fa",
  "1579297206620-c410c4af42e4",
  "1622908382850-34730895ccbb",
  "1621130374394-cfc01968b350",
  "1666846795617-5a79453e6f6c",
  "1696530806145-5b3fb818e063",
  "1668309063969-40d905e867ed",
  "1666071120353-1ee282d5baf4",
  "1772465971105-44c306f9c1cc",
  "1659559108995-a41c413392d6",
  "1771526162649-09ba7cfbf8e3",
].map((i) => img(i, 1200));

const ROOM_TAGS = ["exterior", "bedroom", "bedroom", "bathroom", "bathroom", "kitchen", "kitchen", "living_room", "living_room", "living_room"];

function buildGallery(type, coverUrl, globalIndex) {
  const offset = globalIndex * 9;
  const pick = (start, count) =>
    Array.from({ length: count }, (_, i) => USER_PHOTO_URLS[((start + i) * 7) % USER_PHOTO_URLS.length]);

  return [coverUrl, ...pick(offset, 9)];
}

function coverFor(globalIndex) {
  return ALL_EXTERIORS[globalIndex % ALL_EXTERIORS.length];
}

const REVIEWER_NAMES = [

  "Ana Kovačević", "Marko Perić", "Ivana Horvat", "Petar Jurić", "Maja Babić",
  "Luka Marić", "Nina Kovač", "Filip Radić", "Sara Novak", "Josip Barišić",
  "Amila Hodžić", "Emir Salihović", "Selma Begić", "Amir Kovačević", "Lejla Hasić",
  "Damir Vuković", "Jovana Milić", "Nikola Popović", "Tea Šimić", "Mate Vidović",
  "Nejra Delić", "Adnan Hodžić", "Anja Zupan", "Rok Kovačič", "Nina Novak",
  "Marta Perišić", "Ivan Tomić", "Dora Grgić", "Toni Vlašić", "Ema Petrović",
  "Vedran Kovač", "Dženana Alić", "Stefan Jovanović", "Milica Stanković", "Goran Blažević",
  "Ivona Matić", "Denis Softić", "Klara Kramar", "Bojan Đurić", "Petra Radman",

  "Emma Wilson", "James Anderson", "Sarah Thompson", "Michael Brown", "Laura Davies",
  "Hans Müller", "Sophie Bauer", "Lukas Schmidt", "Marie Dubois", "Pierre Lefèvre",
  "Giulia Romano", "Marco Ferrari", "Yuki Tanaka", "Haruto Sato", "Wei Chen",
  "Li Wei", "Priya Sharma", "Arjun Patel", "Carlos Silva", "Ana Souza",
  "Fatima Al-Rashid", "Omar Hassan", "Chidi Okafor", "Amara Nwosu", "Liam O'Connor",
  "Olivia Clarke", "Noah Andersen", "Freya Larsen", "Mateusz Kowalski", "Zofia Nowak",
];

const REVIEW_COMMENTS_HR_POSITIVE = [
  "Sve je bilo baš onako kako je opisano, preporučujem svima.",
  "Domaćin je bio jako ljubazan i sve nam je odlično objasnio.",
  "Čisto, uredno i mirno — ono što smo tražili za odmor.",
  "Vratili bismo se ponovo, prelijep pogled sa terase.",
  "Fotografije odgovaraju stvarnosti, nema iznenađenja.",
  "Kuhinja je bila potpuno opremljena, nismo ništa nedostajali.",
  "Wifi je radio bez problema cijelo vrijeme boravka.",
];
const REVIEW_COMMENTS_HR_MIXED = [
  "Lokacija je odlična, blizu svega, ali malo bučno noću.",
  "Malo teže za parkiranje, ali sve ostalo je bilo super.",
  "Malo je udaljeno od centra nego što smo mislili, ali ugodno.",
  "Prosječan smještaj, ništa posebno ali ni loše.",
];
const REVIEW_COMMENTS_HR_NEGATIVE = [
  "Nažalost, čistoća nije bila na nivou, očekivali smo bolje.",
  "Za tu cijenu, moglo je biti mnogo bolje opremljeno.",
  "Osoblje je bilo neljubazno, nećemo se vraćati.",
  "Buka sa ulice nam je pokvarila boravak, teško se spavalo.",
];

const REVIEW_COMMENTS_EN_POSITIVE = [
  "Exactly as described, would definitely recommend to friends.",
  "Host was incredibly responsive and helpful throughout our stay.",
  "Clean, quiet, and exactly what we needed for a relaxing break.",
  "We'd come back again, the view from the terrace was stunning.",
  "Photos match reality perfectly, no surprises at all.",
  "Kitchen was fully equipped, we didn't miss anything.",
];
const REVIEW_COMMENTS_EN_MIXED = [
  "Great location, close to everything, though a bit noisy at night.",
  "Parking was a bit tricky to find but everything else was great.",
];
const REVIEW_COMMENTS_EN_NEGATIVE = [
  "Disappointing for the price, expected much more.",
  "Not as clean as we hoped, could use better maintenance.",
];

function pickCommentPool(stars, isEnglish) {
  const positive = isEnglish ? REVIEW_COMMENTS_EN_POSITIVE : REVIEW_COMMENTS_HR_POSITIVE;
  const mixed = isEnglish ? REVIEW_COMMENTS_EN_MIXED : REVIEW_COMMENTS_HR_MIXED;
  const negative = isEnglish ? REVIEW_COMMENTS_EN_NEGATIVE : REVIEW_COMMENTS_HR_NEGATIVE;
  if (stars >= 4) return positive;
  if (stars === 3) return mixed;
  return negative;
}

const { coordsForLocation, streetFor } = require("./cityCoords");

const OWNER_NAMES = [
  "Ivan Kovačević", "Marija Perić", "Ante Horvat", "Ana Jurić", "Marko Babić",
  "Petra Marić", "Josip Novak", "Lucija Radić", "Tomislav Barišić", "Katarina Šimić",
  "Emir Hodžić", "Amina Begić", "Adnan Salihović", "Selma Kovačević", "Haris Delić",
  "Nikola Popović", "Jovana Milić", "Stefan Jovanović", "Milica Stanković", "Vuk Đurić",
  "Rok Kovačič", "Ana Novak", "Luka Zupan", "Nina Kramar", "Miha Golob",
];
const OWNER_EMAIL_DOMAINS = ["gmail.com", "outlook.com", "yahoo.com", "hotmail.com"];
const PHONE_PREFIXES = {
  "Hrvatska": "+385 9",
  "Bosna i Hercegovina": "+387 6",
  "Slovenija": "+386 3",
};

function ownerEmailFrom(name, seed) {
  const ascii = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  const [first, last] = ascii.split(" ");
  const domain = OWNER_EMAIL_DOMAINS[seed % OWNER_EMAIL_DOMAINS.length];
  return `${first}.${last}@${domain}`;
}

function ownerPhoneFor(country, seed) {
  const prefix = PHONE_PREFIXES[country] || "+385 9";
  const n1 = 1 + (seed % 9);
  const n2 = String(100000 + ((seed * 37) % 900000)).slice(0, 6);
  return `${prefix}${n1} ${n2.slice(0, 3)} ${n2.slice(3)}`;
}

const SEED_DATA_VERSION = "9";

const RAW = [

  ["hotel", "Villa Orsula", "Stari Grad, Dubrovnik", "Hrvatska", 1.1, 4.9, 482, 320, "Uz more",
    "Vila iz 1930-ih smještena na litici tik iznad mora, samo pet minuta hoda od gradskih zidina. Terasa restorana gleda direktno na otok Lokrum, a privatna plaža ispod vile dostupna je stepenicama uklesanim u kamen.",
    ["Besplatan WiFi", "Klima", "Privatna kupaonica", "Terasa", "Bazen", "Spa", "Restoran", "Parking"]],
  ["hotel", "Hotel Excelsior", "Ploče, Dubrovnik", "Hrvatska", 1.8, 4.8, 361, 289, "Panorama",
    "Klasični hotel s pogledom na stare gradske zidine i otvoreno more, u pješačkoj udaljenosti od Straduna. Sobe s balkonom gledaju na zalazak sunca, a hotelska plaža ima pristup direktno sa stjenovite obale.",
    ["Besplatan WiFi", "Klima", "Privatna kupaonica", "Bazen", "Spa", "Wellness centar", "Room service"]],
  ["hotel", "Suncokret Resort", "Hvar, otok Hvar", "Hrvatska", 3.4, 4.7, 298, 245, "Najbolja ponuda",
    "Resort okružen borovom šumom i lavandom, s krovnim bazenom koji gleda na hvarsku luku i Paklinske otoke. Večernji glazbeni program na terasi traje do kasno u noć ljeti.",
    ["Besplatan WiFi", "Klima", "Bazen", "Beach bar", "Iznajmljivanje brodica", "Restoran"]],
  ["hotel", "Palača Riva", "Riva, Split", "Hrvatska", 0.4, 4.6, 214, 198, "Popularno",
    "Butik hotel unutar zidina Dioklecijanove palače, korak od rive i trajektne luke. Kameni svodovi iz 4. stoljeća kombinirani su s modernim enterijerom, a krovna terasa nudi pogled na cijelu splitsku luku.",
    ["Besplatan WiFi", "Klima", "Krovna terasa", "Doručak uključen", "Concierge"]],
  ["hotel", "Pozdrav Suncu Resort", "Poluotok, Zadar", "Hrvatska", 2.7, 4.8, 407, 210, "Popularno",
    "Smješten uz čuvenu Morske orgulje i Pozdrav suncu, ovaj resort nudi terase okrenute prema otvorenom moru gdje se svake večeri okuplja cijeli grad da gleda zalazak. Bazen s morskom vodom otvoren je cijelo ljeto.",
    ["Besplatan WiFi", "Klima", "Bazen s morskom vodom", "Beach bar", "Biciklističke rute"]],

  ["hostel", "Hostel Angelina Old Town", "Stari Grad, Dubrovnik", "Hrvatska", 0.3, 4.5, 612, 24, "Backpacker",
    "Hostel u kamenoj kući u srcu Starog grada, s krovnom terasom gdje se svako veče okupljaju gosti iz cijelog svijeta. Kreveti na sprat u miješanim i ženskim sobama, uz zajedničku kuhinju otvorenu 24 sata.",
    ["Besplatan WiFi", "Zajednička kuhinja", "Ormarić sa ključem", "Krovna terasa", "Klima"]],
  ["hostel", "Hostel Central Split", "Varoš, Split", "Hrvatska", 0.6, 4.4, 389, 21, "Blizu rive",
    "Renoviran hostel u staroj splitskoj četvrti Varoš, pet minuta hoda od Peristila. Zajednički dnevni boravak s knjigama i pločama nudi opušteno mjesto za upoznavanje ostalih putnika.",
    ["Besplatan WiFi", "Zajednička kuhinja", "Zajednički boravak", "Ormarić sa ključem", "Perilica rublja"]],
  ["hostel", "Hostel Zaton Backpackers", "Zaton, Zadar", "Hrvatska", 5.2, 4.3, 178, 19, "Uz plažu",
    "Opušten hostel u malom mjestu Zaton, nekoliko koraka od pješčane plaže. Vrt s ležaljkama i besplatnim biciklima čini ga popularnim među budžetskim putnicima koji istražuju sjeverni Jadran.",
    ["Besplatan WiFi", "Zajednička kuhinja", "Vrt", "Iznajmljivanje bicikala", "Parking"]],
  ["hostel", "Hostel Vagabond", "Groda, Hvar", "Hrvatska", 0.5, 4.6, 245, 26, "Za druženje",
    "Mali hostel iznad hvarske luke s terasom koja gleda na tvrđavu Fortica. Poznat po zajedničkim večerama koje organizuje osoblje svakog utorka, uz lokalno vino iz susjednih vinograda.",
    ["Besplatan WiFi", "Zajednička kuhinja", "Terasa", "Ormarić sa ključem", "Klima"]],

  ["apartman", "Apartman Lapad", "Lapad, Dubrovnik", "Hrvatska", 3.1, 4.7, 156, 128, "Porodično",
    "Prostran apartman na poluotoku Lapad, dvije minute hoda od pješčane plaže Copacabana. Odvojena spavaća soba i potpuno opremljena kuhinja čine ga pogodnim za duži boravak porodice.",
    ["Besplatan WiFi", "Klima", "Kuhinja", "Balkon", "Parking", "Perilica rublja"]],
  ["apartman", "Apartman Sunčani Vrt", "Cavtat", "Hrvatska", 15.4, 4.8, 92, 105, "Mirna lokacija",
    "Apartman u prizemlju kuće s vlastitim vrtom punim maslina, deset minuta hoda od cavtatske rive. Idealan za goste koji žele mir izvan gužve dubrovačkog centra, uz redovne autobusne veze do grada.",
    ["Besplatan WiFi", "Klima", "Kuhinja", "Vrt", "Roštilj", "Parking"]],
  ["apartman", "Apartman Pjaca", "Narodni trg, Split", "Hrvatska", 0.2, 4.6, 203, 134, "Centar grada",
    "Apartman na katu stare zgrade iznad splitskog Narodnog trga, s pogledom na kameni pločnik ispod prozora. Kuhinja i dnevni boravak spojeni su u jedan svijetli prostor s visokim stropovima.",
    ["Besplatan WiFi", "Klima", "Kuhinja", "Perilica rublja", "Sef"]],
  ["apartman", "Apartman Vela Luka", "Vela Luka, Korčula", "Hrvatska", 8.7, 4.7, 87, 98, "Uz marinu",
    "Apartman s pogledom na uvalu Vele Luke i lokalnu marinu za jedrilice. Terasa s vanjskim stolom za ručavanje savršena je za večere uz zalazak sunca nakon dana provedenog na obližnjim plažama.",
    ["Besplatan WiFi", "Klima", "Kuhinja", "Terasa", "Parking"]],
  ["apartman", "Apartman Punta Skala", "Petrčane, Zadar", "Hrvatska", 12.3, 4.8, 141, 121, "Uz plažu",
    "Moderan apartman u naselju Punta Skala, okružen borovom šumom koja se spušta do mora. Zajednički bazen naselja dostupan je svim gostima, uz privatnu terasu apartmana.",
    ["Besplatan WiFi", "Klima", "Kuhinja", "Bazen", "Balkon", "Parking"]],

  ["vikendica", "Vikendica Borovnjak", "Žrnovnica, Split", "Hrvatska", 9.8, 4.8, 64, 165, "Cijeli objekat",
    "Kamena vikendica u podnožju Mosora, okružena borovima i tišinom, dvadesetak minuta vožnje od splitske rive. Vanjski roštilj i velika terasa čine je pogodnom za obiteljska okupljanja.",
    ["Besplatan WiFi", "Roštilj", "Vrt", "Parking", "Kamin", "Klima"]],
  ["vikendica", "Vikendica Konavle", "Konavle, Dubrovnik", "Hrvatska", 18.5, 4.7, 51, 175, "Vinski kraj",
    "Tradicionalna konavoska kuća okružena vinogradima i maslinicima, tridesetak minuta od Dubrovnika. Domaćini nude degustaciju domaćeg vina i rakije za goste koji žele upoznati unutrašnjost regije.",
    ["Besplatan WiFi", "Roštilj", "Vrt", "Parking", "Terasa"]],
  ["vikendica", "Brdska Vikendica Biokovo", "Podgora, Makarska", "Hrvatska", 6.2, 4.9, 38, 190, "Planinski pogled",
    "Drvena vikendica na obroncima Biokova s pogledom koji seže do otoka Brača i Hvara. Popularna polazna tačka za planinarenje, uz kamin za hladnije večeri i vanjsku jacuzzi kadu.",
    ["Besplatan WiFi", "Kamin", "Jacuzzi", "Parking", "Roštilj"]],
  ["vikendica", "Vikendica Maslinik", "Ston, Pelješac", "Hrvatska", 22.0, 4.6, 45, 155, "Uz solane",
    "Kamena vikendica okružena stoljetnim maslinicima nedaleko od stonskih zidina i solana. Vlastita proizvodnja maslinovog ulja dostupna je gostima za kušanje tokom boravka.",
    ["Besplatan WiFi", "Roštilj", "Vrt", "Parking", "Terasa", "Klima"]],
  ["vikendica", "Planinska Kuća Bjelašnica", "Bjelašnica", "Bosna i Hercegovina", 28.0, 4.8, 33, 110, "Planinski pogled",
    "Brvnara na obroncima Bjelašnice, popularna baza za skijanje zimi i planinarenje ljeti. Veliki kamin u dnevnom boravku i drvena terasa s pogledom na okolne vrhove.",
    ["Besplatan WiFi", "Kamin", "Parking", "Roštilj", "Vrt"]],

  ["stan", "Stan Stradun View", "Stari Grad, Dubrovnik", "Hrvatska", 0.1, 4.8, 267, 145, "Pogled na Stradun",
    "Stan na trećem katu s prozorima koji gledaju direktno na dubrovački Stradun. Uzak kameni stepenište vodi do svijetlog stana s tradicionalnim drvenim gredama na stropu.",
    ["Besplatan WiFi", "Klima", "Kuhinja", "Pogled na grad"]],
  ["stan", "Stan Bačvice", "Bačvice, Split", "Hrvatska", 1.4, 4.6, 178, 96, "Uz plažu",
    "Stan udaljen dvije minute hoda od popularne plaže Bačvice, u mirnoj ulici iza glavne šetnice. Balkon s pogledom na dvorište idealan je za jutarnju kafu prije odlaska na plažu.",
    ["Besplatan WiFi", "Klima", "Kuhinja", "Balkon"]],
  ["stan", "Stan Kalelarga", "Poluotok, Zadar", "Hrvatska", 0.3, 4.7, 134, 88, "Centar grada",
    "Stan u srcu zadarskog poluotoka, korak od glavne ulice Kalelarge i rimskog Foruma. Kuhinja je opremljena za samostalno kuvanje, a tržnica na otvorenom je pet minuta hoda.",
    ["Besplatan WiFi", "Klima", "Kuhinja", "Perilica rublja"]],
  ["stan", "Stan Groda", "Groda, Hvar", "Hrvatska", 0.2, 4.8, 112, 132, "Uz luku",
    "Stan na katu kamene zgrade iznad hvarske luke, s pogledom na jedrilice i tvrđavu Fortica u pozadini. Uska stepeništa i debeli kameni zidovi čuvaju hladovinu tokom ljetnih vrućina.",
    ["Besplatan WiFi", "Klima", "Kuhinja", "Pogled na more"]],
  ["stan", "Stan Baščaršija", "Baščaršija, Sarajevo", "Bosna i Hercegovina", 0.2, 4.7, 189, 72, "Centar grada",
    "Stan u srcu sarajevske Baščaršije, korak od Sebilja i bakardžijske ulice. Prozori dnevnog boravka gledaju na minaret obližnje džamije, a stan zadržava tradicionalni sarajevski enterijer.",
    ["Besplatan WiFi", "Klima", "Kuhinja", "Pogled na grad"]],
  ["stan", "Stan Ferhadija", "Centar, Sarajevo", "Bosna i Hercegovina", 0.5, 4.6, 96, 68, "Centar grada",
    "Stan uz glavnu pješačku zonu Ferhadiju, blizu Vječne vatre i katedrale. Praktičan izbor za goste koji žele istražiti grad pješice bez potrebe za prevozom.",
    ["Besplatan WiFi", "Klima", "Kuhinja", "Perilica rublja"]],
  ["stan", "Stan Stari Most", "Stari Grad, Mostar", "Bosna i Hercegovina", 0.1, 4.9, 224, 78, "Pogled na Stari most",
    "Stan sa terasom koja gleda direktno na Stari most i rijeku Neretvu. Kamene uličice Starog grada Mostara nalaze se odmah ispred vrata, uz brojne kafane i radnje sa suvenirima.",
    ["Besplatan WiFi", "Klima", "Kuhinja", "Pogled na rijeku", "Terasa"]],
  ["stan", "Stan Prešeren", "Centar, Ljubljana", "Slovenija", 0.3, 4.8, 143, 95, "Centar grada",
    "Stan uz Prešernov trg, korak od Tromostovja i ljubljanske rijeke Ljubljanice. Moderno uređen prostor u zgradi iz austrougarskog perioda, sa pogledom na krovove starog grada.",
    ["Besplatan WiFi", "Klima", "Kuhinja", "Pogled na grad"]],

  ["kuca", "Kamena Kula", "Stari Grad, Korčula", "Hrvatska", 1.2, 4.9, 512, 275, "Top ocjena",
    "Kamena kuća iz 15. stoljeća pretvorena u butik smještaj na samom vrhu poluotoka. Svaka soba nosi ime po lokalnoj sorti grožđa, a krovna terasa gleda na uski morski kanal prema Pelješcu.",
    ["Besplatan WiFi", "Klima", "Pogled na more", "Doručak uključen", "Vinski podrum"]],
  ["kuca", "Kamena Kuća Ragusa", "Konavosko polje, Konavle", "Hrvatska", 20.1, 4.7, 58, 240, "Cijeli objekat",
    "Obnovljena kamena kuća u srcu Konavoskog polja, okružena poljima duhana i povrtnjacima lokalnih porodica. Velika kuhinja s kamenim ognjištem centar je kuće, a dvorište skriva stari bunar.",
    ["Besplatan WiFi", "Kuhinja", "Vrt", "Roštilj", "Parking", "Klima"]],
  ["kuca", "Kuća Maslina", "Trogir, zaleđe", "Hrvatska", 6.4, 4.6, 47, 205, "Mir i tišina",
    "Kamena kuća na brežuljku iznad Trogira, okružena stoljetnim maslinama i vinovom lozom. Bazen u dvorištu gleda na kaštelanski zaljev, a do najbliže plaže je deset minuta vožnje.",
    ["Besplatan WiFi", "Klima", "Kuhinja", "Bazen", "Vrt", "Parking"]],
  ["kuca", "Dalmatinska Kamena Kuća", "Tučepi, Makarska", "Hrvatska", 4.3, 4.8, 71, 230, "Uz plažu",
    "Tradicionalna dalmatinska kuća samo pet minuta hoda od makarske rivijere, obnovljena uz očuvanje originalnog kamenog pročelja. Terasa u sjeni loze savršena je za večeru nakon dana na plaži.",
    ["Besplatan WiFi", "Klima", "Kuhinja", "Terasa", "Roštilj", "Parking"]],
  ["kuca", "Kuća pod Starim Gradom", "Stari Grad, Mostar", "Bosna i Hercegovina", 0.8, 4.8, 66, 150, "Cijeli objekat",
    "Kamena kuća u zaleđu mostarskog Starog grada, okružena vrtom sa smokvama i lozom. Deset minuta hoda do Starog mosta, u mirnoj ulici bez turističke gužve.",
    ["Besplatan WiFi", "Klima", "Kuhinja", "Vrt", "Parking", "Roštilj"]],
  ["kuca", "Alpska Kuća Bled", "Bled", "Slovenija", 3.5, 4.9, 88, 195, "Pogled na jezero",
    "Drvena alpska kuća sa pogledom na Blejsko jezero i ostrvo sa crkvicom. Kamin u dnevnom boravku i veliki prozori čine je idealnom bazom za istraživanje Julijskih Alpa.",
    ["Besplatan WiFi", "Kamin", "Parking", "Vrt", "Pogled na jezero"]],

  ["garsonijera", "Garsonijera Gruž", "Gruž, Dubrovnik", "Hrvatska", 3.8, 4.5, 143, 58, "Idealno za dvoje",
    "Kompaktna garsonijera blizu dubrovačke trajektne luke, praktična polazna tačka za izlete brodom po otocima. Kuhinjski kutak i kauč na razvlačenje čine je funkcionalnom za kraći boravak.",
    ["Besplatan WiFi", "Klima", "Kuhinjski kutak", "Parking"]],
  ["garsonijera", "Garsonijera Varoš", "Varoš, Split", "Hrvatska", 0.7, 4.4, 121, 62, "Centar grada",
    "Mala garsonijera u uskoj uličici splitske četvrti Varoš, deset minuta hoda od Rive. Prilagođena je putnicima koji provode većinu vremena istražujući grad pješice.",
    ["Besplatan WiFi", "Klima", "Kuhinjski kutak"]],
  ["garsonijera", "Garsonijera Poluotok", "Poluotok, Zadar", "Hrvatska", 0.4, 4.6, 97, 55, "Uz šetnicu",
    "Garsonijera na drugom katu s malim balkonom okrenutim prema šetnici uz more. Dovoljno prostora za dvoje, s minimalističkim enterijerom i svime potrebnim za kratak odmor.",
    ["Besplatan WiFi", "Klima", "Kuhinjski kutak", "Balkon"]],
  ["garsonijera", "Garsonijera Podstrana", "Podstrana, Split", "Hrvatska", 8.1, 4.5, 76, 49, "Uz plažu",
    "Garsonijera u prizemlju kuće, dvije minute hoda od duge šljunčane plaže duž splitske rivijere. Jednostavna i svijetla, s vanjskim sjedećim kutkom ispred ulaznih vrata.",
    ["Besplatan WiFi", "Klima", "Kuhinjski kutak", "Parking"]],
];

async function seed() {
  const client = await pool.connect();
  try {

    await client.query("BEGIN");

    console.log("Brišem POSTOJEĆE DEMO objekte (objekti koje su korisnici sami prijavili OSTAJU netaknuti)...");

    await client.query("DELETE FROM hotels WHERE owner_id IS NULL");

    console.log(`Ubacujem ${RAW.length} smještaja...`);
    let idx = 0;
    for (const [type, name, location, country, distanceKm, rating, reviews, price, badge, description, amenities] of RAW) {
      const slug = name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      const coverUrl = coverFor(idx);
      const gallery = buildGallery(type, coverUrl, idx);

      const ownerName = OWNER_NAMES[idx % OWNER_NAMES.length];
      const ownerEmail = ownerEmailFrom(ownerName, idx);
      const ownerPhone = ownerPhoneFor(country, idx);
      const { lat, lng } = coordsForLocation(location, idx);
      const street = streetFor(location, idx);

      const { rows } = await client.query(
        `INSERT INTO hotels (slug, type, name, location, country, distance_km, rating, reviews_count, price_per_night, badge, description, owner_name, contact_email, contact_phone, latitude, longitude, street)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17) RETURNING id`,
        [slug, type, name, location, country, distanceKm, rating, reviews, price, badge, description, ownerName, ownerEmail, ownerPhone, lat, lng, street]
      );
      const hotelId = rows[0].id;

      for (let i = 0; i < gallery.length; i++) {
        await client.query(
          `INSERT INTO hotel_images (hotel_id, image_url, position, room_type) VALUES ($1,$2,$3,$4)`,
          [hotelId, gallery[i], i, ROOM_TAGS[i] || "other"]
        );
      }

      for (const amenity of amenities) {
        await client.query(`INSERT INTO hotel_amenities (hotel_id, amenity_name) VALUES ($1,$2)`, [
          hotelId,
          amenity,
        ]);
      }

      const QUALITY_TIERS = [4.8, 4.5, 3.8, 3.2, 4.6, 2.8, 4.0, 3.5, 4.9, 2.5, 4.3, 3.0];
      const targetRating = QUALITY_TIERS[idx % QUALITY_TIERS.length];

      const VARIANCE_POOL = [-3, -2, -2, -1, -1, -1, 0, 0, 0, 0, 1, 1, 2];

      const reviewCount = Math.max(6, Math.min(reviews, 10 + (idx % 21)));
      const reviewRows = [];
      for (let r = 0; r < reviewCount; r++) {
        const name = REVIEWER_NAMES[(idx * 7 + r) % REVIEWER_NAMES.length];
        const variance = VARIANCE_POOL[(idx * 11 + r * 17) % VARIANCE_POOL.length];
        const stars = Math.min(5, Math.max(1, Math.round(targetRating) + variance));
        const daysAgo = 5 + ((idx * 13 + r * 37) % 700);
        const hasComment = r % 3 !== 0;

        const isEnglish = hasComment && (idx * 3 + r) % 4 === 0;
        const comment = !hasComment
          ? null
          : (() => {
              const pool = pickCommentPool(stars, isEnglish);
              return pool[(idx * 5 + r) % pool.length];
            })();
        reviewRows.push({ name, stars, daysAgo, comment });
      }
      for (const rv of reviewRows) {
        await client.query(
          `INSERT INTO reviews (hotel_id, guest_name, rating, comment, created_at)
           VALUES ($1, $2, $3, $4, now() - ($5 || ' days')::interval)`,
          [hotelId, rv.name, rv.stars, rv.comment, rv.daysAgo]
        );
      }

      const avgRating =
        Math.round((reviewRows.reduce((sum, r) => sum + r.stars, 0) / reviewRows.length) * 10) / 10;
      await client.query(`UPDATE hotels SET reviews_count = $1, rating = $2 WHERE id = $3`, [
        reviewRows.length,
        avgRating,
        hotelId,
      ]);

      const today = new Date();
      const addDays = (d) => {
        const dt = new Date(today);
        dt.setDate(dt.getDate() + d);
        return dt.toISOString().slice(0, 10);
      };

      if (idx % 3 === 0) {
        const startOffset = 3 + (idx % 10);
        await client.query(
          `INSERT INTO bookings (hotel_id, guest_name, guest_email, check_in, check_out, rooms, adults, total_price, status)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'confirmed')`,
          [hotelId, "Test Gost", "test.gost@example.com", addDays(startOffset), addDays(startOffset + 3), 1, 2, price * 3]
        );
      }

      await client.query(
        `INSERT INTO bookings (hotel_id, guest_name, guest_email, check_in, check_out, rooms, adults, total_price, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'confirmed')`,
        [hotelId, "Prošli Gost", "prosli.gost@example.com", addDays(-60 - idx), addDays(-57 - idx), 1, 2, price * 3]
      );

      idx++;
    }

    await client.query(`CREATE TABLE IF NOT EXISTS _meta (key VARCHAR(100) PRIMARY KEY, value TEXT)`);
    await client.query(
      `INSERT INTO _meta (key, value) VALUES ('seed_data_version', $1)
       ON CONFLICT (key) DO UPDATE SET value = $1`,
      [SEED_DATA_VERSION]
    );

    await client.query("COMMIT");
    console.log("Gotovo! Baza je popunjena.");
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { seed, SEED_DATA_VERSION };

if (require.main === module) {
  seed()
    .then(() => pool.end())
    .catch((err) => {
      console.error("Greška prilikom seed-ovanja:", err);
      process.exit(1);
    });
}
