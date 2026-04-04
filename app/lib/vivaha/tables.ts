// =============================================
// app/lib/vivaha/tables.ts
// All data tables for Vivaha Porutham
// =============================================

export const NAK_NAMES = [
  "Ashwini","Bharani","Krittika","Rohini","Mrigashira","Ardra","Punarvasu","Pushya","Ashlesha",
  "Magha","Purva Phalguni","Uttara Phalguni","Hasta","Chitra","Swati","Vishakha","Anuradha","Jyeshtha",
  "Mula","Purva Ashadha","Uttara Ashadha","Shravana","Dhanishta","Shatabhisha","Purva Bhadrapada","Uttara Bhadrapada","Revati"
];

export const RASI_NAMES = [
  "Aries","Taurus","Gemini","Cancer","Leo","Virgo",
  "Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"
];

// Gana: 0=Deva, 1=Manushya, 2=Asura
export const NAK_GANA = [
  0,1,2,2,0,1,0,0,2,
  2,1,1,0,2,0,2,0,2,
  2,1,1,0,1,2,1,2,0
];
export const GANA_NAME = ["Deva","Manushya","Asura"];

// Yoni animal for each nakshatra
export const NAK_YONI = [
  "Horse","Elephant","Goat","Snake","Snake","Dog","Cat","Goat","Cat",
  "Rat","Rat","Cow","Buffalo","Tiger","Buffalo","Tiger","Deer","Deer",
  "Dog","Monkey","Mongoose","Monkey","Lion","Horse","Lion","Cow","Elephant"
];

// Yoni gender: M=male, F=female
export const NAK_YONI_GENDER = [
  "M","M","F","M","F","M","F","M","M","M","F","M","F","M","M","F","F","M","F","M","F","F","F","F","M","F","F"
];

// Yoni enemy pairs
export const YONI_ENEMIES: Record<string, string> = {
  "Cow":"Tiger","Tiger":"Cow",
  "Elephant":"Lion","Lion":"Elephant",
  "Horse":"Buffalo","Buffalo":"Horse",
  "Dog":"Deer","Deer":"Dog",
  "Rat":"Cat","Cat":"Rat",
  "Goat":"Monkey","Monkey":"Goat",
  "Snake":"Mongoose","Mongoose":"Snake"
};

// Rajju group for each nakshatra
export const NAK_RAJJU = [
  "Patha",   // 0  Ashwini
  "Patha",   // 1  Bharani
  "Siro",    // 2  Krittika
  "Siro",    // 3  Rohini
  "Siro",    // 4  Mrigashira
  "Kanda",   // 5  Ardra
  "Kanda",   // 6  Punarvasu
  "Kanda",   // 7  Pushya
  "Kanda",   // 8  Ashlesha
  "Thodia",  // 9  Magha
  "Thodia",  // 10 Purva Phalguni
  "Thodia",  // 11 Uttara Phalguni
  "Uthara",  // 12 Hasta
  "Kanda",   // 13 Chitra
  "Uthara",  // 14 Swati
  "Thodia",  // 15 Vishakha
  "Kanda",   // 16 Anuradha
  "Thodia",  // 17 Jyeshtha
  "Thodia",  // 18 Mula
  "Thodia",  // 19 Purva Ashadha
  "Kanda",   // 20 Uttara Ashadha
  "Kanda",   // 21 Shravana
  "Siro",    // 22 Dhanishta
  "Siro",    // 23 Shatabhisha
  "Siro",    // 24 Purva Bhadrapada
  "Patha",   // 25 Uttara Bhadrapada
  "Patha",   // 26 Revati
];

// Vedha pairs (0-indexed nakshatra numbers)
export const VEDHA_PAIRS: [number,number][] = [
  [0,17],[1,16],[2,15],[3,14],[5,21],[6,20],
  [7,19],[8,18],[9,26],[10,20],[11,19],[12,23]
];

// Rasi lord for each sign
export const RASI_LORD = [
  "Mars","Venus","Mercury","Moon","Sun","Mercury",
  "Venus","Mars","Jupiter","Saturn","Saturn","Jupiter"
];

// Vasiya map: for each rasi, which rasis are Vasiya to it
export const VASIYA_MAP: Record<number, number[]> = {
  0:[4,7], 1:[3,6], 2:[5], 3:[7,8], 4:[9], 5:[1,11],
  6:[6], 7:[3,5], 8:[11], 9:[4], 10:[11], 11:[9]
};

// Varna: 0=Brahmin, 1=Kshatriya, 2=Vaishya, 3=Shudra
// Repeating pattern across 12 signs
export const RASI_VARNA = [1,2,3,0,1,2,3,0,1,2,3,0];
export const VARNA_NAME = ["Brahmin","Kshatriya","Vaishya","Shudra"];

// Vashya categories
export const VASHYA_CAT: Record<number,string> = {
  0:"Chatushpad",1:"Chatushpad",2:"Dwipad",3:"Jalachar",4:"Vanchar",
  5:"Dwipad",6:"Dwipad",7:"Keet",8:"Dwipad",9:"Jalachar",10:"Dwipad",11:"Jalachar"
};

export const VASHYA_SCORE: Record<string,Record<string,number>> = {
  "Chatushpad":{"Chatushpad":2,"Jalachar":0,"Vanchar":2,"Keet":0,"Dwipad":0},
  "Jalachar":  {"Chatushpad":1,"Jalachar":2,"Vanchar":0,"Keet":1,"Dwipad":0.5},
  "Vanchar":   {"Chatushpad":1,"Jalachar":0,"Vanchar":2,"Keet":0,"Dwipad":0},
  "Keet":      {"Chatushpad":0,"Jalachar":1,"Vanchar":0,"Keet":2,"Dwipad":1},
  "Dwipad":    {"Chatushpad":1,"Jalachar":0.5,"Vanchar":1,"Keet":0,"Dwipad":2},
};

// Nadi: 0=Aadi, 1=Madhya, 2=Antya
export const NAK_NADI = [
  0,1,2,2,0,1,0,0,2,
  2,1,1,0,1,0,2,0,2,
  2,1,1,0,1,2,1,2,0
];
export const NADI_NAME = ["Aadi","Madhya","Antya"];

// Permanent planet relationships
export const PERM_FRIENDS: Record<string, string[]> = {
  "Sun":     ["Moon","Mars","Jupiter"],
  "Moon":    ["Sun","Mercury"],
  "Mars":    ["Sun","Moon","Jupiter"],
  "Mercury": ["Sun","Venus"],
  "Jupiter": ["Sun","Moon","Mars"],
  "Venus":   ["Mercury","Saturn"],
  "Saturn":  ["Mercury","Venus"],
};

export const PERM_ENEMIES: Record<string, string[]> = {
  "Sun":     ["Venus","Saturn"],
  "Moon":    [],
  "Mars":    ["Mercury"],
  "Mercury": ["Moon"],
  "Jupiter": ["Mercury","Venus"],
  "Venus":   ["Sun","Moon"],
  "Saturn":  ["Sun","Moon","Mars"],
};

// Papa (malefic) houses — planets in these houses from a reference point get 1 papa point
export const PAPA_HOUSES = [1,2,4,7,8,12];

// Malefic planets for Papasamya
export const PAPA_PLANETS = ["Mars","Saturn","Sun","Rahu"];
