import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';
import { onRequest } from 'firebase-functions/v2/https';
import twilio from 'twilio';

if (getApps().length === 0) {
  initializeApp();
}

const db = getFirestore();

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type BotStep =
  | 'new'
  | 'awaiting_name'
  | 'awaiting_area'
  | 'awaiting_household'
  | 'awaiting_need'
  | 'complete'
  | 'status_check';

type BotLanguage = 'ar' | 'en' | 'fr';

interface SessionData {
  name?: string;
  area?: string;
  householdSize?: number;
  mainNeed?: string;
}

interface WaSession {
  phone: string;
  step: BotStep;
  language: BotLanguage;
  data: SessionData;
  submissionId?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/* ------------------------------------------------------------------ */
/*  i18n strings                                                       */
/* ------------------------------------------------------------------ */

const STRINGS: Record<BotLanguage, Record<string, string>> = {
  ar: {
    welcome: 'أهلاً بك في نسنا 🤝\nاضغط 1️⃣ للتسجيل\nاضغط 2️⃣ لمتابعة حالتك',
    ask_name: 'ما اسمك الكامل؟',
    ask_area: 'في أي محافظة أنت حالياً؟',
    ask_household: 'كم عدد أفراد أسرتك؟',
    ask_need: 'ما هي حاجتك الأساسية؟\n1. طعام\n2. مأوى\n3. طبي\n4. ملابس\n5. أخرى',
    invalid_number: 'يرجى إدخال رقم صحيح.',
    invalid_need: 'يرجى اختيار رقم من 1 إلى 5.',
    registered: 'تم تسجيلك ✅ رقم حالتك: #{{id}}\nاحتفظ بهذا الرقم لمتابعة حالتك لاحقاً.',
    no_submission: 'لم نجد تسجيلاً مرتبطاً برقمك. اضغط 1 للتسجيل.',
    status_pending: 'قيد الانتظار — جاري البحث عن منظمة',
    status_assigned: 'تم التعيين — {{ngo}} سيتواصل معك',
    status_in_progress: 'جاري المعالجة — تم الوصول إليك',
    status_completed: 'مكتملة — تم تقديم المساعدة ✅',
    status_cancelled: 'ملغاة — يرجى التواصل مع المسؤول',
    lang_set: 'تم تعيين اللغة إلى العربية. أرسل أي رسالة للمتابعة.',
    invalid_menu: 'يرجى اختيار 1 أو 2.',
  },
  en: {
    welcome: 'Welcome to Nasna 🤝\nPress 1️⃣ to register\nPress 2️⃣ to check your case status',
    ask_name: 'What is your full name?',
    ask_area: 'Which governorate are you currently in?',
    ask_household: 'How many people are in your household?',
    ask_need: 'What is your main need?\n1. Food\n2. Shelter\n3. Medical\n4. Clothing\n5. Other',
    invalid_number: 'Please enter a valid number.',
    invalid_need: 'Please choose a number from 1 to 5.',
    registered:
      'You are registered ✅ Your case number: #{{id}}\nKeep this number to check your status later.',
    no_submission: 'We could not find a registration linked to your number. Press 1 to register.',
    status_pending: 'Pending — searching for an organization',
    status_assigned: 'Assigned — {{ngo}} will contact you',
    status_in_progress: 'In progress — you have been reached',
    status_completed: 'Completed — aid has been delivered ✅',
    status_cancelled: 'Cancelled — please contact the administrator',
    lang_set: 'Language set to English. Send any message to continue.',
    invalid_menu: 'Please choose 1 or 2.',
  },
  fr: {
    welcome:
      'Bienvenue chez Nasna 🤝\nAppuyez sur 1️⃣ pour vous inscrire\nAppuyez sur 2️⃣ pour vérifier votre dossier',
    ask_name: 'Quel est votre nom complet ?',
    ask_area: 'Dans quel gouvernorat êtes-vous actuellement ?',
    ask_household: 'Combien de personnes dans votre foyer ?',
    ask_need:
      'Quel est votre besoin principal ?\n1. Nourriture\n2. Abri\n3. Médical\n4. Vêtements\n5. Autre',
    invalid_number: 'Veuillez entrer un nombre valide.',
    invalid_need: 'Veuillez choisir un numéro de 1 à 5.',
    registered:
      'Vous êtes inscrit ✅ Numéro de dossier : #{{id}}\nGardez ce numéro pour vérifier votre statut.',
    no_submission:
      "Nous n'avons pas trouvé d'inscription liée à votre numéro. Appuyez sur 1 pour vous inscrire.",
    status_pending: "En attente — recherche d'une organisation",
    status_assigned: 'Attribué — {{ngo}} vous contactera',
    status_in_progress: 'En cours — vous avez été contacté',
    status_completed: "Terminé — l'aide a été fournie ✅",
    status_cancelled: "Annulé — veuillez contacter l'administrateur",
    lang_set: 'Langue définie sur le français. Envoyez un message pour continuer.',
    invalid_menu: 'Veuillez choisir 1 ou 2.',
  },
};

const NEEDS_MAP: Record<string, string> = {
  '1': 'food',
  '2': 'shelter',
  '3': 'medical',
  '4': 'clothing',
  '5': 'other',
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function t(lang: BotLanguage, key: string, vars?: Record<string, string>): string {
  let text = STRINGS[lang]?.[key] ?? STRINGS.ar[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      text = text.replace(`{{${k}}}`, v);
    }
  }
  return text;
}

function stripWhatsAppPrefix(from: string): string {
  return from.replace(/^whatsapp:/, '');
}

function getTwilioClient(): twilio.Twilio {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) {
    throw new Error('Missing Twilio credentials in environment variables');
  }
  return twilio(sid, token);
}

