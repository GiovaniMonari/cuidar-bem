import { Heart, Smile, Meh, Frown } from 'lucide-react';
import { UseFormRegister, UseFormSetValue } from 'react-hook-form';
import { CareReportFormData } from '@/validations/schemas';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';

interface MoodSectionProps {
  register: UseFormRegister<CareReportFormData>;
  setValue: UseFormSetValue<CareReportFormData>;
  painLevel: number;
  patientMood: number | null | undefined;
}

export function MoodSection({ setValue, painLevel, patientMood }: MoodSectionProps) {
  return (
    <div className="grid grid-cols-2 gap-3 mb-4">
      {/* Nível de Dor */}
      <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-gray-600 flex items-center gap-1">
            <Heart className="w-3.5 h-3.5 text-red-500" />
            Dor
          </span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            painLevel === 0 ? 'bg-green-100 text-green-700' :
            painLevel <= 3 ? 'bg-yellow-100 text-yellow-700' :
            painLevel <= 6 ? 'bg-orange-100 text-orange-700' :
            'bg-red-100 text-red-700'
          }`}>
            {painLevel}/10
          </span>
        </div>
        <Slider
          value={[painLevel]}
          min={0}
          max={10}
          step={1}
          onValueChange={(val) => {
            const value = Array.isArray(val) ? val[0] : val;
            setValue('painLevel', value, { shouldValidate: true });
          }}
          className="py-1"
        />
      </div>

      {/* Humor */}
      <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
        <span className="text-[10px] font-semibold text-gray-600 block mb-2 uppercase tracking-wider">Humor</span>
        <div className="flex justify-between gap-1">
          {[1, 2, 3, 4, 5].map((value) => (
            <Button
              key={value}
              variant={patientMood === value ? "default" : "outline"}
              size="icon"
              type="button"
              onClick={() => setValue('patientMood', value, { shouldValidate: true })}
              className={`h-8 w-full transition-all ${
                patientMood === value ? 'bg-primary-600' : 'bg-white hover:bg-gray-50'
              }`}
            >
              {value <= 2 ? <Frown className="w-4 h-4" /> :
               value === 3 ? <Meh className="w-4 h-4" /> :
               <Smile className="w-4 h-4" />}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
