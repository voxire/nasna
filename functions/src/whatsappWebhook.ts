import crypto from 'crypto';
import { getApps, initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore, Timestamp } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';
import { onRequest } from 'firebase-functions/v2/https';
import { z } from 'zod';
import { sendWhatsAppText } from './utils/meta';

if (getApps().length === 0) {
  initializeApp();
}

const db = getFirestore();

// ------------------------------------------------------------------ //
// Types (Cloud Functions internal only — do NOT add to src/types)    //
// ------------------------------------------------------------------ //

type WaState =
  | 'start'
  | 'collecting_name'
  | 'collecting_area'
  | 'collecting_household'
  | 'collecting_need'
  | 'done'
  | 'checking_status';

type BotLang = 'ar' | 'en' | 'fr';

interface WaSession {
  phone: string;
  state: WaState;
  lang: BotLang;
  data: {
    name?: string;
    currentGovernorate?: string;
    numberOfPeopleInHousehold?: number;
    needs?: string[];
  };
  updatedAt: Timestamp;
}

// ------------------------------------------------------------------ //
// Submission schema (Zod)                                             //
// ------------------------------------------------------------------ //

const WaSubmissionSchema = z.object({
  fullName: z.string().min(1),
  currentGovernorate: z.string().min(1),
  numberOfPeopleInHousehold: z.number().int().min(1).max(50),
  needs: z.array(z.string()).min(1),
  // PII: admin + Cloud Functions only. Never expose to members.
  whatsappPhone: z.string().min(1),
  source: z.literal('whatsapp'),
  status: z.literal('pending'),
  // consentGiven: true — user initiating contact via WhatsApp constitutes consent per Nasna's
  // terms of service. This assumption must be reviewed with legal before production launch.
  consentGiven: z.literal(true),
  locationType: z.literal('with_family'),
  aidUrgency: z.literal('Medium'),
});

// ------------------------------------------------------------------ //
// Maps                                                                //
// ------------------------------------------------------------------ //

const GOVERNORATE_MAP: Record<string, string> = {
  '1': 'Beirut',
  '2': 'Mount Lebanon',
  '3': 'North Lebanon',
  '4': 'Akkar',
  '5': 'Beqaa',
  '6': 'Baalbek-Hermel',
  '7': 'South Lebanon',
  '8': 'Nabatieh',
};

const NEED_MAP: Record<string, string> = {
  '1': 'food',
  '2': 'water',
  '3': 'shelter',
  '4': 'medical',
  '5': 'clothing',
  '6': 'baby_supplies',
  '7': 'psychosocial',
  '8': 'legal_docs',
};

// ------------------------------------------------------------------ //
// i18n strings                                                        //
// ------------------------------------------------------------------ //

type StringKey =
  | 'welcome'
  | 'ask_name'
  | 'ask_area'
  | 'ask_household'
  | 'ask_need'
  | 'ask_status_id'
  | 'invalid_area'
  | 'invalid_household'
  | 'invalid_need'
  | 'invalid_menu'
  | 'text_only'
  | 'registered'
  | 'status_not_found'
  | 'status_pending'
  | 'status_assigned'
  | 'status_completed'
  | 'status_cancelled';

