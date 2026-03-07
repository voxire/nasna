import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import QRCode from 'qrcode';
import { Button } from '@/Components/ui/button';
import { Printer } from 'lucide-react';

interface WhatsAppQRCodeProps {
  centerName: string;
}

export default function WhatsAppQRCode({ centerName }: WhatsAppQRCodeProps) {
  const { t } = useTranslation();
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  const whatsappNumber = import.meta.env.VITE_WHATSAPP_NUMBER as string | undefined;
  const waUrl = `https://wa.me/${whatsappNumber ?? ''}`;

  useEffect(() => {
    if (!whatsappNumber) {
      setError(true);
      return;
    }

    QRCode.toDataURL(waUrl, { width: 280, margin: 2 })
      .then(setQrDataUrl)
      .catch(() => setError(true));
  }, [waUrl, whatsappNumber]);

  const handlePrint = () => {
    window.print();
  };

  if (error) {
    return <p className="text-sm text-red-600">{t('admin.centers.qrError')}</p>;
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        id="qr-print-area"
        className="flex flex-col items-center gap-3 rounded-lg bg-white p-6 print:p-0"
      >
        <p className="text-xl font-bold text-[#12a89d]">Nasna</p>

        {qrDataUrl ? (
          <img src={qrDataUrl} alt={`WhatsApp QR for ${centerName}`} className="h-auto w-[280px]" />
        ) : (
          <div className="flex h-[280px] w-[280px] items-center justify-center">
            <p className="text-sm text-gray-400">{t('admin.centers.saving')}</p>
          </div>
        )}

        <p className="text-center text-base font-semibold text-gray-800">{centerName}</p>
        <p className="text-center text-sm text-gray-600" dir="rtl">
          {t('admin.centers.qrScanLabel')}
        </p>
      </div>

      <Button
        variant="outline"
        onClick={handlePrint}
        className="flex items-center gap-2 print:hidden"
      >
        <Printer className="h-4 w-4" />
        {t('admin.centers.qrPrint')}
      </Button>
    </div>
  );
}
