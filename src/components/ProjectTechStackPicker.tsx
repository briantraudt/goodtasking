import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const STACK_OPTIONS = [
  'React',
  'Next.js',
  'TypeScript',
  'JavaScript',
  'Node.js',
  'Express',
  'Supabase',
  'Postgres',
  'Tailwind',
  'Vercel',
  'Render',
  'DreamHost',
  'Stripe',
  'Twilio',
  'Resend',
  'Sentry',
  'PostHog',
  'OpenAI',
  'Python',
  'FastAPI',
  'Docker',
  'GitHub Actions',
];

interface ProjectTechStackPickerProps {
  value: string[];
  onChange: (value: string[]) => void;
}

const normalizeValue = (value: string) => value.trim();

export default function ProjectTechStackPicker({
  value,
  onChange,
}: ProjectTechStackPickerProps) {
  const [customEntry, setCustomEntry] = useState('');

  const sortedValue = useMemo(
    () => [...value].sort((a, b) => a.localeCompare(b)),
    [value]
  );

  const toggleItem = (item: string) => {
    const normalizedItem = normalizeValue(item);
    if (!normalizedItem) return;

    if (value.includes(normalizedItem)) {
      onChange(value.filter((stackItem) => stackItem !== normalizedItem));
      return;
    }

    onChange([...value, normalizedItem]);
  };

  const addCustomEntry = () => {
    const normalizedEntry = normalizeValue(customEntry);
    if (!normalizedEntry || value.includes(normalizedEntry)) return;

    onChange([...value, normalizedEntry]);
    setCustomEntry('');
  };

  return (
    <div className="space-y-3">
      <Label>Tech Stack</Label>
      <div className="flex flex-wrap gap-2">
        {STACK_OPTIONS.map((option) => {
          const isSelected = value.includes(option);

          return (
            <Button
              key={option}
              type="button"
              variant={isSelected ? 'default' : 'outline'}
              size="sm"
              onClick={() => toggleItem(option)}
              className="h-8 rounded-full"
            >
              {option}
            </Button>
          );
        })}
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Add another tech or tool"
          value={customEntry}
          onChange={(event) => setCustomEntry(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              addCustomEntry();
            }
          }}
        />
        <Button type="button" variant="outline" onClick={addCustomEntry}>
          Add
        </Button>
      </div>

      {sortedValue.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {sortedValue.map((item) => (
            <Badge
              key={item}
              variant="secondary"
              className="cursor-pointer rounded-full px-3 py-1"
              onClick={() => toggleItem(item)}
            >
              {item} ×
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
