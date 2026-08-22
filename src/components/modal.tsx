import { useEffect, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label } from './ui/primitives';
import { useTranslation } from 'react-i18next';

export type ModalField = {
  name: string;
  label: string;
  type?: 'text' | 'email' | 'date' | 'datetime-local' | 'tel' | 'select' | 'textarea';
  placeholder?: string;
  required?: boolean;
  options?: { label: string; value: string }[];
};

export function Modal({ title, description, fields, initialValues, submitLabel = 'Save', open, onOpenChange, onSubmit }: {
  title: string;
  description?: string;
  fields: ModalField[];
  initialValues?: Record<string, string>;
  submitLabel?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: Record<string, string>) => Promise<void> | void;
}) {
  const { t } = useTranslation();
  const [values, setValues] = useState<Record<string, string>>(initialValues ?? {});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setValues(initialValues ?? {});
  }, [open, initialValues]);

  if (!open) return null;

  const updateValue = (name: string, value: string) => setValues((current) => ({ ...current, [name]: value }));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await onSubmit(values);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 p-4" onMouseDown={() => onOpenChange(false)}>
      <Card className="w-full max-w-lg" onMouseDown={(event) => event.stopPropagation()}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={submit}>
            {fields.map((field) => (
              <div className="space-y-1.5" key={field.name}>
                <Label htmlFor={field.name}>{field.label}</Label>
                {field.type === 'select' ? (
                  <select id={field.name} required={field.required} value={values[field.name] ?? ''} onChange={(event) => updateValue(field.name, event.target.value)} className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <option value="">{t('common.create')} {field.label.toLowerCase()}</option>
                    {field.options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                ) : field.type === 'textarea' ? (
                  <textarea id={field.name} required={field.required} placeholder={field.placeholder} value={values[field.name] ?? ''} onChange={(event) => updateValue(field.name, event.target.value)} className="min-h-24 w-full resize-y rounded-md border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring" />
                ) : (
                  <Input id={field.name} type={field.type ?? 'text'} required={field.required} placeholder={field.placeholder} value={values[field.name] ?? ''} onChange={(event) => updateValue(field.name, event.target.value)} />
                )}
              </div>
            ))}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t('common.cancel')}</Button>
              <Button type="submit" disabled={saving}>{saving ? t('common.saving') : submitLabel}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <div className="flex min-h-56 flex-col items-center justify-center rounded-lg border border-dashed bg-white p-8 text-center"><p className="font-medium">{title}</p><p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>{action && <div className="mt-4">{action}</div>}</div>;
}
