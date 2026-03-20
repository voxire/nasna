import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from 'sonner';
import { db } from '@/firebase';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/Components/ui/select';

interface PlatformSettingsDocument {
  supportEmail: string;
  supportPhone: string;
  defaultLanguage: 'en' | 'ar' | 'fr';
}

const DEFAULT_SETTINGS: PlatformSettingsDocument = {
  supportEmail: '',
  supportPhone: '',
  defaultLanguage: 'ar',
};

export default function PlatformSettings() {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<PlatformSettingsDocument>(DEFAULT_SETTINGS);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    return onSnapshot(
      doc(db, 'platformSettings', 'global'),
      (snapshot) => {
        if (!snapshot.exists()) {
          setSettings(DEFAULT_SETTINGS);
          return;
        }

        const data = snapshot.data() as Partial<PlatformSettingsDocument>;
        setSettings({
          supportEmail: data.supportEmail ?? '',
          supportPhone: data.supportPhone ?? '',
          defaultLanguage: data.defaultLanguage ?? 'ar',
        });
      },
      (error) => {
        console.error('Platform settings:', error);
        toast.error(t('admin.settings.loadError'));
      },
    );
  }, [t]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(
        doc(db, 'platformSettings', 'global'),
        {
          ...settings,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
      toast.success(t('admin.settings.saveSuccess'));
    } catch (error) {
      console.error('Platform settings save:', error);
      toast.error(t('admin.settings.saveError'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('admin.settings.title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('admin.settings.description')}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('admin.settings.generalTitle')}</CardTitle>
          <CardDescription>{t('admin.settings.generalDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label>{t('admin.settings.supportEmail')}</Label>
            <Input
              type="email"
              value={settings.supportEmail}
              onChange={(event) =>
                setSettings((current) => ({ ...current, supportEmail: event.target.value }))
              }
            />
          </div>

          <div className="space-y-1">
            <Label>{t('admin.settings.supportPhone')}</Label>
            <Input
              value={settings.supportPhone}
              onChange={(event) =>
                setSettings((current) => ({ ...current, supportPhone: event.target.value }))
              }
            />
          </div>

          <div className="space-y-1">
            <Label>{t('admin.settings.defaultLanguage')}</Label>
            <Select
              value={settings.defaultLanguage}
              onValueChange={(value: 'en' | 'ar' | 'fr') =>
                setSettings((current) => ({ ...current, defaultLanguage: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ar">{t('admin.settings.languages.ar')}</SelectItem>
                <SelectItem value="en">{t('admin.settings.languages.en')}</SelectItem>
                <SelectItem value="fr">{t('admin.settings.languages.fr')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {t('admin.settings.warning')}
          </div>

          <div className="flex justify-end">
            <Button
              className="bg-[#12a89d] hover:bg-[#0e9088]"
              disabled={saving}
              onClick={handleSave}
            >
              {saving ? t('admin.settings.saving') : t('admin.settings.save')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