async function sendWhatsApp(to: string, body: string): Promise<void> {
  const client = getTwilioClient();
  const from = process.env.TWILIO_WHATSAPP_FROM;
  if (!from) {
    throw new Error('Missing TWILIO_WHATSAPP_FROM environment variable');
  }
  await client.messages.create({ body, from, to });
}

async function getOrCreateSession(phone: string): Promise<WaSession> {
  const docRef = db.collection('wa_sessions').doc(phone);
  const snap = await docRef.get();

  if (snap.exists) {
    return snap.data() as WaSession;
  }

  const newSession: WaSession = {
    phone,
    step: 'new',
    language: 'ar',
    data: {},
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };
  await docRef.set(newSession);
  return newSession;
}

async function updateSession(
  phone: string,
  updates: Partial<Pick<WaSession, 'step' | 'language' | 'data' | 'submissionId'>>,
): Promise<void> {
  await db
    .collection('wa_sessions')
    .doc(phone)
    .update({ ...updates, updatedAt: Timestamp.now() });
}

/* ------------------------------------------------------------------ */
/*  State handlers                                                     */
/* ------------------------------------------------------------------ */

async function handleNew(session: WaSession, body: string, phone: string): Promise<string> {
  const choice = body.trim();

  if (choice === '1') {
    await updateSession(phone, { step: 'awaiting_name' });
    return t(session.language, 'ask_name');
  }

  if (choice === '2') {
    await updateSession(phone, { step: 'status_check' });
    return handleStatusCheck(session, phone);
  }

  return t(session.language, 'invalid_menu');
}

async function handleAwaitingName(
  session: WaSession,
  body: string,
  phone: string,
): Promise<string> {
  const name = body.trim();
  await updateSession(phone, {
    step: 'awaiting_area',
    data: { ...session.data, name },
  });
  return t(session.language, 'ask_area');
}

async function handleAwaitingArea(
  session: WaSession,
  body: string,
  phone: string,
): Promise<string> {
  const area = body.trim();
  await updateSession(phone, {
    step: 'awaiting_household',
    data: { ...session.data, area },
  });
  return t(session.language, 'ask_household');
}

async function handleAwaitingHousehold(
  session: WaSession,
  body: string,
  phone: string,
): Promise<string> {
  const parsed = parseInt(body.trim(), 10);
  if (isNaN(parsed) || parsed <= 0) {
    return t(session.language, 'invalid_number');
  }

  await updateSession(phone, {
    step: 'awaiting_need',
    data: { ...session.data, householdSize: parsed },
  });
  return t(session.language, 'ask_need');
}

