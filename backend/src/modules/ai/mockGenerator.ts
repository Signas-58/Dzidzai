import crypto from 'crypto';
import { AIGenerateRequest, AIGenerateResponse, SupportedLanguage, GradeLevel } from './types';

type Lang = SupportedLanguage;

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[randInt(0, arr.length - 1)];
}

function gradeBand(gradeLevel: GradeLevel): 'early' | 'mid' | 'upper' {
  if (gradeLevel === 'ECD A' || gradeLevel === 'ECD B' || gradeLevel === 'Grade 1' || gradeLevel === 'Grade 2') return 'early';
  if (gradeLevel === 'Grade 3' || gradeLevel === 'Grade 4') return 'mid';
  return 'upper';
}

function confidence(): number {
  const min = 0.75;
  const max = 0.95;
  const v = min + Math.random() * (max - min);
  return Math.round(v * 100) / 100;
}

const namesByLang: Record<Lang, string[]> = {
  Shona: ['Tendai', 'Nyasha', 'Ruva', 'Tinashe', 'Farai'],
  Ndebele: ['Sipho', 'Thando', 'Nomalanga', 'Bongani', 'Ayanda'],
  Tonga: ['Mubita', 'Chipo', 'Taonga', 'Sitali', 'Leya'],
};

const contexts = [
  { key: 'fruits', items: ['maapuro', 'mabanana', 'maorenji'], itemsNde: ['ama-apula', 'amabhanana', 'ama-orenji'], itemsTon: ['maapulo', 'mabanana', 'maorenji'] },
  { key: 'school', items: ['mapeni', 'mabhuku', 'maeresa'], itemsNde: ['amapeni', 'amabhuku', 'ama-eraser'], itemsTon: ['mapeni', 'mabhuku', 'maeraser'] },
  { key: 'animals', items: ['mombe', 'mbudzi', 'huku'], itemsNde: ['inkomo', 'imbuzi', 'inkukhu'], itemsTon: ['ngombe', 'mbuzi', 'inkuku'] },
];

function langText(lang: Lang, shona: string, ndebele: string, tonga: string): string {
  if (lang === 'Shona') return shona;
  if (lang === 'Ndebele') return ndebele;
  return tonga;
}

