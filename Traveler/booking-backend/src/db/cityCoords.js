const CITY_COORDS = [
  ["Lapad, Dubrovnik", 42.6553, 18.0728],
  ["Ploče, Dubrovnik", 42.6420, 18.1211],
  ["Gruž, Dubrovnik", 42.6580, 18.0850],
  ["Stari Grad, Dubrovnik", 42.6407, 18.1106],
  ["Konavle, Dubrovnik", 42.5700, 18.2300],
  ["Dubrovnik", 42.6507, 18.0944],
  ["Narodni trg, Split", 43.5081, 16.4396],
  ["Bačvice, Split", 43.5040, 16.4460],
  ["Varoš, Split", 43.5075, 16.4360],
  ["Riva, Split", 43.5083, 16.4402],
  ["Podstrana, Split", 43.4900, 16.5100],
  ["Žrnovnica, Split", 43.4850, 16.5350],
  ["Split", 43.5081, 16.4402],
  ["Petrčane, Zadar", 44.2200, 15.1900],
  ["Poluotok, Zadar", 44.1194, 15.2314],
  ["Zaton, Zadar", 44.1900, 15.2200],
  ["Zadar", 44.1194, 15.2314],
  ["Cavtat", 42.5808, 18.2189],
  ["Vela Luka, Korčula", 42.9575, 16.7175],
  ["Stari Grad, Korčula", 42.9608, 17.1350],
  ["Korčula", 42.9608, 17.1350],
  ["Groda, Hvar", 43.1729, 16.4414],
  ["Hvar, otok Hvar", 43.1729, 16.4414],
  ["Hvar", 43.1729, 16.4414],
  ["Tučepi, Makarska", 43.2764, 17.0400],
  ["Podgora, Makarska", 43.2400, 17.0600],
  ["Makarska", 43.2969, 17.0175],
  ["Konavosko polje, Konavle", 42.5600, 18.2100],
  ["Trogir, zaleđe", 43.5147, 16.2517],
  ["Trogir", 43.5147, 16.2517],
  ["Ston, Pelješac", 42.8433, 17.6994],
  ["Bjelašnica", 43.7167, 18.2667],
  ["Stari Grad, Mostar", 43.3400, 17.8100],
  ["Mostar", 43.3438, 17.8078],
  ["Baščaršija, Sarajevo", 43.8594, 18.4326],
  ["Centar, Sarajevo", 43.8563, 18.4131],
  ["Sarajevo", 43.8563, 18.4131],
  ["Centar, Ljubljana", 46.0569, 14.5058],
  ["Ljubljana", 46.0569, 14.5058],
  ["Bled", 46.3683, 14.1146],

  ["Zagreb", 45.8150, 15.9819],
  ["Rijeka", 45.3271, 14.4422],
  ["Pula", 44.8666, 13.8496],
  ["Osijek", 45.5550, 18.6955],
  ["Banja Luka", 44.7722, 17.1910],
  ["Tuzla", 44.5386, 18.6739],
  ["Zenica", 44.2019, 17.9078],
  ["Maribor", 46.5547, 15.6459],
  ["Novi Sad", 45.2671, 19.8335],
  ["Beograd", 44.7866, 20.4489],
  ["Podgorica", 42.4304, 19.2594],
  ["Budva", 42.2864, 18.8400],
  ["Kotor", 42.4247, 18.7712],
];

function jitter(value, seed) {
  const offset = (((seed * 9301 + 49297) % 233280) / 233280 - 0.5) * 0.012;
  return value + offset;
}

function coordsForLocation(location, seed = 0) {
  const text = location || "";
  const match = CITY_COORDS.find(([name]) => text.includes(name));
  const [lat, lng] = match ? [match[1], match[2]] : [43.5, 17.0];
  return { lat: jitter(lat, seed), lng: jitter(lng, seed + 7) };
}

// samo za demo objekte, adresa nije stvarna
const STREET_NAMES = {
  "Dubrovnik": ["Stradun", "Ulica od Puča", "Prijeko", "Frana Supila", "Iva Vojnovića"],
  "Split": ["Marmontova ulica", "Bosanska ulica", "Kralja Tomislava", "Riva", "Domovinskog rata"],
  "Zadar": ["Kalelarga", "Ulica Ivana Mažuranića", "Obala kneza Trpimira", "Poluotok"],
  "Korčula": ["Ulica Antuna Kalođere", "Trg Kralja Tomislava", "Ulica Kralja Petra"],
  "Hvar": ["Riva", "Ulica Petra Hektorovića", "Trg Svetog Stjepana"],
  "Makarska": ["Kralja Petra Krešimira IV", "Obala kralja Tomislava", "Ulica Marka Marulića"],
  "Konavle": ["Ulica Grada Vukovara", "Cavtatska cesta"],
  "Trogir": ["Gradska ulica", "Obala bana Berislavića"],
  "Ston": ["Pelješka cesta", "Ulica Svetog Vlaha"],
  "Bjelašnica": ["Bjelašnička cesta"],
  "Mostar": ["Kujundžiluk", "Braće Fejića", "Onešćukova ulica", "Maršala Tita"],
  "Sarajevo": ["Ferhadija", "Baščaršija", "Koševo", "Zmaja od Bosne", "Mula Mustafe Bašeskije"],
  "Ljubljana": ["Prešernov trg", "Čopova ulica", "Mestni trg", "Slovenska cesta"],
  "Bled": ["Cesta Svobode", "Ljubljanska cesta"],
};

function streetFor(location, seed) {
  const text = location || "";
  const cityKey = Object.keys(STREET_NAMES).find((city) => text.includes(city));
  const pool = cityKey ? STREET_NAMES[cityKey] : ["Glavna ulica"];
  const street = pool[seed % pool.length];
  const houseNumber = 1 + ((seed * 7) % 40);
  return `${street} ${houseNumber}`;
}

module.exports = { CITY_COORDS, coordsForLocation, streetFor };
