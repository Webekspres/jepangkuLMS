/**
 * One-off generator: curated Unsplash map for kana vocab.
 * Run: bun run scripts/generate-kana-vocab-images.ts
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { KANA_MANIFEST } from '../features/kana/lib/kana-manifest.generated';

const UTM = 'w=400&q=80&auto=format&fit=crop&utm_source=jepangku&utm_medium=referral';

function url(photoId: string) {
  return `https://images.unsplash.com/${photoId}?${UTM}`;
}

const P = {
  rain: 'photo-1515694346937-94d85e41e6f0',
  house: 'photo-1564013799919-ab600027ffc6',
  cow: 'photo-1546445317-29f4545e9d53',
  milk: 'photo-1563636619-e9143da7973b',
  station: 'photo-1524661135-423995f22d0b',
  man: 'photo-1507003211169-0a1dd7228f2d',
  umbrella: 'photo-1527489377706-5bf97e608852',
  calendar: 'photo-1506784983877-45594efa4cbe',
  shoes: 'photo-1542291026-7eec264c27ff',
  smoke: 'photo-1516937941344-00b4e0337589',
  voice: 'photo-1478737270239-2f02b77fc618',
  fish: 'photo-1544551763-46a013bb70d5',
  salt: 'photo-1596040033229-a9821ebd058d',
  watermelon: 'photo-1587049352846-4a222e784d38',
  earth: 'photo-1451187580459-43490279c0fa',
  sky: 'photo-1504608524841-42fe6f032b4b',
  egg: 'photo-1582722872445-44dc5f7e3c8f',
  subway: 'photo-1558618666-fcd25c85cd64',
  moon: 'photo-1532693322450-2cb5c511067d',
  letter: 'photo-1586281380349-632531db7ed4',
  clock: 'photo-1501139083538-0139583c060f',
  summer: 'photo-1507525428034-b723cf961d3e',
  meat: 'photo-1603048588665-791ca8d400ad',
  fabric: 'photo-1558171813-4c088753af8f',
  cat: 'photo-1514888286974-6c03e2ca1dba',
  drink: 'photo-1544145945-f904253401ed',
  flower: 'photo-1490750967868-88aa4486c946',
  plane: 'photo-1436491865332-7a61a109cc05',
  ship: 'photo-1544551763-77ef2d0cfc6c',
  room: 'photo-1522771739844-6a9f6d5f14af',
  star: 'photo-1419242902214-272b3f66ee7a',
  window: 'photo-1493809842364-78817add7ffb',
  ear: 'photo-1590658268037-6bf12165a8df',
  insect: 'photo-1581092918056-0c4c3acd3789',
  glasses: 'photo-1574258495973-f010dfbb5147',
  peach: 'photo-1629828874514-d81aab8b0b8e',
  mountain: 'photo-1464822759023-fed622ff2c3b',
  snow: 'photo-1491002052546-bf2858c8c8e4',
  night: 'photo-1507400494017-aa73d9c9e5e8',
  lion: 'photo-1546182990-dffeafbe841d',
  apple: 'photo-1560806887-1e4cd0b6cbd6',
  emptyHome: 'photo-1484154218962-a197022b5858',
  history: 'photo-1461360228754-6e81c908fb70',
  candle: 'photo-1602600386938-a87e4a6f5c0a',
  person: 'photo-1438761681033-6461ffad8d80',
  book: 'photo-1544716278-ca5e3f4abd8c',
  school: 'photo-1580582932707-520aed937b7b',
  bank: 'photo-1554224155-6726b3ff858f',
  health: 'photo-1571019614242-c5c5dee9f50b',
  rice: 'photo-1516684669134-de6f7c34b2e3',
  magazine: 'photo-1504711434969-e33886168f5c',
  pants: 'photo-1542272454315-4c01d7abdf4a',
  all: 'photo-1529156069898-49953e39b3ac',
  elephant: 'photo-1564760055775-d63b17a55c44',
  university: 'photo-1541339907198-e08756dedf3f',
  medical: 'photo-1584515933487-779824d29309',
  path: 'photo-1506784360416-da9904d1ab87',
  phone: 'photo-1511707171634-5f897ff02aa9',
  door: 'photo-1449844908441-8829872d2607',
  number: 'photo-1509228468518-180dd4864904',
  museum: 'photo-1566127444979-b3d2b654e3d7',
  pig: 'photo-1516467508483-a7212febe31a',
  study: 'photo-14565130808-af29db9c2773',
  hat: 'photo-1514327605112-b887c0e61c0a',
  bread: 'photo-1509440159596-0249088772ff',
  shiny: 'photo-1618005182384-a83a8bd57fbe',
  hungry: 'photo-1504674900247-0877df9cc836',
  mailbox: 'photo-1566576912321-d58ddd7a6088',
  guest: 'photo-1511795409834-ef04bbd61622',
  cucumber: 'photo-1449300079323-98d43ea161d5',
  photo: 'photo-1452587925148-ce544e77e70d',
  cafeteria: 'photo-1414235077428-338989a2e8c0',
  chocolate: 'photo-1549007994-7631ac64a119',
  injection: 'photo-1584308666744-24d5c474f2ae',
  savings: 'photo-1579621970563-ebec7560ff3e',
  wife: 'photo-1516589178581-6cd7833ae3b2',
  leopard: 'photo-1456926630680-a9a4e1e4e2f0',
  pulse: 'photo-1559757175-5700dde675bc',
  music: 'photo-1511379938547-c1f69419868d',
  documents: 'photo-1450101499163-c8848c66ca85',
  dragon: 'photo-1578662996442-48f60103fc96',
  travel: 'photo-1488646953014-85cb44e25828',
  woman: 'photo-1494790108377-be9c29b29330',
  speed: 'photo-1469854523086-cc02fe5d8800',
  hospital: 'photo-1519494026892-80bbd2d6fd0d',
  announcement: 'photo-1475721027785-f74eccf877e2',
  iceCream: 'photo-1563805042-7684c019e1cb',
  ink: 'photo-1583485088034-514d32257137',
  virus: 'photo-1584039733313-b5e50fcf0155',
  elevator: 'photo-1497366216548-37526070297c',
  motorcycle: 'photo-1558981806-ec527fa84c39',
  camera: 'photo-1516035069371-29a1b244cc32',
  classroom: 'photo-1580582932707-520aed937b7b',
  cake: 'photo-1578985545062-69928b1d9587',
  coffee: 'photo-1495474472287-4d71bcdd2085',
  soccer: 'photo-1574629810360-7efbbe195018',
  shirt: 'photo-1596755094514-f87e34085b85',
  soup: 'photo-1547592166-23ac45744acd',
  sweater: 'photo-1576566588028-4147f3842f27',
  sauce: 'photo-1472476443507-3759ecdca6e5',
  towel: 'photo-1631889993959-41b4e9c6e3c5',
  cheese: 'photo-1486297678162-eb2a19b0a32d',
  tennis: 'photo-1554068865-24cecd4e34b8',
  tomato: 'photo-1546470427-e26264be0b11',
  knife: 'photo-1593618998160-e34014e67546',
  noodle: 'photo-1569718212165-3a8278d5f624',
  necktie: 'photo-1507679799987-4e533261bd9f',
  notebook: 'photo-1517842645767-c639042777db',
  heater: 'photo-1545259741-2ea3ebf61fa3',
  fryingPan: 'photo-1556910103-1c02745aae4d',
  helicopter: 'photo-1540962351504-03099e0a754b',
  hotel: 'photo-1566073771259-6a8506099945',
  mouse: 'photo-1527864550417-7fd91fc51a46',
  melon: 'photo-1571575173700-aff6cdf450cf',
  motor: 'photo-1486262715619-67b85e0b08d3',
  tire: 'photo-1492144534655-ae79c964c9d7',
  yogurt: 'photo-1488477181946-6428a0291777',
  radio: 'photo-1598488035139-bdbb2231ce04',
  ribbon: 'photo-1513201099705-a9746e1e201f',
  restaurant: 'photo-1517248135467-4c7edcad34c4',
  robot: 'photo-1485827404703-89b55fcc595e',
  wine: 'photo-1510812431401-41d2bd2722f3',
  otaku: 'photo-1511512578047-dfb367046420',
  glass: 'photo-1497366754035-f200968a6e72',
  guitar: 'photo-1510915361894-db8b60106cb1',
  drinkingGlass: 'photo-1513558161293-cdaf765ed2fd',
  game: 'photo-1493711662062-fa541adb3fc8',
  golf: 'photo-1535131749006-b7f58c99034b',
  design: 'photo-1561070791-2526d30994b5',
  zone: 'photo-1486406146926-c627a92ad1ab',
  dance: 'photo-1508700929628-666bc8bd84ea',
  store: 'photo-1441986300917-64674bd600d8',
  banana: 'photo-1571771894821-ce9b6c11b08e',
  beer: 'photo-1608270586620-248524c67de9',
  bed: 'photo-1505693416388-ac5ce068fe85',
  button: 'photo-1611532736597-de2d4265fba3',
  party: 'photo-1530103862676-de8c9debad1d',
  piano: 'photo-1520523839897-bd0b52f945a0',
  pool: 'photo-1576013551627-0cc20b96c2a7',
  cabbage: 'photo-1594282486552-05b4d80fbb9f',
  cupid: 'photo-1518199266791-5375a83190b7',
  tokyo: 'photo-1540959733332-eab4deabeeaf',
  shower: 'photo-1620626011761-996317b8d101',
  chance: 'photo-1516321318423-f06f85e504b3',
  news: 'photo-1504711434969-e33886168f5c',
  myanmar: 'photo-1528183429752-a97d0bf99b5a',
  ginger: 'photo-1615485290382-441e4d049cb5',
  llama: 'photo-1544966503-7cc5ac882d5f',
  backpack: 'photo-1553062407-98eeb64c6a62',
  doll: 'photo-1578662996442-48f60103fc96',
  gang: 'photo-1529156069898-49953e39b3ac',
  gyoza: 'photo-1496116218417-1a781b1c416c',
  jam: 'photo-1482049016688-2d3e1b311543',
  juice: 'photo-1600271886742-f049cd451bba',
  jogging: 'photo-1552674605-db6ffd4facb5',
  tree: 'photo-1416879595882-3373a0480b5b',
  buffet: 'photo-1414235077428-338989a2e8c0',
  nail: 'photo-1589939705384-5185137a7f0f',
  computer: 'photo-1517694712202-14dd9538aa97',
  japanDefault: 'photo-1528164344705-47542687000d',
  wind: 'photo-1527482797697-8795b05a13fe',
  classLesson: 'photo-1509062522246-3755977927d7',
} as const;

const RULES: { re: RegExp; id: string }[] = [
  { re: /hujan/, id: P.rain },
  { re: /rumah sakit/, id: P.hospital },
  { re: /rumah(?! sakit)/, id: P.house },
  { re: /susu sapi/, id: P.cow },
  { re: /\bsapi\b/, id: P.cow },
  { re: /\bsusu\b/, id: P.milk },
  { re: /stasiun/, id: P.station },
  { re: /laki-laki/, id: P.man },
  { re: /payung/, id: P.umbrella },
  { re: /kemarin|hari ini/, id: P.calendar },
  { re: /sepatu/, id: P.shoes },
  { re: /asap/, id: P.smoke },
  { re: /suara/, id: P.voice },
  { re: /ikan mas|ikan\b/, id: P.fish },
  { re: /garam/, id: P.salt },
  { re: /semangka/, id: P.watermelon },
  { re: /dunia/, id: P.earth },
  { re: /langit/, id: P.sky },
  { re: /telur/, id: P.egg },
  { re: /kereta bawah|bawah tanah/, id: P.subway },
  { re: /bulan/, id: P.moon },
  { re: /surat/, id: P.letter },
  { re: /\bjam\b|waktu|menit/, id: P.clock },
  { re: /musim panas/, id: P.summer },
  { re: /daging|ham\b/, id: P.meat },
  { re: /kain/, id: P.fabric },
  { re: /kucing/, id: P.cat },
  { re: /minuman/, id: P.drink },
  { re: /bunga/, id: P.flower },
  { re: /pesawat/, id: P.plane },
  { re: /kapal/, id: P.ship },
  { re: /kamar/, id: P.room },
  { re: /bintang/, id: P.star },
  { re: /jendela/, id: P.window },
  { re: /telinga/, id: P.ear },
  { re: /serangga/, id: P.insect },
  { re: /kacamata/, id: P.glasses },
  { re: /persik/, id: P.peach },
  { re: /gunung/, id: P.mountain },
  { re: /salju/, id: P.snow },
  { re: /malam/, id: P.night },
  { re: /singa/, id: P.lion },
  { re: /apel/, id: P.apple },
  { re: /tidak ada di rumah/, id: P.emptyHome },
  { re: /sejarah/, id: P.history },
  { re: /lilin/, id: P.candle },
  { re: /\bsaya\b|partikel objek/, id: P.person },
  { re: /buku catatan/, id: P.notebook },
  { re: /\bbuku\b/, id: P.book },
  { re: /masuk sekolah|sekolah/, id: P.school },
  { re: /\bbank\b/, id: P.bank },
  { re: /kondisi|keadaan|sehat/, id: P.health },
  { re: /nasi|makan/, id: P.rice },
  { re: /majalah/, id: P.magazine },
  { re: /celana/, id: P.pants },
  { re: /semua/, id: P.all },
  { re: /gajah/, id: P.elephant },
  { re: /universitas/, id: P.university },
  { re: /mimisan/, id: P.medical },
  { re: /berlanjut/, id: P.path },
  { re: /telepon/, id: P.phone },
  { re: /pintu/, id: P.door },
  { re: /nomor|nol|seratus|tiga ratus|enam ratus/, id: P.number },
  { re: /museum/, id: P.museum },
  { re: /babi/, id: P.pig },
  { re: /belajar|pekerjaan rumah/, id: P.study },
  { re: /pelajaran/, id: P.classLesson },
  { re: /topi/, id: P.hat },
  { re: /roti/, id: P.bread },
  { re: /mengkilap/, id: P.shiny },
  { re: /lapar/, id: P.hungry },
  { re: /kotak pos/, id: P.mailbox },
  { re: /tamu/, id: P.guest },
  { re: /mentimun/, id: P.cucumber },
  { re: /foto/, id: P.photo },
  { re: /kantin/, id: P.cafeteria },
  { re: /cokelat/, id: P.chocolate },
  { re: /suntikan/, id: P.injection },
  { re: /tabungan/, id: P.savings },
  { re: /istri/, id: P.wife },
  { re: /macan tutul|tabel/, id: P.leopard },
  { re: /denyut|nadi/, id: P.pulse },
  { re: /musik/, id: P.music },
  { re: /nama keluarga|singkatan|aturan/, id: P.documents },
  { re: /naga/, id: P.dragon },
  { re: /wisata|\btur\b/, id: P.travel },
  { re: /kebalikan/, id: P.path },
  { re: /gangguan/, id: P.chance },
  { re: /perempuan/, id: P.woman },
  { re: /melesat|cepat/, id: P.speed },
  { re: /pengumuman/, id: P.announcement },
  { re: /es krim/, id: P.iceCream },
  { re: /tinta|pena/, id: P.ink },
  { re: /virus/, id: P.virus },
  { re: /lift/, id: P.elevator },
  { re: /sepeda motor/, id: P.motorcycle },
  { re: /kamera|zoom/, id: P.camera },
  { re: /kilo/, id: P.health },
  { re: /kelas/, id: P.classroom },
  { re: /kue/, id: P.cake },
  { re: /kopi/, id: P.coffee },
  { re: /sepak bola/, id: P.soccer },
  { re: /kemeja/, id: P.shirt },
  { re: /sup/, id: P.soup },
  { re: /sweter|rajutan/, id: P.sweater },
  { re: /saus/, id: P.sauce },
  { re: /handuk/, id: P.towel },
  { re: /keju/, id: P.cheese },
  { re: /tenis/, id: P.tennis },
  { re: /tomat/, id: P.tomato },
  { re: /pisau/, id: P.knife },
  { re: /\bmi\b|gnocchi|pangsit/, id: P.noodle },
  { re: /dasi/, id: P.necktie },
  { re: /pemanas/, id: P.heater },
  { re: /wajan/, id: P.fryingPan },
  { re: /helikopter/, id: P.helicopter },
  { re: /hotel/, id: P.hotel },
  { re: /mouse/, id: P.mouse },
  { re: /muslim/, id: P.elephant },
  { re: /melon/, id: P.melon },
  { re: /\bmotor\b|diesel/, id: P.motor },
  { re: /\bban\b/, id: P.tire },
  { re: /seragam/, id: P.school },
  { re: /yogurt/, id: P.yogurt },
  { re: /radio/, id: P.radio },
  { re: /pita/, id: P.ribbon },
  { re: /restoran/, id: P.restaurant },
  { re: /robot/, id: P.robot },
  { re: /anggur/, id: P.wine },
  { re: /otaku/, id: P.otaku },
  { re: /\bkaca\b/, id: P.glass },
  { re: /gitar/, id: P.guitar },
  { re: /gelas/, id: P.drinkingGlass },
  { re: /gim|permainan/, id: P.game },
  { re: /golf/, id: P.golf },
  { re: /desain/, id: P.design },
  { re: /jeans/, id: P.pants },
  { re: /zona/, id: P.zone },
  { re: /dansa/, id: P.dance },
  { re: /toserba|toko/, id: P.store },
  { re: /pisang/, id: P.banana },
  { re: /\bbir\b/, id: P.beer },
  { re: /\brem\b/, id: P.motor },
  { re: /kasur/, id: P.bed },
  { re: /tombol/, id: P.button },
  { re: /pesta/, id: P.party },
  { re: /piano/, id: P.piano },
  { re: /kolam/, id: P.pool },
  { re: /kubis/, id: P.cabbage },
  { re: /cupid/, id: P.cupid },
  { re: /tokyo/, id: P.tokyo },
  { re: /shower/, id: P.shower },
  { re: /kesempatan/, id: P.chance },
  { re: /tabung|sekering/, id: P.insect },
  { re: /berita/, id: P.news },
  { re: /myanmar/, id: P.myanmar },
  { re: /jahe/, id: P.ginger },
  { re: /llama/, id: P.llama },
  { re: /ransel/, id: P.backpack },
  { re: /matryoshka/, id: P.doll },
  { re: /geng/, id: P.gang },
  { re: /reguler/, id: P.documents },
  { re: /selai/, id: P.jam },
  { re: /jus/, id: P.juice },
  { re: /lari pelan|jogging|lompat/, id: P.jogging },
  { re: /cendana/, id: P.tree },
  { re: /prasmanan/, id: P.buffet },
  { re: /paku/, id: P.nail },
  { re: /komputer/, id: P.computer },
  { re: /angin|tiupan/, id: P.wind },
];

/** Match rules against vocabMeaning only (not reading — ^anchors break on "jam tokei"). */
function resolve(meaning: string): string {
  const hay = meaning.toLowerCase();
  for (const rule of RULES) {
    if (rule.re.test(hay)) return url(rule.id);
  }
  return url(P.japanDefault);
}

