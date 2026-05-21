import { PlantMap } from "../types/plant-map.type";

export const VEGETABLE_MAP: PlantMap = {
  bean:        { rowWidth:1, gap:2, inRowSpacing: 6,  color:'#7a9a4a', notes:'Bush or pole types',     aliases:['beans','bean','green bean','green beans'] },
  beet:        { rowWidth:1, gap:1, inRowSpacing: 3,  color:'#8a2a5a', notes:'Thin to 3 in apart',     aliases:['beets','beet','beetroot'] },
  broccoli:    { rowWidth:2, gap:2, inRowSpacing: 18, color:'#3a6a4a', notes:'Side shoots continue',   aliases:['broccoli'] },
  cabbage:     { rowWidth:2, gap:2, inRowSpacing: 18, color:'#4a7a5a', notes:'Large heads',            aliases:['cabbage','cabbages'] },
  carrot:      { rowWidth:1, gap:1, inRowSpacing: 3,  color:'#d4782a', notes:'Deep loose soil',        aliases:['carrots','carrot'] },
  cauliflower: { rowWidth:2, gap:2, inRowSpacing: 18, color:'#c8c8a0', notes:'Blanch heads',           aliases:['cauliflower'] },
  corn:        { rowWidth:1, gap:2, inRowSpacing: 12, color:'#c9a84c', notes:'Plant in blocks',        aliases:['corn','maize','sweetcorn'] },
  cowpea:      { rowWidth:1, gap:2, inRowSpacing: 6,  color:'#8faa5a', notes:'Heat-tolerant legume',   aliases:['cowpeas','cowpea','black-eyed peas','black eyed peas','southern peas'] },
  cucumber:    { rowWidth:2, gap:3, inRowSpacing: 12, color:'#4a8a2a', notes:'Trellis saves space',    aliases:['cucumbers','cucumber'] },
  eggplant:    { rowWidth:2, gap:3, inRowSpacing: 18, color:'#6a3a8a', notes:'Needs heat',             aliases:['eggplant','aubergine'] },
  garlic:      { rowWidth:1, gap:1, inRowSpacing: 6,  color:'#c8b898', notes:'Fall planting',          aliases:['garlic'] },
  herb:        { rowWidth:1, gap:1, inRowSpacing: 9,  color:'#7aba8a', notes:'Mixed herb rows',        aliases:['herbs','herb'] },
  kale:        { rowWidth:1, gap:2, inRowSpacing: 12, color:'#3a7a3a', notes:'Cold-hardy',             aliases:['kale'] },
  lettuce:     { rowWidth:1, gap:1, inRowSpacing: 8,  color:'#5a9e4a', notes:'Partial shade ok',       aliases:['lettuce','salad'] },
  melon:       { rowWidth:3, gap:5, inRowSpacing: 24, color:'#8aba4a', notes:'Needs warm season',      aliases:['melons','melon','watermelon','cantaloupe'] },
  onion:       { rowWidth:1, gap:1, inRowSpacing: 6,  color:'#b89a7a', notes:'From sets or seed',      aliases:['onions','onion'] },
  pea:         { rowWidth:1, gap:2, inRowSpacing: 3,  color:'#6a9a5a', notes:'Cool season, trellis',   aliases:['peas','pea'] },
  pepper:      { rowWidth:1, gap:2, inRowSpacing: 18, color:'#c4632a', notes:'Full sun',               aliases:['peppers','pepper','capsicum'] },
  potato:      { rowWidth:1, gap:3, inRowSpacing: 12, color:'#a89060', notes:'Hilled rows',            aliases:['potatoes','potato'] },
  pumpkin:     { rowWidth:4, gap:6, inRowSpacing: 36, color:'#d06a20', notes:'Very large sprawl',      aliases:['pumpkins','pumpkin'] },
  radish:      { rowWidth:1, gap:1, inRowSpacing: 2,  color:'#c84a7a', notes:'30-day quick crop',      aliases:['radishes','radish'] },
  spinach:     { rowWidth:1, gap:1, inRowSpacing: 6,  color:'#4a8a4a', notes:'Cool season',            aliases:['spinach'] },
  strawberry:  { rowWidth:1, gap:2, inRowSpacing: 12, color:'#c84a5a', notes:'Matted or hill system',  aliases:['strawberries','strawberry'] },
  sunflower:   { rowWidth:1, gap:2, inRowSpacing: 12, color:'#e8c020', notes:'Tall — plant at N end',  aliases:['sunflowers','sunflower'] },
  tomato:      { rowWidth:2, gap:4, inRowSpacing: 24, color:'#b84a3a', notes:'Stake or cage',          aliases:['tomatoes','tomato'] },
  zucchini:    { rowWidth:3, gap:4, inRowSpacing: 24, color:'#3a7a2a', notes:'Sprawling habit',        aliases:['zucchini','courgette','squash'] },
};

