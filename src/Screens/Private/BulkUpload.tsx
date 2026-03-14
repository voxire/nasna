import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { addDoc, collection, onSnapshot, query, where } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import type { CenterDocument } from '../../types';
import { buildSubmissionWorkflowDefaults } from '@/lib/v2Defaults';
import { Button } from '@/Components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/Components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/Components/ui/table';

// ─── Template column definition ─────────────────────────────────────────────

interface TemplateColumn {
  key: string;
  headerEn: string;
  headerAr: string;
  required: boolean;
  example: string;
}

const TEMPLATE_COLUMNS: TemplateColumn[] = [
  {
    key: 'fullName',
    headerEn: 'Full Name',
    headerAr: 'الاسم الكامل',
    required: true,
    example: 'Ahmad Khalil',
  },
  {
    key: 'phoneNumber',
    headerEn: 'Phone Number',
    headerAr: 'رقم الهاتف',
    required: true,
    example: '+961 71 000 000',
  },
  {
    key: 'gender',
    headerEn: 'Gender (Male/Female)',
    headerAr: 'الجنس (ذكر/أنثى)',
    required: true,
    example: 'Male',
  },
  {
    key: 'locationType',
    headerEn: 'Living Situation (with_family/center)',
    headerAr: 'وضع السكن (with_family/center)',
    required: true,
    example: 'with_family',
  },
  {
    key: 'centerName',
    headerEn: 'Center Name (if in center)',
    headerAr: 'اسم المركز (إذا كان في مركز)',
    required: false,
    example: '',
  },
  {
    key: 'previousGovernorate',
    headerEn: 'Previous Governorate',
    headerAr: 'المحافظة السابقة',
    required: true,
    example: 'South Lebanon',
  },
  {
    key: 'currentGovernorate',
    headerEn: 'Current Governorate',
    headerAr: 'المحافظة الحالية',
    required: true,
    example: 'Beirut',
  },
  {
    key: 'street',
    headerEn: 'Street',
    headerAr: 'الشارع',
    required: true,
    example: 'Hamra Street',
  },
  {
    key: 'building',
    headerEn: 'Building',
    headerAr: 'المبنى',
    required: true,
    example: 'Bldg 12',
  },
  { key: 'floor', headerEn: 'Floor', headerAr: 'الطابق', required: true, example: '3' },
  { key: 'city', headerEn: 'City', headerAr: 'المدينة', required: true, example: 'Beirut' },
  {
    key: 'householdSize',
    headerEn: 'Total Household Size',
    headerAr: 'مجموع عدد الأسرة',
    required: true,
    example: '5',
  },
  {
    key: 'age_0_3',
    headerEn: 'Age 0-3',
    headerAr: 'العمر 0-3',
    required: false,
    example: '1',
  },
  {
    key: 'age_4_12',
    headerEn: 'Age 4-12',
    headerAr: 'العمر 4-12',
    required: false,
    example: '2',
  },
  {
    key: 'age_13_18',
    headerEn: 'Age 13-18',
    headerAr: 'العمر 13-18',
    required: false,
    example: '0',
  },
  {
    key: 'age_19_60',
    headerEn: 'Age 19-60',
    headerAr: 'العمر 19-60',
    required: false,
    example: '2',
  },
  {
    key: 'age_60plus',
    headerEn: 'Age 60+',
    headerAr: 'العمر 60+',
    required: false,
    example: '0',
  },
  {
    key: 'need_food',
    headerEn: 'Food Aid (yes/no)',
    headerAr: 'مساعدات غذائية (نعم/لا)',
    required: false,
    example: 'yes',
  },
  {
    key: 'need_water',
    headerEn: 'Water Supply (yes/no)',
    headerAr: 'إمدادات المياه (نعم/لا)',
    required: false,
    example: 'no',
  },
  {
    key: 'need_shelter',
    headerEn: 'Shelter Materials (yes/no)',
    headerAr: 'مواد إيواء (نعم/لا)',
    required: false,
    example: 'yes',
  },
  {
    key: 'need_hygiene',
    headerEn: 'Hygiene Products (yes/no)',
    headerAr: 'منتجات نظافة (نعم/لا)',
    required: false,
    example: 'no',
  },
  {
    key: 'need_medical',
    headerEn: 'Medical Supplies (yes/no)',
    headerAr: 'إمدادات طبية (نعم/لا)',
    required: false,
    example: 'no',
  },
  {
    key: 'need_clothing',
    headerEn: 'Clothing (yes/no)',
    headerAr: 'ملابس (نعم/لا)',
    required: false,
    example: 'yes',
  },
  {
    key: 'specialNeeds',
    headerEn: 'Special Needs (comma separated)',
    headerAr: 'الاحتياجات الخاصة (مفصولة بفاصلة)',
    required: false,
    example: 'wheelchair, chronic medication',
  },
  {
    key: 'aidUrgency',
    headerEn: 'Aid Urgency (High/Medium/Low)',
    headerAr: 'الأولوية (عالية/متوسطة/منخفضة)',
    required: true,
    example: 'High',
  },
  {
    key: 'comments',
    headerEn: 'Comments',
    headerAr: 'التعليقات',
    required: false,
    example: 'Family of 5 displaced from the south',
  },
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface ParsedRow {
  rowIndex: number;
  raw: Record<string, string>;
  mapped: Record<string, string>;
  errors: string[];
}

type ColumnMapping = Record<string, string>; // templateKey → rawColumnName

// ─── Helpers ─────────────────────────────────────────────────────────────────

function normalizeYesNo(value: string): boolean {
  return ['yes', 'نعم', 'y', '1', 'true'].includes((value ?? '').toLowerCase().trim());
}

function normalizeGender(value: string): 'Male' | 'Female' | '' {
  const lower = (value ?? '').toLowerCase().trim();
  if (['male', 'ذكر', 'm'].includes(lower)) return 'Male';
  if (['female', 'أنثى', 'f'].includes(lower)) return 'Female';
  return '';
}

function normalizeUrgency(value: string): 'High' | 'Medium' | 'Low' | '' {
  const lower = (value ?? '').toLowerCase().trim();
  if (['high', 'عالية', 'h'].includes(lower)) return 'High';
  if (['medium', 'متوسطة', 'm'].includes(lower)) return 'Medium';
  if (['low', 'منخفضة', 'l'].includes(lower)) return 'Low';
  return '';
}

function normalizeLocationType(value: string): 'with_family' | 'center' | '' {
  const lower = (value ?? '').toLowerCase().trim();
  if (['with_family', 'مع العائلة', 'family', 'host'].includes(lower)) return 'with_family';
  if (['center', 'مركز', 'centre'].includes(lower)) return 'center';
  return '';
}

function buildNeedsFromMapped(mapped: Record<string, string>): string[] {
  const mapping: Record<string, string> = {
    need_food: 'food',
    need_water: 'water',
    need_shelter: 'shelter',
    need_hygiene: 'hygiene',
    need_medical: 'medical',
    need_clothing: 'clothing',
  };

  return Object.entries(mapping)
    .filter(([key]) => normalizeYesNo(mapped[key] ?? ''))
    .map(([, label]) => label);
}

// ─── Template download ────────────────────────────────────────────────────────

/** Escape a CSV cell value — wraps in quotes if it contains comma, quote, or newline */
function escapeCsvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function downloadTemplate() {
  const rows = [
    TEMPLATE_COLUMNS.map((col) => col.headerEn),
    TEMPLATE_COLUMNS.map((col) => col.headerAr),
    TEMPLATE_COLUMNS.map((col) => col.example),
  ];

  const csv = rows.map((row) => row.map(escapeCsvCell).join(',')).join('\r\n');

  // BOM for Excel compatibility with UTF-8 Arabic characters
  const bom = '\uFEFF';
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'nasna_bulk_upload_template.csv';
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Minimal CSV parser that handles quoted fields (RFC 4180).
 * Returns an array of rows, each row being an array of string values.
 */
function parseSimpleCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;

  // Normalise line endings
  const input = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    const next = input[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cell += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        row.push(cell);
        cell = '';
      } else if (ch === '\n') {
        row.push(cell);
        cell = '';
        if (row.some((v) => v.trim() !== '')) rows.push(row);
        row = [];
      } else {
        cell += ch;
      }
    }
  }

  // Last cell / row
  row.push(cell);
  if (row.some((v) => v.trim() !== '')) rows.push(row);

  return rows;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function BulkUpload() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [centers, setCenters] = useState<Array<CenterDocument & { id: string }>>([]);
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, string>[]>([]);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({});
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [step, setStep] = useState<'upload' | 'map' | 'preview'>('upload');
  const [submitting, setSubmitting] = useState(false);
  const [submitResults, setSubmitResults] = useState<{
    succeeded: number;
    failed: number;
  } | null>(null);

  // Load centers for name→ID lookup
  useEffect(() => {
    const centerQuery = query(collection(db, 'centers'), where('active', '==', true));
    return onSnapshot(centerQuery, (snapshot) => {
      setCenters(snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as CenterDocument) })));
    });
  }, []);

  // ── Auto-detect column mapping by matching headers ─────────────────────────
  const autoDetectMapping = useCallback((headers: string[]): ColumnMapping => {
    const mapping: ColumnMapping = {};
    const normalizedHeaders = headers.map((h) => h.toLowerCase().trim());

    for (const col of TEMPLATE_COLUMNS) {
      const enLower = col.headerEn.toLowerCase();
      const arLower = col.headerAr.toLowerCase();
      const keyLower = col.key.toLowerCase().replace(/_/g, ' ');

      const idx = normalizedHeaders.findIndex(
        (h) => h === enLower || h === arLower || h.includes(keyLower),
      );

      if (idx !== -1) {
        mapping[col.key] = headers[idx];
      }
    }

    return mapping;
  }, []);

  // ── Parse uploaded file ────────────────────────────────────────────────────
  const parseFile = useCallback(
    (file: File) => {
      const ext = file.name.split('.').pop()?.toLowerCase() ?? '';

      if (ext !== 'csv') {
        toast.error(t('submission.bulk.unsupportedFormat'));
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          // Strip BOM if present
          let text = (event.target?.result as string) ?? '';
          if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);

          const allRows = parseSimpleCsv(text);
          if (allRows.length < 2) {
            toast.error(t('submission.bulk.parseError'));
            return;
          }

          // First non-empty row is the header
          const headers = allRows[0].map((h) => h.trim());
          const dataRows = allRows.slice(1).map((row) => {
            const obj: Record<string, string> = {};
            headers.forEach((h, i) => {
              obj[h] = (row[i] ?? '').trim();
            });
            return obj;
          });

          setRawHeaders(headers);
          setRawRows(dataRows);
          const mapping = autoDetectMapping(headers);
          setColumnMapping(mapping);
          setStep('map');
        } catch {
          toast.error(t('submission.bulk.parseError'));
        }
      };
      reader.onerror = () => {
        toast.error(t('submission.bulk.parseError'));
      };
      reader.readAsText(file, 'utf-8');
    },
    [autoDetectMapping, t],
  );

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) parseFile(file);
  };

  // ── Validate all rows based on current mapping ─────────────────────────────
  const validateRows = useCallback(() => {
    const rows: ParsedRow[] = rawRows.map((raw, i) => {
      const mapped: Record<string, string> = {};
      for (const [templateKey, rawCol] of Object.entries(columnMapping)) {
        mapped[templateKey] = (raw[rawCol] ?? '').trim();
      }

      const errors: string[] = [];

      if (!mapped.fullName) errors.push(t('submission.bulk.errors.missingName'));
      if (!mapped.phoneNumber) errors.push(t('submission.bulk.errors.missingPhone'));
      if (!normalizeGender(mapped.gender)) errors.push(t('submission.bulk.errors.invalidGender'));
      if (!normalizeLocationType(mapped.locationType))
        errors.push(t('submission.bulk.errors.invalidLocationType'));
      if (!mapped.previousGovernorate) errors.push(t('submission.bulk.errors.missingPrevGov'));
      if (!mapped.currentGovernorate && normalizeLocationType(mapped.locationType) !== 'center')
        errors.push(t('submission.bulk.errors.missingCurrGov'));
      if (!normalizeUrgency(mapped.aidUrgency))
        errors.push(t('submission.bulk.errors.invalidUrgency'));

      const hs = Number(mapped.householdSize);
      if (!Number.isFinite(hs) || hs < 1) errors.push(t('submission.bulk.errors.invalidHousehold'));

      if (normalizeLocationType(mapped.locationType) === 'center') {
        const centerName = (mapped.centerName ?? '').trim();
        if (centerName) {
          const found = centers.find((c) => c.name.toLowerCase() === centerName.toLowerCase());
          if (!found) errors.push(t('submission.bulk.errors.centerNotFound', { name: centerName }));
        }
      }

      return { rowIndex: i + 1, raw, mapped, errors };
    });

    setParsedRows(rows);
    setStep('preview');
  }, [rawRows, columnMapping, centers, t]);

  const validRows = useMemo(() => parsedRows.filter((r) => r.errors.length === 0), [parsedRows]);
  const invalidRows = useMemo(() => parsedRows.filter((r) => r.errors.length > 0), [parsedRows]);

  // ── Submit valid rows ──────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (validRows.length === 0) return;

    setSubmitting(true);
    let succeeded = 0;
    let failed = 0;
    const agentUid = auth.currentUser?.uid ?? '';

    for (const row of validRows) {
      try {
        const { mapped } = row;
        const locationType = normalizeLocationType(mapped.locationType) || 'with_family';

        let centerId = '';
        let currentGovernorate = mapped.currentGovernorate ?? '';
        let street = mapped.street ?? '';
        let building = mapped.building ?? '';
        let floor = mapped.floor ?? '';
        let city = mapped.city ?? '';

        if (locationType === 'center') {
          const centerName = (mapped.centerName ?? '').trim();
          const center = centers.find((c) => c.name.toLowerCase() === centerName.toLowerCase());
          if (center) {
            centerId = center.id;
            currentGovernorate = center.governorate;
            city = center.district ?? '';
            street = center.address ?? '';
            building = center.name;
            floor = 'Center intake';
          }
        }

        const ageRanges = {
          '0-3': Number(mapped.age_0_3 ?? 0) || 0,
          '4-12': Number(mapped.age_4_12 ?? 0) || 0,
          '13-18': Number(mapped.age_13_18 ?? 0) || 0,
          '19-60': Number(mapped.age_19_60 ?? 0) || 0,
          '60+': Number(mapped.age_60plus ?? 0) || 0,
        };

        const specialNeeds = (mapped.specialNeeds ?? '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);

        const workflowDefaults = buildSubmissionWorkflowDefaults('agent');
        const payload = {
          ...workflowDefaults,
          fullName: mapped.fullName,
          phoneNumber: mapped.phoneNumber,
          emailAddress: '',
          gender: normalizeGender(mapped.gender),
          currentGovernorate,
          previousGovernorate: mapped.previousGovernorate ?? '',
          street,
          building,
          floor,
          city,
          locationType,
          centerId,
          ageRanges,
          specialNeeds,
          needs: buildNeedsFromMapped(mapped),
          aidUrgency: normalizeUrgency(mapped.aidUrgency) || 'Medium',
          consentGiven: true,
          comments: (mapped.comments ?? '').trim(),
          numberOfPeopleInHousehold: Number(mapped.householdSize) || 1,
          registrationDate: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          agent: agentUid,
        };

        await addDoc(collection(db, 'submissions'), payload);
        succeeded++;
      } catch {
        failed++;
      }
    }

    setSubmitting(false);
    setSubmitResults({ succeeded, failed });

    if (succeeded > 0) {
      toast.success(t('submission.bulk.submitSuccess', { count: succeeded }));
    }

    if (failed > 0) {
      toast.error(t('submission.bulk.submitPartialFail', { count: failed }));
    }
  };

  const reset = () => {
    setRawHeaders([]);
    setRawRows([]);
    setColumnMapping({});
    setParsedRows([]);
    setStep('upload');
    setSubmitResults(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{t('submission.bulk.title')}</h1>
          <p className="text-sm text-gray-500">{t('submission.bulk.description')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={downloadTemplate}>
            {t('submission.bulk.downloadTemplate')}
          </Button>
          <Button variant="outline" onClick={() => navigate('/agent/submissions')}>
            {t('submission.mySubmissions')}
          </Button>
        </div>
      </div>

      {/* Step 1: Upload */}
      {step === 'upload' ? (
        <div className="rounded-xl border-2 border-dashed border-gray-300 bg-white p-12 text-center">
          <p className="mb-2 text-lg font-medium text-gray-700">{t('submission.bulk.dropFile')}</p>
          <p className="mb-6 text-sm text-gray-500">{t('submission.bulk.supportedFormats')}</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
            id="bulk-file-input"
          />
          <Button
            className="bg-[#12a89d] text-white hover:bg-[#0e9088]"
            onClick={() => fileInputRef.current?.click()}
          >
            {t('submission.bulk.selectFile')}
          </Button>
        </div>
      ) : null}

      {/* Step 2: Column mapping */}
      {step === 'map' ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-800">
              {t('submission.bulk.mapColumns')}
            </h2>
            <p className="mb-4 text-sm text-gray-500">
              {t('submission.bulk.mapColumnsDescription')}
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              {TEMPLATE_COLUMNS.map((col) => (
                <div key={col.key} className="flex items-center gap-3">
                  <div className="w-48 shrink-0">
                    <p className="text-sm font-medium text-gray-700">{col.headerEn}</p>
                    <p className="text-xs text-gray-400">{col.headerAr}</p>
                    {col.required ? (
                      <span className="text-xs text-rose-500">{t('submission.bulk.required')}</span>
                    ) : null}
                  </div>
                  <Select
                    value={columnMapping[col.key] ?? '__none__'}
                    onValueChange={(value) =>
                      setColumnMapping((prev) => ({
                        ...prev,
                        [col.key]: value === '__none__' ? '' : value,
                      }))
                    }
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder={t('submission.bulk.selectColumn')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">{t('submission.bulk.notMapped')}</SelectItem>
                      {rawHeaders.map((header) => (
                        <SelectItem key={header} value={header}>
                          {header}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <Button className="bg-[#12a89d] text-white hover:bg-[#0e9088]" onClick={validateRows}>
              {t('submission.bulk.validateRows')} ({rawRows.length})
            </Button>
            <Button variant="outline" onClick={reset}>
              {t('submission.bulk.startOver')}
            </Button>
          </div>
        </div>
      ) : null}

      {/* Step 3: Preview */}
      {step === 'preview' ? (
        <div className="space-y-4">
          {submitResults ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="font-medium text-emerald-800">
                {t('submission.bulk.doneMessage', {
                  succeeded: submitResults.succeeded,
                  failed: submitResults.failed,
                })}
              </p>
              <div className="mt-3 flex gap-3">
                <Button
                  className="bg-[#12a89d] text-white hover:bg-[#0e9088]"
                  onClick={() => navigate('/agent/submissions')}
                >
                  {t('submission.bulk.viewSubmissions')}
                </Button>
                <Button variant="outline" onClick={reset}>
                  {t('submission.bulk.uploadMore')}
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-4">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800">
                  {t('submission.bulk.validCount', { count: validRows.length })}
                </div>
                {invalidRows.length > 0 ? (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700">
                    {t('submission.bulk.invalidCount', { count: invalidRows.length })}
                  </div>
                ) : null}
                <Button variant="outline" onClick={() => setStep('map')} size="sm">
                  {t('submission.bulk.backToMapping')}
                </Button>
              </div>

              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-semibold">#</TableHead>
                      <TableHead className="font-semibold">
                        {t('submission.bulk.colFullName')}
                      </TableHead>
                      <TableHead className="font-semibold">
                        {t('submission.bulk.colPhone')}
                      </TableHead>
                      <TableHead className="font-semibold">
                        {t('submission.bulk.colGovernorate')}
                      </TableHead>
                      <TableHead className="font-semibold">
                        {t('submission.bulk.colUrgency')}
                      </TableHead>
                      <TableHead className="font-semibold">
                        {t('submission.bulk.colStatus')}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedRows.map((row) => (
                      <TableRow
                        key={row.rowIndex}
                        className={row.errors.length > 0 ? 'bg-rose-50' : ''}
                      >
                        <TableCell className="text-gray-500">{row.rowIndex}</TableCell>
                        <TableCell className="font-medium">{row.mapped.fullName || '-'}</TableCell>
                        <TableCell>{row.mapped.phoneNumber || '-'}</TableCell>
                        <TableCell>{row.mapped.currentGovernorate || '-'}</TableCell>
                        <TableCell>{row.mapped.aidUrgency || '-'}</TableCell>
                        <TableCell>
                          {row.errors.length === 0 ? (
                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                              {t('submission.bulk.rowValid')}
                            </span>
                          ) : (
                            <span
                              className="cursor-help rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-700"
                              title={row.errors.join(' · ')}
                            >
                              {t('submission.bulk.rowInvalid')} ({row.errors.length})
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {validRows.length > 0 ? (
                <Button
                  className="bg-[#12a89d] text-white hover:bg-[#0e9088]"
                  onClick={() => void handleSubmit()}
                  disabled={submitting}
                >
                  {submitting
                    ? t('submission.bulk.submitting')
                    : t('submission.bulk.submitValid', { count: validRows.length })}
                </Button>
              ) : null}
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