const FALLBACK_URL = url(P.japanDefault);
const map: Record<string, string> = {};
const keyCounts: Record<string, number> = {};
const misses: { key: string; meaning: string }[] = [];

for (const e of KANA_MANIFEST) {
  let key = `${e.script}:${e.romaji}`;
  keyCounts[key] = (keyCounts[key] ?? 0) + 1;
  if (keyCounts[key] > 1) {
    key = `${e.script}:${e.romaji}:${e.vocabReading || e.vocabWord}`;
  }
  const src = resolve(e.vocabMeaning);
  map[key] = src;
  if (src === FALLBACK_URL) {
    misses.push({ key, meaning: e.vocabMeaning });
  }
}

const out = `/**
 * Curated Unsplash images for kana vocab (visual match to meaning).
 * Keys: \`script:romaji\` (or \`script:romaji:reading\` when romaji collides).
 * Regenerated by: bun run scripts/generate-kana-vocab-images.ts
 */
import type { KanaScript } from './kana-types';

export const KANA_VOCAB_FALLBACK_IMAGE =
  '${FALLBACK_URL}';

export const KANA_VOCAB_IMAGE_BY_KEY: Record<string, string> = ${JSON.stringify(map, null, 2)};

export function isKanaVocabFallbackImage(src: string): boolean {
  return src === KANA_VOCAB_FALLBACK_IMAGE || src.includes('photo-1528164344705-47542687000d');
}

export function resolveKanaVocabImageSrc(options: {
  script: KanaScript;
  romaji: string;
  reading: string;
  meaning: string;
  word?: string;
}): string {
  const { script, romaji, reading, word } = options;
  const primary = \`\${script}:\${romaji}\`;
  const withReading = \`\${script}:\${romaji}:\${reading || word || ''}\`;
  return (
    KANA_VOCAB_IMAGE_BY_KEY[withReading] ??
    KANA_VOCAB_IMAGE_BY_KEY[primary] ??
    KANA_VOCAB_FALLBACK_IMAGE
  );
}
`;

const outPath = join(import.meta.dir, '..', 'features', 'kana', 'lib', 'kana-vocab-images.ts');
writeFileSync(outPath, out, 'utf8');
console.log('wrote', outPath, Object.keys(map).length, 'keys');
console.log('hiragana:a', map['hiragana:a']);
console.log('katakana:a', map['katakana:a']);
console.log('hiragana:to', map['hiragana:to']);
console.log('fallback misses', misses.length);
if (misses.length > 0) {
  for (const m of misses) console.log('  miss', m.key, m.meaning);
}
