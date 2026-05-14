import { useState } from 'react';
import { 
  ChevronDown, 
  ChevronUp, 
  Activity,
  LucideIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface ChecklistField {
  key: string;
  label: string;
  icon: LucideIcon;
  type: 'boolean' | 'select';
  positiveText?: string;
  negativeText?: string;
  options?: { value: string; label: string }[];
  hasDetails?: boolean;
  detailsPlaceholder?: string;
  showDetailsWhen?: 'always' | 'positive' | 'negative';
}

interface ChecklistSectionProps {
  title: string;
  fields: ChecklistField[];
  checklistData: Record<string, any>;
  onValueChange: (key: string, value: any) => void;
  onDetailsChange: (key: string, details: string) => void;
}

export function ChecklistSection({ 
  title, 
  fields, 
  checklistData, 
  onValueChange, 
  onDetailsChange 
}: ChecklistSectionProps) {
  const [showMore, setShowMore] = useState(false);
  const visibleFields = fields.slice(0, 6);
  const hiddenFields = fields.slice(6);

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
          <Activity className="w-4 h-4 text-primary-600" />
          {title}
        </h4>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        {visibleFields.map((field) => (
          <ChecklistItem
            key={field.key}
            field={field}
            value={checklistData[field.key]?.value}
            details={checklistData[field.key]?.details || ''}
            onValueChange={(val: any) => onValueChange(field.key, val)}
            onDetailsChange={(val: string) => onDetailsChange(field.key, val)}
          />
        ))}
      </div>

      {hiddenFields.length > 0 && (
        <>
          {showMore && (
            <div className="grid grid-cols-2 gap-3 mt-3">
              {hiddenFields.map((field) => (
                <ChecklistItem
                  key={field.key}
                  field={field}
                  value={checklistData[field.key]?.value}
                  details={checklistData[field.key]?.details || ''}
                  onValueChange={(val: any) => onValueChange(field.key, val)}
                  onDetailsChange={(val: string) => onDetailsChange(field.key, val)}
                />
              ))}
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            type="button"
            onClick={() => setShowMore(!showMore)}
            className="mt-3 text-xs text-primary-600 hover:text-primary-700 hover:bg-primary-50 h-7"
          >
            {showMore ? <ChevronUp className="w-3.5 h-3.5 mr-1" /> : <ChevronDown className="w-3.5 h-3.5 mr-1" />}
            {showMore ? 'Menos opções' : `Mais ${hiddenFields.length} opções`}
          </Button>
        </>
      )}
    </div>
  );
}

function ChecklistItem({ field, value, details, onValueChange, onDetailsChange }: any) {
  const Icon = field.icon;
  
  const shouldShowDetails = () => {
    if (!field.hasDetails) return false;
    if (field.showDetailsWhen === 'always') return value !== undefined && value !== null;
    if (field.showDetailsWhen === 'positive') return value === true;
    if (field.showDetailsWhen === 'negative') return value === false;
    if (field.type === 'select') return value && value !== '';
    return false;
  };

  return (
    <div className="bg-gray-50/50 border border-gray-100 rounded-xl p-2.5 transition-colors hover:bg-gray-50">
      <div className="flex items-center gap-2 mb-2">
        <div className="bg-white p-1 rounded-md shadow-sm border border-gray-100">
          <Icon className="w-3.5 h-3.5 text-primary-600 flex-shrink-0" />
        </div>
        <span className="text-xs font-semibold text-gray-700 truncate">{field.label}</span>
      </div>

      {field.type === 'boolean' ? (
        <div className="flex gap-1.5">
          <Button
            type="button"
            size="sm"
            variant={value === true ? "default" : "outline"}
            onClick={() => onValueChange(true)}
            className={`flex-1 h-7 text-[10px] px-1 font-bold ${
              value === true ? 'bg-green-600 hover:bg-green-700' : 'bg-white border-gray-200'
            }`}
          >
            {field.positiveText}
          </Button>
          <Button
            type="button"
            size="sm"
            variant={value === false ? "default" : "outline"}
            onClick={() => onValueChange(false)}
            className={`flex-1 h-7 text-[10px] px-1 font-bold ${
              value === false ? 'bg-orange-600 hover:bg-orange-700' : 'bg-white border-gray-200'
            }`}
          >
            {field.negativeText}
          </Button>
        </div>
      ) : (
        <Select
          value={value || ''}
          onValueChange={(val) => onValueChange(val)}
        >
          <SelectTrigger className="h-7 text-[10px] bg-white border-gray-200">
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent>
            {field.options?.map((opt: any) => (
              <SelectItem key={opt.value} value={opt.value} className="text-[10px]">
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {shouldShowDetails() && (
        <Input
          type="text"
          placeholder={field.detailsPlaceholder}
          value={details}
          onChange={(e) => onDetailsChange(e.target.value)}
          className="mt-2 h-7 text-[10px] bg-white border-gray-200"
        />
      )}
    </div>
  );
}
