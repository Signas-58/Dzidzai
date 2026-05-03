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
  const min = 0.6;
  const max = 0.95;
  const v = min + Math.random() * (max - min);
  return Math.round(v * 100) / 100;
}

const namesByLang: Record<Lang, string[]> = {
  Shona: ['Tendai', 'Nyasha', 'Ruva', 'Tinashe', 'Farai'],
  Ndebele: ['Sipho', 'Thando', 'Nomalanga', 'Bongani', 'Ayanda'],
  Tonga: ['Mubita', 'Chipo', 'Taonga', 'Sitali', 'Leya'],
  English: ['Tendai', 'Nyasha', 'Ruva', 'Tinashe', 'Farai'],
};

const contexts = [
  { key: 'fruits', items: ['maapuro', 'mabanana', 'maorenji'], itemsNde: ['ama-apula', 'amabhanana', 'ama-orenji'], itemsTon: ['maapulo', 'mabanana', 'maorenji'] },
  { key: 'school', items: ['mapeni', 'mabhuku', 'maeresa'], itemsNde: ['amapeni', 'amabhuku', 'ama-eraser'], itemsTon: ['mapeni', 'mabhuku', 'maeraser'] },
  { key: 'animals', items: ['mombe', 'mbudzi', 'huku'], itemsNde: ['inkomo', 'imbuzi', 'inkukhu'], itemsTon: ['ngombe', 'mbuzi', 'inkuku'] },
];

function langText(lang: Lang, shona: string, ndebele: string, tonga: string): string {
  if (lang === 'Shona') return shona;
  if (lang === 'Ndebele') return ndebele;
  if (lang === 'Tonga') return tonga;
  return shona;
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

  const desiredCount = 10;
  const practice_questions: Array<{ question: string; hint: string; answer: string }> = [];
  const seen = new Set<string>();
  let guard = 0;
  while (practice_questions.length < desiredCount && guard < 50) {
    guard++;
    const x = randInt(1, Math.floor(maxN / 2));
    const y = randInt(1, Math.floor(maxN / 2));
    const ans = x + y;

    const qTemplates = [
      () => `${x} + ${y} = ?`,
      () => langText(lang, `Wawedzera: ${x} + ${y} = ?`, `Engeza: ${x} + ${y} = ?`, `Onjezya: ${x} + ${y} = ?`),
      () => langText(lang, `${name} ane ${x}, awana ${y} futi. Zvino zvese = ?`, `${name} ule ${x}, uthola ${y} futhi. Manje konke = ?`, `${name} uli ${x}, waapegwa ${y} futi. Kuno konke = ?`),
    ];

    const q = pick(qTemplates)();
    const key = q.trim().toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    const hint = langText(
      lang,
      band === 'early' ? 'Verenga zvishoma nezvishoma paunenge uchingeza.' : 'Ziva kuti kuwedzera = kuisa pamwe chete.',
      band === 'early' ? 'Bala kancane kancane nxa ungeza.' : 'Khumbula ukuthi ungeza = ukuhlanganisa.',
      band === 'early' ? 'Bala kancane kancane kana uonjezya.' : 'Ikumbula kuonjezya = kuhlanganisya.'
    );

    practice_questions.push({
      question: q,
      hint,
      answer: String(ans),
    });
  }

  return {
    explanation,
    example,
    practice_questions,
    language: input.language,
    gradeLevel: input.gradeLevel,
    confidenceScore: confidence(),
  };
}

