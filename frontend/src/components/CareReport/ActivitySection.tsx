import { useState } from 'react';
import { Plus, Check, X } from 'lucide-react';
import { UseFormRegister } from 'react-hook-form';
import { CareReportFormData } from '@/validations/schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface ActivitySectionProps {
  register: UseFormRegister<CareReportFormData>;
  activities: string[];
  onAddActivity: (activity: string) => void;
  onRemoveActivity: (index: number) => void;
}

export function ActivitySection({ register, activities, onAddActivity, onRemoveActivity }: ActivitySectionProps) {
  const [activityInput, setActivityInput] = useState('');

  const handleAdd = () => {
    if (activityInput.trim()) {
      onAddActivity(activityInput);
      setActivityInput('');
    }
  };

  return (
    <Accordion className="mb-4">
      <AccordionItem value="observations" className="border-none">
        <AccordionTrigger className="py-0 hover:no-underline text-xs text-gray-500 font-medium">
          Observações e atividades
        </AccordionTrigger>
        <AccordionContent className="pt-3 space-y-4">
          <Textarea
            {...register('healthObservations')}
            placeholder="Observações de saúde importantes..."
            className="h-20 bg-gray-50/50 border-gray-200"
          />

          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                type="text"
                value={activityInput}
                onChange={(e) => setActivityInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAdd())}
                placeholder="Ex: Passeio no jardim..."
                className="flex-1 bg-white border-gray-200"
              />
              <Button
                type="button"
                size="icon"
                onClick={handleAdd}
                disabled={!activityInput.trim()}
                className="shrink-0"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            
            {activities.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {activities.map((activity, idx) => (
                  <Badge
                    key={idx}
                    variant="secondary"
                    className="gap-1 px-2 py-1 bg-green-50 text-green-700 hover:bg-green-100 border-green-200 font-medium"
                  >
                    <Check className="w-3 h-3" />
                    {activity}
                    <button 
                      type="button" 
                      onClick={() => onRemoveActivity(idx)}
                      className="ml-1 hover:text-red-500 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