function buildAddition(input: AIGenerateRequest, ragHint?: string): AIGenerateResponse {
  const band = gradeBand(input.gradeLevel);
  const lang = input.language;
  const name = pick(namesByLang[lang]);
  const ctx = pick(contexts);

  const maxN = band === 'early' ? 10 : band === 'mid' ? 50 : 200;
  const a = randInt(1, Math.floor(maxN / 2));
  const b = randInt(1, Math.floor(maxN / 2));
  const sum = a + b;

  const explTemplates = [
    () => langText(
      lang,
      `${ragHint ? ragHint + ' ' : ''}${name} ari kudzidza kuwedzera. Kuwedzera zvinoreva kuisa zvinhu pamwe chete kuti tiwane huwandu hwazvose.`,
      `${ragHint ? ragHint + ' ' : ''}${name} ufunda ukufaka ndawonye. Ukungeza, ubala konke kube yinye.`,
      `${ragHint ? ragHint + ' ' : ''}${name} ulasambilila kuonjezya. Kuonjezya kulimvwa kwa kuleta zintu pamwe kuti tuwane bunji.`
    ),
    () => langText(
      lang,
      `${ragHint ? ragHint + ' ' : ''}Kana uchiwedzera, unoverenga kubva pane nhamba yekutanga wobva wawedzera imwe.`,
      `${ragHint ? ragHint + ' ' : ''}Nxa ungeza, uqala ngenombolo yokuqala ube usengeza enye.`,
      `${ragHint ? ragHint + ' ' : ''}Kana twaonjezya, tutalika kuamba kutalika kuamba tichibala.`
    ),
    () => langText(
      lang,
      `${ragHint ? ragHint + ' ' : ''}Tinoshandisa zvinhu zvedu zuva nezuva (senge ${pick(ctx.items)}) kuti tinzwisise kuwedzera.`,
      `${ragHint ? ragHint + ' ' : ''}Sisebenzisa izinto zansuku zonke (njenge ${pick(ctx.itemsNde)}) ukuze siqonde ukufaka ndawonye.`,
      `${ragHint ? ragHint + ' ' : ''}Tulikwata zintu zamasiku onse (nga ${pick(ctx.itemsTon)}) kuti tusimbe kuonjezya.`
    ),
  ];

  const explanation = pick(explTemplates)();

  const exampleTemplates = [
    () => langText(
      lang,
      `Muenzaniso: ${a} + ${b} = ${sum}. Verenga ${a} wobva wawedzera ${b}.`,
      `Isibonelo: ${a} + ${b} = ${sum}. Bala ${a} bese ungeza ${b}.`,
      `Isibonelo: ${a} + ${b} = ${sum}. Bala ${a} uboonjezya ${b}.`
    ),
    () => langText(
      lang,
      `${name} ane ${a} ${pick(ctx.items)}. Anopihwa mamwe ${b}. Zvino ane ${sum}.`,
      `${name} ule ${a} ${pick(ctx.itemsNde)}. Unikwe amanye ${b}. Manje ule ${sum}.`,
      `${name} uli ${a} ${pick(ctx.itemsTon)}. Waapegwa amwi ${b}. Kuno uli ${sum}.`
    ),
    () => langText(
      lang,
      `Pane boka: ${a} ne ${b}. Kana tichiabatanidza, tinowana ${sum}.`,
      `Kuleqembu: ${a} lo ${b}. Nxa sikuhlanganisa, sithola ${sum}.`,
      `Kuli buntu: ${a} ne ${b}. Kana twahlanganisya, tuba ${sum}.`
    ),
  ];

  const example = pick(exampleTemplates)();

  const practice_questions = Array.from({ length: band === 'upper' ? 6 : 4 }).map(() => {
    const x = randInt(1, Math.floor(maxN / 2));
    const y = randInt(1, Math.floor(maxN / 2));
    const ans = x + y;

    const qTemplates = [
      () => `${x} + ${y} = ?`,
      () => langText(lang, `Wawedzera: ${x} + ${y} = ?`, `Engeza: ${x} + ${y} = ?`, `Onjezya: ${x} + ${y} = ?`),
      () => langText(lang, `${name} ane ${x}, awana ${y} futi. Zvino zvese = ?`, `${name} ule ${x}, uthola ${y} futhi. Manje konke = ?`, `${name} uli ${x}, waapegwa ${y} futi. Kuno konke = ?`),
    ];

    const hint = langText(
      lang,
      band === 'early' ? 'Verenga zvishoma nezvishoma paunenge uchingeza.' : 'Ziva kuti kuwedzera = kuisa pamwe chete.',
      band === 'early' ? 'Bala kancane kancane nxa ungeza.' : 'Khumbula ukuthi ungeza = ukuhlanganisa.',
      band === 'early' ? 'Bala kancane kancane kana uonjezya.' : 'Ikumbula kuonjezya = kuhlanganisya.'
    );

    return {
      question: pick(qTemplates)(),
      hint,
      answer: String(ans),
    };
  });

  return {
    explanation,
    example,
    practice_questions,
    language: input.language,
    gradeLevel: input.gradeLevel,
    confidenceScore: confidence(),
  };
}