function buildReadingComprehension(input: AIGenerateRequest, ragHint?: string): AIGenerateResponse {
  const band = gradeBand(input.gradeLevel);
  const lang = input.language;
  const name = pick(namesByLang[lang]);

  const story = langText(
    lang,
    band === 'early'
      ? `Nyaya pfupi: ${name} anoenda kuchikoro mangwanani. Anoona shiri iri pamuti. Shiri inoridza rwiyo rwayo. ${name} anofara uye anoenderera mberi achienda kuchikoro.`
      : `Nyaya pfupi: ${name} anoenda kuchikoro mangwanani. Munzira anoona shiri iri pamuti ichiridza rwiyo. Anomira kwechinguva, obva arangarira kuti haafaniri kunonoka. Anoenderera mberi achimhanya zvishoma kusvika asvika kuchikoro nenguva.`
    ,
    band === 'early'
      ? `Indaba emfushane: ${name} uya esikolo ekuseni. Ubona inyoni emthini. Inyoni iyacula. ${name} uyajabula aqhubeke esikolo.`
      : `Indaba emfushane: ${name} uya esikolo ekuseni. Emzileni ubona inyoni emthini icula. Uyama kancane, abesesikhumbuza ukuthi akafanele late. Uqhubeka ehamba ngokushesha aze afike esikolo ngesikhathi.`
    ,
    band === 'early'
      ? `Ngano ifupi: ${name} uya kuchikolo mangwanani. Waona cinyoni pa muti. Cinyoni caimba. ${name} wafwaala, aende kuchikolo.`
      : `Ngano ifupi: ${name} uya kuchikolo mangwanani. Mu nzila waona cinyoni pa muti caimba. Wema cishoma, abva arangarira kuti haafaneli kunonoka. Aenderera mberi nekukurumidza kusvika asvika kuchikolo nenguva.`
  );

  const explanation = langText(
    lang,
    `${ragHint ? ragHint + ' ' : ''}Nhasi tiri kuita reading comprehension. Verenga nyaya iri mu “example”, wobva wapindura mibvunzo uchishandisa zviri munyaya.`,
    `${ragHint ? ragHint + ' ' : ''}Lamuhla senza reading comprehension. Funda indaba eku “example”, bese uphendula imibuzo usebenzisa okusembalini.`,
    `${ragHint ? ragHint + ' ' : ''}Namhlanje tiri kuita reading comprehension. Bala ngano iri mu “example”, wozopindura mibvunzo uchishandisa zviri mungano.`
  );

  const desiredCount = 10;
  const practice_questions: Array<{ question: string; hint: string; answer: string }> = [];

  const questionBank = [
    {
      question: langText(lang, `Ndiani ari munyaya?`, `Ngubani osendabeni?`, `Nguni ari mungano?`),
      hint: langText(lang, 'Tsvaga zita remwana.', 'Khangela ibizo lomntwana.', 'Funa zina lya mwana.'),
      answer: name,
    },
    {
      question: langText(lang, `Anoenda kupi ${name}?`, `Uya ngaphi u${name}?`, `${name} uya kupi?`),
      hint: langText(lang, 'Tarisa panotaurwa kwaari kuenda.', 'Bheka lapho aya khona.', 'Bona kwaari kuenda.'),
      answer: langText(lang, 'Kuchikoro.', 'Esikolo.', 'Kuchikolo.'),
    },
    {
      question: langText(lang, 'Akaona chii munzira?', 'Ubone ini emzileni?', 'Waona chii mu nzila?'),
      hint: langText(lang, 'Tsvaga chinhu chaakaona.', 'Khangela into ayibonileyo.', 'Funa chinhu chaakaona.'),
      answer: langText(lang, 'Shiri iri pamuti.', 'Inyoni emthini.', 'Cinyoni pa muti.'),
    },
    {
      question: langText(lang, 'Shiri yaiitei?', 'Inyoni yenzani?', 'Cinyoni caiita nzi?'),
      hint: langText(lang, 'Tarisa zvaiitwa neshiri.', 'Bheka okwenziwa yinyoni.', 'Bona caicho cinyoni.'),
      answer: langText(lang, 'Yairidza rwiyo.', 'Yayicula.', 'Caiimba.'),
    },
    {
      question: langText(lang, 'Sei ${name} akamira kwechinguva? (tsanangura)', 'Kungani u${name} wema kancane?', 'Nkaambo nzi ${name} wema cishoma?'),
      hint: langText(lang, 'Funga nezvaakaita paakaona shiri.', 'Cabanga ngalokho akwenzileyo nxa ebona inyoni.', 'Funga paakaona cinyoni.'),
      answer: langText(lang, 'Akamira kuti ateerere/atarise shiri.', 'Wema ukuze alalele/abheke inyoni.', 'Wema kuti ateerere/atarise cinyoni.'),
    },
    {
      question: langText(lang, 'Chii chaakayeuka kuti asaite?', 'Yini ayikhumbulayo ukuthi angayenzi?', 'Waayeuka chii kuti asaite?'),
      hint: langText(lang, 'Pane izwi rinoti “kunonoka/late”.', 'Kukhona okukhuluma ngo “late”.', 'Pane izwi rinotaura nezve kunonoka.'),
      answer: langText(lang, 'Kuti haafaniri kunonoka kuchikoro.', 'Ukuthi akafanele late esikolo.', 'Kuti haafaniri kunonoka kuchikolo.'),
    },
    {
      question: langText(lang, 'Pakupedzisira, akasvika kuchikoro sei?', 'Ekucineni, ufike njani esikolo?', 'Pakuguma, asvika sei kuchikolo?'),
      hint: langText(lang, 'Tarisa mashoko ekupedzisira enyaya.', 'Bheka amazwi okugcina endaba.', 'Bona mashoko ekuguma.'),
      answer: langText(lang, 'Akasvika nenguva.', 'Ufikile ngesikhathi.', 'Asvika nenguva.'),
    },
    {
      question: langText(lang, 'Nyaya iyi inotidzidzisa chii? (chidzidzo)', 'Indaba ifundisa ini? (isifundo)', 'Ngano iyi itudzidzisa chii?'),
      hint: langText(lang, 'Funga nezvekuita zvakanaka kuchikoro.', 'Cabanga ngokwenza kahle esikolo.', 'Funga nezvekuita zvakanaka kuchikolo.'),
      answer: langText(lang, 'Kuchengetedza nguva uye kusanonoka.', 'Ukugcina isikhathi nokungabi late.', 'Kuchengetedza nguva uye kusanonoka.'),
    },
    {
      question: langText(lang, 'Tsanangura izwi rokuti “mangwanani” sezvarinoshandiswa munyaya.', 'Chaza igama elithi “ekuseni” njengoba lisetshenziswa endabeni.', 'Chaza “mangwanani” mu ngano.'),
      hint: langText(lang, 'Rinoreva nguva yezuva.', 'Lisho isikhathi sosuku.', 'Rinoreva nguva yezuva.'),
      answer: langText(lang, 'Nguva yekutanga kwezuva.', 'Isikhathi sokuqala sosuku.', 'Nguva yekutanga kwezuva.'),
    },
    {
      question: langText(lang, 'Nyora (1) chinhu chimwe chaakaita uye (1) chaakaona.', 'Bhala (1) akwenzileyo kanye (1) akubonileyo.', 'Lemba (1) caakaaita ne (1) caakaona.'),
      hint: langText(lang, 'Shandisa zvinyorwa zvemunyaya.', 'Sebenzisa okusembalini.', 'Shandisa zviri mungano.'),
      answer: langText(lang, 'Akafamba kuenda kuchikoro; akaona shiri.', 'Uhambile esikolo; ubone inyoni.', 'Aenda kuchikolo; waona cinyoni.'),
    },
  ];

  for (let i = 0; i < desiredCount; i++) {
    practice_questions.push(questionBank[i]);
  }

  return {
    explanation,
    example: story,
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

  const desiredCount = 10;
  const baseQuestions = [
    {
      question: langText(
        lang,
        `Chii chinonzi "${input.topic}"?`,
        `Kuyini "${input.topic}"?`,
        `Nchichi "${input.topic}"?`
      ),
      hint: langText(lang, 'Tsanangura nemashoko mashoma.', 'Chaza ngamazwi ambalwa.', 'Chaza namazwi masyo amfwe.'),
      answer: '...',
    },
    {
      question: langText(
        lang,
        `Taura muenzaniso mumwe we "${input.topic}" muhupenyu hwezuva nezuva.`,
        `Nika isibonelo esisodwa se "${input.topic}" empilweni yansuku zonke.`,
        `Pa isibonelo cimwi ca "${input.topic}" mu bwumi bwa mazuba onse.`
      ),
      hint: langText(lang, 'Funga zvinhu zvaunoona kana kuita zuva nezuva.', 'Cabanga izinto ozenzayo nsuku zonke.', 'Funga zintu zya mazuba onse.'),
      answer: '...',
    },
    {
      question: langText(
        lang,
        `Nei "${input.topic}" yakakosha? Nyora chikonzero chimwe.`,
        `Kungani "${input.topic}" kubalulekile? Bhala isizathu esisodwa.`,
        `Nkaambo nzi "${input.topic}" chiyabambwa? Lemba chikonzero cimwi.`
      ),
      hint: langText(lang, 'Tanga ne: “Inokosha nekuti…”', 'Qala ngo: “Kubalulekile ngoba…”', 'Tanga ne: “Chiyabambwa nkaambo…”'),
      answer: '...',
    },
    {
      question: langText(
        lang,
        `Nyora mazwi maviri matsva aunodzidza pa "${input.topic}" uye tsanangura rimwe nerimwe.`,
        `Bhala amagama amabili amatsha owafundayo ku "${input.topic}" ube uchaze ngalinye.`,
        `Lemba mazwi mabili atsha aunosambilila pa "${input.topic}" ubochaza limwi na limwi.`
      ),
      hint: langText(lang, 'Sarudza mazwi ari nyore.', 'Khetha amagama alula.', 'Sankanya mazwi alula.'),
      answer: '...',
    },
    {
      question: langText(
        lang,
        `${name} anofanira kushandisa "${input.topic}" sei? Nyora nhanho mbiri.`,
        `${name} angasebenzisa njani "${input.topic}"? Bhala amanyathelo amabili.`,
        `${name} angashandisa njani "${input.topic}"? Lemba zinyathelo zibiji.`
      ),
      hint: langText(lang, 'Nyora nhanho 1 uye nhanho 2.', 'Bhala isinyathelo 1 lesi 2.', 'Lemba inyathelo 1 ne 2.'),
      answer: '...',
    },
  ];

  const practice_questions = baseQuestions
    .concat(baseQuestions)
    .slice(0, desiredCount)
    .map((q, idx) => {
      const suffix = idx < baseQuestions.length ? '' : ` (${idx + 1})`;
      const question = `${q.question}${suffix}`;
    if (band === 'early') {
      return {
        ...q,
        question,
        hint: langText(lang, 'Pindura nemutsara mumwe.', 'Phendula ngomusho owodwa.', 'Pindula na mulongo umodzi.'),
      };
    }
    return { ...q, question };
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
  if (topicLower.includes('reading comprehension') || topicLower.includes('comprehension')) {
    return buildReadingComprehension(input, ragHint);
  }
  if (topicLower.includes('add') || topicLower.includes('addition') || topicLower.includes('kuwedzera')) {
    return buildAddition(input, ragHint);
  }

  return buildGeneric(input, ragHint);
}

export function randomId(): string {
  return crypto.randomBytes(6).toString('hex');
}
