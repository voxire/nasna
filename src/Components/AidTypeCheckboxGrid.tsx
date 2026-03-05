import { useTranslation } from 'react-i18next';
import { Checkbox } from '@/Components/ui/checkbox';
import { Label } from '@/Components/ui/label';

const AID_TYPES = ['food', 'water', 'shelter', 'hygiene', 'medical', 'clothing'] as const;

type AidType = (typeof AID_TYPES)[number];

interface AidTypeCheckboxGridProps {
  selected: string[];
  onChange: (selected: string[]) => void;
  i18nPrefix: string;
}

function AidTypeCheckboxGrid({ selected, onChange, i18nPrefix }: AidTypeCheckboxGridProps) {
  const { t } = useTranslation();

  const handleToggle = (aidType: AidType, checked: boolean) => {
    if (checked) {
      onChange([...selected, aidType]);
    } else {
      onChange(selected.filter((s) => s !== aidType));
    }
  };

  return (
    <div className="grid grid-cols-2 gap-2">
      {AID_TYPES.map((aidType) => (
        <div key={aidType} className="flex items-center gap-2 py-1">
          <Checkbox
            id={`aid-${aidType}`}
            checked={selected.includes(aidType)}
            onCheckedChange={(checked) => handleToggle(aidType, Boolean(checked))}
            className="border-gray-300 data-[state=checked]:bg-[#12a89d] data-[state=checked]:border-[#12a89d]"
          />
          <Label htmlFor={`aid-${aidType}`} className="text-sm text-gray-700 cursor-pointer">
            {t(`${i18nPrefix}.${aidType}`)}
          </Label>
        </div>
      ))}
    </div>
  );
}

export default AidTypeCheckboxGrid;