function buildGeneric(input: AIGenerateRequest, ragHint?: string): AIGenerateResponse {
  const band = gradeBand(input.gradeLevel);
  const lang = input.language;
  const name = pick(namesByLang[lang]);

  const expl = [
    langText(lang,
      `${ragHint ? ragHint + ' ' : ''}Nhasi tiri kudzidza ${input.topic}. Ngatitsanangurei pfungwa huru nemashoko akareruka.`,
      `${ragHint ? ragHint + ' ' : ''}Lamuhla sifunda ${input.topic}. Ake sichaze umqondo omkhulu ngamazwi alula.`,
      `${ragHint ? ragHint + ' ' : ''}Namhlanje sifunda ${input.topic}. Tuchaze umqondo omukulu ngamazwi alula.`
    ),
    langText(lang,
      `${ragHint ? ragHint + ' ' : ''}${input.topic} inokosha. Tinodzidza mashoko matsva uye tinopa muenzaniso.`,
      `${ragHint ? ragHint + ' ' : ''}${input.topic} kubalulekile. Sifunda amazwi amatsha njalo sinika isibonelo.`,
      `${ragHint ? ragHint + ' ' : ''}${input.topic} chiyabambwa. Tulasambilila mazwi atsha, tupa isibonelo.`
    ),
    langText(lang,
      `${ragHint ? ragHint + ' ' : ''}${name} anobvunza mibvunzo uye tinopindura zvishoma nezvishoma.`,
      `${ragHint ? ragHint + ' ' : ''}${name} uyabuza imibuzo njalo siphendula kancane kancane.`,
      `${ragHint ? ragHint + ' ' : ''}${name} ubuzya, tuli kupendula kancane kancane.`
    ),
  ];

  const explanation = pick(expl);

  const example = langText(
    lang,
    band === 'early'
      ? `Muenzaniso: Nyora mutsara mumwe pamusoro pe "${input.topic}".`
      : `Muenzaniso: Nyora mitsara miviri kana mitatu pamusoro pe "${input.topic}".`
    ,
    band === 'early'
      ? `Isibonelo: Bhala umusho owodwa ngo "${input.topic}".`
      : `Isibonelo: Bhala imisho emibili kumbe emithathu ngo "${input.topic}".`
    ,
    band === 'early'
      ? `Isibonelo: Lemba mulongo umodzi pa "${input.topic}".`
      : `Isibonelo: Lemba milongo ibili nangu itatu pa "${input.topic}".`
  );

  const practice_questions = Array.from({ length: band === 'upper' ? 6 : 4 }).map((_, idx) => {
    const q = langText(
      lang,
      `${idx + 1}. Chii chinonzi "${input.topic}"?`,
      `${idx + 1}. Kuyini "${input.topic}"?`,
      `${idx + 1}. Nchichi "${input.topic}"?`
    );

    const hint = langText(
      lang,
      'Shandisa mashoko mashoma uye akajeka.',
      'Sebenzisa amazwi ambalwa acacileyo.',
      'Sebenzisa mazwi masyo amfwe, acacileyo.'
    );

    return { question: q, hint, answer: '...'};
  });

  return {
    explanation,
    example,
    practice_questions,
    language: input.language,
    gradeLevel: input.gradeLevel,
    confidenceScore: confidence(),
  };
}

export function generateMock(input: AIGenerateRequest, contextText?: string): AIGenerateResponse {
  const ragHint = contextText ? pick([
    langText(input.language, 'Tichashandisa ruzivo ruri mugwaro rekirasi.', 'Sizasebenzisa ulwazi olusemibhalweni yekilasi.', 'Tuchashandisa ulwazi luli mu gwalo lya kilasi.'),
    langText(input.language, 'Rangarira zvataona mukuraira kwekirasi.', 'Khumbula esikubonileyo emibhalweni yekilasi.', 'Ikumbula zyatwaona mu gwalo lya kilasi.'),
    langText(input.language, 'Ngatiteererei zvinyorwa zvekirasi.', 'Ake silandele imibhalo yekilasi.', 'Ake tulandele gwalo lya kilasi.'),
  ]) : undefined;

  const topicLower = input.topic.toLowerCase();
  if (topicLower.includes('add') || topicLower.includes('addition') || topicLower.includes('kuwedzera')) {
    return buildAddition(input, ragHint);
  }

  return buildGeneric(input, ragHint);
}

export function randomId(): string {
  return crypto.randomBytes(6).toString('hex');
}