async function handleAwaitingNeed(
  session: WaSession,
  body: string,
  phone: string,
): Promise<string> {
  const choice = body.trim();
  const need = NEEDS_MAP[choice];

  if (!need) {
    return t(session.language, 'invalid_need');
  }

  const submissionRef = db.collection('submissions').doc();
  const now = Timestamp.now();

  await submissionRef.set({
    fullName: session.data.name ?? '',
    phoneNumber: stripWhatsAppPrefix(phone),
    // PII: admin + Cloud Functions only. Never expose to members.
    whatsappPhone: stripWhatsAppPrefix(phone),
    emailAddress: '',
    gender: 'Male',
    currentGovernorate: session.data.area ?? '',
    previousGovernorate: session.data.area ?? '',
    street: '',
    building: '',
    floor: '',
    city: '',
    ageRanges: { '0-3': 0, '4-12': 0, '13-18': 0, '19-60': 0, '60+': 0 },
    specialNeeds: [],
    needs: [need],
    aidUrgency: 'Medium',
    consentGiven: true,
    comments: '',
    numberOfPeopleInHousehold: session.data.householdSize ?? 1,
    status: 'pending',
    source: 'whatsapp',
    registrationDate: now,
    createdAt: now,
  });

  await updateSession(phone, {
    step: 'complete',
    data: { ...session.data, mainNeed: need },
    submissionId: submissionRef.id,
  });

  return t(session.language, 'registered', { id: submissionRef.id });
}

async function handleStatusCheck(session: WaSession, phone: string): Promise<string> {
  const phoneNumber = stripWhatsAppPrefix(phone);

  const snap = await db
    .collection('submissions')
    .where('whatsappPhone', '==', phoneNumber)
    .orderBy('createdAt', 'desc')
    .limit(1)
    .get();

  if (snap.empty) {
    return t(session.language, 'no_submission');
  }

  const submission = snap.docs[0].data();
  const status = (submission.status as string) ?? 'pending';
  const statusKey = `status_${status}`;

  const ngoName = submission.assignedTo ? (submission.assignedTo as string) : '';
  return t(session.language, statusKey, { ngo: ngoName });
}

/* ------------------------------------------------------------------ */
/*  Main webhook handler                                               */
/* ------------------------------------------------------------------ */

export const whatsappWebhook = onRequest({ region: 'europe-west1' }, async (req, res) => {
  // Twilio sends POST requests for incoming messages
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  const from: string = req.body?.From ?? '';
  const body: string = req.body?.Body ?? '';

  if (!from) {
    res.status(200).send('OK');
    return;
  }

  const phone = stripWhatsAppPrefix(from);

  try {
    // Language switching — available at any state
    const upperBody = body.trim().toUpperCase();
    if (['AR', 'EN', 'FR'].includes(upperBody)) {
      const lang = upperBody.toLowerCase() as BotLanguage;
      await updateSession(phone, { language: lang });
      await sendWhatsApp(from, t(lang, 'lang_set'));
      res.status(200).send('OK');
      return;
    }

    const session = await getOrCreateSession(phone);
    let reply: string;

    switch (session.step) {
      case 'new':
        // First-time user: show the welcome menu
        if (body.trim() !== '1' && body.trim() !== '2') {
          reply = t(session.language, 'welcome');
          // Don't advance state — just show the menu
        } else {
          reply = await handleNew(session, body, phone);
        }
        break;

      case 'awaiting_name':
        reply = await handleAwaitingName(session, body, phone);
        break;

      case 'awaiting_area':
        reply = await handleAwaitingArea(session, body, phone);
        break;

      case 'awaiting_household':
        reply = await handleAwaitingHousehold(session, body, phone);
        break;

      case 'awaiting_need':
        reply = await handleAwaitingNeed(session, body, phone);
        break;

      case 'status_check':
        reply = await handleStatusCheck(session, phone);
        break;

      case 'complete':
        // User completed registration — show welcome menu again for new interaction
        reply = t(session.language, 'welcome');
        await updateSession(phone, { step: 'new', data: {} });
        break;

      default:
        reply = t(session.language, 'welcome');
        break;
    }

    await sendWhatsApp(from, reply);
    logger.info('Webhook processed', { step: session.step });
  } catch (error) {
    logger.error('whatsappWebhook error', {
      step: 'unknown',
      errorCode: error instanceof Error ? error.message : 'UNKNOWN',
    });
  }

  // Always return 200 to prevent Twilio retries
  res.status(200).send('OK');
});