export const HERB_MAP: PlantMap = {
  basil:      { rowWidth:0.5, gap:1.5, inRowSpacing: 12, color:'#2d8b52', notes:'Pinch flowers to extend',   aliases:['basil','sweet basil'] },
  chives:     { rowWidth:0.5, gap:1.5, inRowSpacing: 12, color:'#6b9e5e', notes:'Perennial cut-and-come',    aliases:['chives'] },
  cilantro:   { rowWidth:0.5, gap:1.5, inRowSpacing: 18, color:'#4daa70', notes:'Succession-plant every 3w', aliases:['cilantro','coriander','chinese parsley'] },
  dill:       { rowWidth:0.5, gap:1.5, inRowSpacing: 12, color:'#90c080', notes:'Thin seedlings carefully',  aliases:['dill','dillweed'] },
  fennel:     { rowWidth:0.5, gap:2,   inRowSpacing: 12, color:'#a8c840', notes:'Keep away from most herbs', aliases:['fennel','florence fennel'] },
  lavender:   { rowWidth:1,   gap:2,   inRowSpacing: 18, color:'#9b7ec8', notes:'Mediterranean, drought OK', aliases:['lavender','english lavender'] },
  lemon_balm: { rowWidth:1,   gap:2,   inRowSpacing: 18, color:'#b2c852', notes:'Vigorous spreader',         aliases:['lemon balm','lemon_balm','melissa'] },
  mint:       { rowWidth:1,   gap:2,   inRowSpacing: 18, color:'#3cb87a', notes:'Contain in pots',           aliases:['mint','spearmint','peppermint'] },
  oregano:    { rowWidth:0.5, gap:1.5, inRowSpacing: 9,  color:'#7d8c4c', notes:'Hardy perennial',           aliases:['oregano','wild marjoram'] },
  parsley:    { rowWidth:0.5, gap:1,   inRowSpacing: 6,  color:'#2a7a2a', notes:'Biennial, slow to sprout',  aliases:['parsley','flat-leaf parsley','curly parsley'] },
  rosemary:   { rowWidth:1,   gap:2,   inRowSpacing: 12, color:'#587090', notes:'Woody shrub, full sun',     aliases:['rosemary'] },
  sage:       { rowWidth:1,   gap:2,   inRowSpacing: 12, color:'#8c9c6c', notes:'Drought tolerant shrub',    aliases:['sage','garden sage'] },
  tarragon:   { rowWidth:1,   gap:2,   inRowSpacing: 24, color:'#6c9462', notes:'French type preferred',     aliases:['tarragon','french tarragon'] },
  thyme:      { rowWidth:0.5, gap:1.5, inRowSpacing: 12, color:'#9c7c60', notes:'Low groundcover habit',     aliases:['thyme','common thyme','lemon thyme'] },
};

export const FLOWER_MAP: PlantMap = {
  calendula:  { rowWidth:1,   gap:1.5, inRowSpacing: 10, color:'#f4a020', notes:'Deadhead to keep blooming', aliases:['calendula','pot marigold'] },
  cosmos:     { rowWidth:1,   gap:2,   inRowSpacing: 12, color:'#e85090', notes:'Self-seeds, airy habit',    aliases:['cosmos'] },
  dahlia:     { rowWidth:1.5, gap:2.5, inRowSpacing: 18, color:'#d42848', notes:'Dinnerplate types need more', aliases:['dahlia','dahlias'] },
  echinacea:  { rowWidth:1,   gap:2,   inRowSpacing: 20, color:'#c86080', notes:'Perennial, attracts bees',  aliases:['echinacea','coneflower','purple coneflower'] },
  hollyhock:  { rowWidth:1.5, gap:2.5, inRowSpacing: 18, color:'#a044b8', notes:'Tall spires, stake in wind', aliases:['hollyhock','alcea'] },
  marigold:   { rowWidth:1,   gap:1.5, inRowSpacing: 10, color:'#f09020', notes:'Compact pest deterrent',    aliases:['marigold','african marigold','french marigold'] },
  nasturtium: { rowWidth:1,   gap:1.5, inRowSpacing: 12, color:'#e04820', notes:'Edible; trellis vining types', aliases:['nasturtium','tropaeolum'] },
  peony:      { rowWidth:2,   gap:3.5, inRowSpacing: 30, color:'#e87080', notes:'Perennial, slow to establish', aliases:['peony','paeonia'] },
  petunia:    { rowWidth:1,   gap:1.5, inRowSpacing: 12, color:'#9840c0', notes:'Pinch for bushy growth',    aliases:['petunia','petunias'] },
  salvia:     { rowWidth:1,   gap:1.75,inRowSpacing: 18, color:'#5050d0', notes:'Perennial, mildew risk',    aliases:['salvia','blue sage','ornamental sage'] },
  snapdragon: { rowWidth:1,   gap:1.5, inRowSpacing: 9,  color:'#e0609a', notes:'Cool season bloomer',       aliases:['snapdragon','antirrhinum'] },
  sweet_pea:  { rowWidth:1,   gap:1.5, inRowSpacing: 6,  color:'#d090d0', notes:'Fragrant vining annual',    aliases:['sweet pea','sweet_pea','lathyrus'] },
  zinnia:     { rowWidth:1,   gap:1.75,inRowSpacing: 10, color:'#f03030', notes:'Heat-lover, deadhead often', aliases:['zinnia','zinnias'] },
};

// Combined map used by GardenGrid, GardenService, and all color/key lookups.
export const PLANT_MAP: PlantMap = {
  ...VEGETABLE_MAP,
  ...HERB_MAP,
  ...FLOWER_MAP,
};