const STRINGS: Record<BotLang, Record<StringKey, string>> = {
  ar: {
    welcome:
      'أهلاً بك في نسنا. اكتب 1 للتسجيل أو 2 للاستفسار عن حالتك.\n\nType EN for English. Tapez FR pour le français.',
    ask_name: 'ما اسمك الكامل؟',
    ask_area:
      'في أي محافظة أنتم الآن؟\n1. بيروت\n2. جبل لبنان\n3. الشمال\n4. عكار\n5. البقاع\n6. بعلبك-الهرمل\n7. الجنوب\n8. النبطية',
    ask_household: 'كم عدد أفراد الأسرة؟ (أرسل رقماً بين 1 و50)',
    ask_need:
      'ما هي حاجتك الأكثر إلحاحاً؟\n1. طعام\n2. مياه\n3. مأوى\n4. رعاية طبية\n5. ملابس\n6. مستلزمات أطفال\n7. دعم نفسي\n8. وثائق قانونية',
    ask_status_id: 'أرسل رقم حالتك للاستفسار عنها.',
    invalid_area:
      'يرجى إرسال رقم من 1 إلى 8.\n1. بيروت\n2. جبل لبنان\n3. الشمال\n4. عكار\n5. البقاع\n6. بعلبك-الهرمل\n7. الجنوب\n8. النبطية',
    invalid_household: 'يرجى إرسال رقم بين 1 و50.',
    invalid_need:
      'يرجى إرسال رقم من 1 إلى 8.\n1. طعام\n2. مياه\n3. مأوى\n4. رعاية طبية\n5. ملابس\n6. مستلزمات أطفال\n7. دعم نفسي\n8. وثائق قانونية',
    invalid_menu: 'يرجى اختيار 1 للتسجيل أو 2 للاستفسار عن حالتك.',
    text_only: 'يرجى إرسال رسالة نصية فقط.',
    registered:
      'تم تسجيلك بنجاح. رقم حالتك هو: {{id}}. احتفظ بهذا الرقم — يمكنك إرساله في أي وقت للاستفسار عن حالتك.',
    status_not_found: 'لم يتم العثور على حالة بهذا الرقم. تأكد من الرقم وحاول مجدداً.',
    status_pending: 'قيد الانتظار',
    status_assigned: 'تم التعيين',
    status_completed: 'مكتمل',
    status_cancelled: 'ملغى',
  },
  en: {
    welcome:
      'Welcome to Nasna. Type 1 to register or 2 to check your case status.\n\nType EN for English. Tapez FR pour le français.',
    ask_name: 'What is your full name?',
    ask_area:
      'Which governorate are you currently in?\n1. Beirut\n2. Mount Lebanon\n3. North Lebanon\n4. Akkar\n5. Beqaa\n6. Baalbek-Hermel\n7. South Lebanon\n8. Nabatieh',
    ask_household: 'How many people are in your household? (Enter a number between 1 and 50)',
    ask_need:
      'What is your most urgent need?\n1. Food\n2. Water\n3. Shelter\n4. Medical care\n5. Clothing\n6. Baby supplies\n7. Psychosocial support\n8. Legal documents',
    ask_status_id: 'Please send your case ID.',
    invalid_area:
      'Please send a number between 1 and 8.\n1. Beirut\n2. Mount Lebanon\n3. North Lebanon\n4. Akkar\n5. Beqaa\n6. Baalbek-Hermel\n7. South Lebanon\n8. Nabatieh',
    invalid_household: 'Please enter a number between 1 and 50.',
    invalid_need:
      'Please send a number between 1 and 8.\n1. Food\n2. Water\n3. Shelter\n4. Medical care\n5. Clothing\n6. Baby supplies\n7. Psychosocial support\n8. Legal documents',
    invalid_menu: 'Please choose 1 to register or 2 to check your case.',
    text_only: 'Please send a text message only.',
    registered:
      'You have been registered successfully. Your case ID is: {{id}}. Keep this number — you can send it anytime to check your case status.',
    status_not_found: 'No case was found with that ID. Please verify the ID and try again.',
    status_pending: 'Pending',
    status_assigned: 'Assigned',
    status_completed: 'Completed',
    status_cancelled: 'Cancelled',
  },
  fr: {
    welcome:
      'Bienvenue sur Nasna. Tapez 1 pour vous inscrire ou 2 pour vérifier votre dossier.\n\nType EN for English. Tapez FR pour le français.',
    ask_name: 'Quel est votre nom complet ?',
    ask_area:
      'Dans quel gouvernorat êtes-vous actuellement ?\n1. Beyrouth\n2. Mont Liban\n3. Liban-Nord\n4. Akkar\n5. Békaa\n6. Baalbek-Hermel\n7. Liban-Sud\n8. Nabatieh',
    ask_household: 'Combien de personnes dans votre foyer ? (Envoyez un nombre entre 1 et 50)',
    ask_need:
      'Quel est votre besoin le plus urgent ?\n1. Nourriture\n2. Eau\n3. Abri\n4. Soins médicaux\n5. Vêtements\n6. Fournitures pour bébé\n7. Soutien psychosocial\n8. Documents légaux',
    ask_status_id: 'Veuillez envoyer votre numéro de dossier.',
    invalid_area:
      'Veuillez envoyer un numéro entre 1 et 8.\n1. Beyrouth\n2. Mont Liban\n3. Liban-Nord\n4. Akkar\n5. Békaa\n6. Baalbek-Hermel\n7. Liban-Sud\n8. Nabatieh',
    invalid_household: 'Veuillez entrer un nombre entre 1 et 50.',
    invalid_need:
      'Veuillez envoyer un numéro entre 1 et 8.\n1. Nourriture\n2. Eau\n3. Abri\n4. Soins médicaux\n5. Vêtements\n6. Fournitures pour bébé\n7. Soutien psychosocial\n8. Documents légaux',
    invalid_menu: 'Veuillez choisir 1 pour vous inscrire ou 2 pour vérifier votre dossier.',
    text_only: 'Veuillez envoyer un message texte uniquement.',
    registered:
      "Vous avez été enregistré avec succès. Votre numéro de dossier est : {{id}}. Gardez ce numéro — vous pouvez l'envoyer à tout moment pour vérifier le statut de votre dossier.",
    status_not_found:
      "Aucun dossier trouvé avec cet identifiant. Vérifiez l'identifiant et réessayez.",
    status_pending: 'En attente',
    status_assigned: 'Assigné',
    status_completed: 'Complété',
    status_cancelled: 'Annulé',
  },
};

function t(lang: BotLang, key: StringKey, vars?: Record<string, string>): string {
  let text = STRINGS[lang][key];
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      text = text.replace(`{{${k}}}`, v);
    }
  }
  return text;
}

function getStatePrompt(state: WaState, lang: BotLang): string {
  switch (state) {
    case 'start':
      return t(lang, 'welcome');
    case 'collecting_name':
      return t(lang, 'ask_name');
    case 'collecting_area':
      return t(lang, 'ask_area');
    case 'collecting_household':
      return t(lang, 'ask_household');
    case 'collecting_need':
      return t(lang, 'ask_need');
    case 'checking_status':
      return t(lang, 'ask_status_id');
    case 'done':
      return t(lang, 'welcome');
  }
}

// ------------------------------------------------------------------ //
// Signature validation                                                //
// ------------------------------------------------------------------ //

function isValidHubSignature(
  rawBody: Buffer,
  signatureHeader: string | undefined,
  secret: string,
): boolean {
  if (!signatureHeader?.startsWith('sha256=')) {
    return false;
  }

  const actualHex = signatureHeader.slice(7);
  const expectedHex = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');

  try {
    // Use timing-safe comparison to prevent timing attacks
    return crypto.timingSafeEqual(Buffer.from(expectedHex, 'hex'), Buffer.from(actualHex, 'hex'));
  } catch {
    return false;
  }
}

// ------------------------------------------------------------------ //
// Session helpers                                                     //
// ------------------------------------------------------------------ //

async function getOrCreateSession(phone: string): Promise<WaSession> {
  const docRef = db.collection('wa_sessions').doc(phone);
  const snap = await docRef.get();

  if (snap.exists) {
    return snap.data() as WaSession;
  }

  const newSession: WaSession = {
    phone,
    state: 'start',
    lang: 'ar',
    data: {},
    updatedAt: Timestamp.now(),
  };
  await docRef.set(newSession);
  return newSession;
}

async function updateSession(
  phone: string,
  updates: Partial<Omit<WaSession, 'phone' | 'updatedAt'>>,
): Promise<void> {
  await db
    .collection('wa_sessions')
    .doc(phone)
    .update({ ...updates, updatedAt: Timestamp.now() });
}

// ------------------------------------------------------------------ //
// State handlers                                                      //
// ------------------------------------------------------------------ //

async function handleStart(session: WaSession, text: string, phone: string): Promise<string> {
  const choice = text.trim();

  if (choice === '1') {
    await updateSession(phone, { state: 'collecting_name' });
    return t(session.lang, 'ask_name');
  }

  if (choice === '2') {
    await updateSession(phone, { state: 'checking_status' });
    return t(session.lang, 'ask_status_id');
  }

  // Any other input — re-show welcome without advancing state
  return t(session.lang, 'welcome');
}

async function handleCollectingName(
  session: WaSession,
  text: string,
  phone: string,
): Promise<string> {
  const name = text.trim();
  await updateSession(phone, {
    state: 'collecting_area',
    data: { ...session.data, name },
  });
  return t(session.lang, 'ask_area');
}

async function handleCollectingArea(
  session: WaSession,
  text: string,
  phone: string,
): Promise<string> {
  const governorate = GOVERNORATE_MAP[text.trim()];

  if (!governorate) {
    return t(session.lang, 'invalid_area');
  }

  await updateSession(phone, {
    state: 'collecting_household',
    data: { ...session.data, currentGovernorate: governorate },
  });
  return t(session.lang, 'ask_household');
}

async function handleCollectingHousehold(
  session: WaSession,
  text: string,
  phone: string,
): Promise<string> {
  const parsed = parseInt(text.trim(), 10);

  if (isNaN(parsed) || parsed < 1 || parsed > 50) {
    return t(session.lang, 'invalid_household');
  }

  await updateSession(phone, {
    state: 'collecting_need',
    data: { ...session.data, numberOfPeopleInHousehold: parsed },
  });
  return t(session.lang, 'ask_need');
}

async function handleCollectingNeed(
  session: WaSession,
  text: string,
  phone: string,
): Promise<string> {
  const need = NEED_MAP[text.trim()];

  if (!need) {
    return t(session.lang, 'invalid_need');
  }

  // Build and validate through Zod before writing to Firestore
  const submissionPayload = {
    fullName: session.data.name ?? '',
    currentGovernorate: session.data.currentGovernorate ?? '',
    numberOfPeopleInHousehold: session.data.numberOfPeopleInHousehold ?? 1,
    needs: [need],
    // PII: admin + Cloud Functions only. Never expose to members.
    whatsappPhone: phone,
    source: 'whatsapp' as const,
    status: 'pending' as const,
    // consentGiven: true — user initiating contact via WhatsApp constitutes consent per Nasna's
    // terms of service. This assumption must be reviewed with legal before production launch.
    consentGiven: true as const,
    locationType: 'with_family' as const,
    aidUrgency: 'Medium' as const,
  };

  const validated = WaSubmissionSchema.parse(submissionPayload);

  const submissionRef = db.collection('submissions').doc();
  await submissionRef.set({
    ...validated,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  const submissionId = submissionRef.id;

  // Mark done then clean up the session
  await updateSession(phone, { state: 'done' });
  await db.collection('wa_sessions').doc(phone).delete();

  return t(session.lang, 'registered', { id: submissionId });
}

async function handleCheckingStatus(
  session: WaSession,
  text: string,
  phone: string,
): Promise<string> {
  const caseId = text.trim();

  if (!caseId) {
    return t(session.lang, 'ask_status_id');
  }

  const snap = await db.collection('submissions').doc(caseId).get();

  if (!snap.exists) {
    return t(session.lang, 'status_not_found');
  }

  const submission = snap.data() as { status?: string; whatsappPhone?: string };

  // PII: match whatsappPhone to prevent a user from checking someone else's case by guessing an ID
  if (submission.whatsappPhone !== phone) {
    return t(session.lang, 'status_not_found');
  }

  const statusKeyMap: Partial<Record<string, StringKey>> = {
    pending: 'status_pending',
    assigned: 'status_assigned',
    completed: 'status_completed',
    cancelled: 'status_cancelled',
  };

  const statusKey: StringKey = statusKeyMap[submission.status ?? ''] ?? 'status_pending';
  return t(session.lang, statusKey);
}

// ------------------------------------------------------------------ //
// Cloud Function                                                      //
// ------------------------------------------------------------------ //

// IMPORTANT — Development mode limitation:
// While the Meta app is in Development mode, webhooks are only delivered for test messages
// sent from the API Setup dashboard. Switch the app to Live mode before real users can register.
// Developer checklist after deploying:
//   1. Paste the Cloud Function URL into WhatsApp > Configuration > Callback URL
//   2. Enter your META_WA_VERIFY_TOKEN in the "Verify token" field and click "Verify and save"
//   3. Subscribe to the "messages" webhook field in the Configuration page
//   4. Submit the 'nasna_case_assigned' template in WhatsApp Manager for approval
//   5. Toggle App Mode from Development → Live

export const whatsappWebhook = onRequest(
  {
    region: 'europe-west1',
    secrets: [
      'META_WA_PHONE_NUMBER_ID',
      'META_WA_ACCESS_TOKEN',
      'META_WA_APP_SECRET',
      'META_WA_VERIFY_TOKEN',
    ],
  },
  async (req, res) => {
    // ---- GET: Webhook verification ----
    // Meta sends this when you first register the webhook URL in the Meta console.
    if (req.method === 'GET') {
      const verifyToken = String(req.query['hub.verify_token'] ?? '');
      const challenge = String(req.query['hub.challenge'] ?? '');

      if (
        req.query['hub.mode'] === 'subscribe' &&
        verifyToken === process.env.META_WA_VERIFY_TOKEN
      ) {
        res.status(200).send(challenge);
      } else {
        res.sendStatus(403);
      }
      return;
    }

    if (req.method !== 'POST') {
      res.sendStatus(405);
      return;
    }

    // ---- POST: Incoming message ----

    // STEP 1: Validate X-Hub-Signature-256 BEFORE processing any payload.
    // rawBody is provided by Firebase Functions v2 runtime before any body parsing.
    const rawBody = req.rawBody as Buffer | undefined;
    const appSecret = process.env.META_WA_APP_SECRET;

    if (!rawBody || !appSecret) {
      logger.error('Missing rawBody or META_WA_APP_SECRET — rejecting request');
      res.sendStatus(401);
      return;
    }

    if (
      !isValidHubSignature(
        rawBody,
        req.headers['x-hub-signature-256'] as string | undefined,
        appSecret,
      )
    ) {
      logger.warn('Invalid X-Hub-Signature-256 — request rejected');
      res.sendStatus(401);
      return;
    }

    // STEP 2: Parse Meta webhook payload.
    // Only handle 'messages' field type; silently ignore status update events.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const messages: unknown[] | undefined = (req.body as any)?.entry?.[0]?.changes?.[0]?.value
      ?.messages;

    // Status update events (no messages array) — acknowledge silently
    if (!messages || messages.length === 0) {
      res.sendStatus(200);
      return;
    }

    // STEP 3: Respond 200 immediately — Meta does not wait for processing
    res.sendStatus(200);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const message = messages[0] as any;
    const from: string = message?.from ?? '';
    const messageType: string = message?.type ?? '';

    if (!from) {
      return;
    }

    // STEP 4: Non-text messages — reply and return
    if (messageType !== 'text') {
      await sendWhatsAppText(from, t('ar', 'text_only'));
      return;
    }

    const text: string = message?.text?.body ?? '';

    try {
      // Language switching — works at any state without advancing the flow
      const upperText = text.trim().toUpperCase();
      const langSwitch: Record<string, BotLang> = { EN: 'en', FR: 'fr', AR: 'ar' };
      const switchLang = langSwitch[upperText];

      if (switchLang) {
        const session = await getOrCreateSession(from);
        await updateSession(from, { lang: switchLang });
        // Re-send the current state's prompt in the new language
        await sendWhatsAppText(from, getStatePrompt(session.state, switchLang));
        logger.info('Language switched', { lang: switchLang, state: session.state });
        return;
      }

      const session = await getOrCreateSession(from);
      let reply: string;

      switch (session.state) {
        case 'start':
          reply = await handleStart(session, text, from);
          break;

        case 'collecting_name':
          reply = await handleCollectingName(session, text, from);
          break;

        case 'collecting_area':
          reply = await handleCollectingArea(session, text, from);
          break;

        case 'collecting_household':
          reply = await handleCollectingHousehold(session, text, from);
          break;

        case 'collecting_need':
          reply = await handleCollectingNeed(session, text, from);
          break;

        case 'checking_status':
          reply = await handleCheckingStatus(session, text, from);
          break;

        case 'done':
          // Session was not cleaned up after registration — reset gracefully
          await db.collection('wa_sessions').doc(from).delete();
          reply = t(session.lang, 'welcome');
          break;

        default:
          reply = t('ar', 'welcome');
          break;
      }

      await sendWhatsAppText(from, reply);
      logger.info('Webhook processed', { state: session.state });
    } catch (error) {
      logger.error('whatsappWebhook error', {
        // Never log 'from' (PII)
        errorMessage: error instanceof Error ? error.message : 'UNKNOWN',
      });
    }
  },
);
