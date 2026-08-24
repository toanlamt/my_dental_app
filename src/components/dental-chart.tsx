import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { apiRequest } from '@/lib/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/primitives';
import { Modal, type ModalField } from '@/components/modal';

type ToothStatus = 'healthy' | 'caries' | 'filled' | 'missing' | 'crown' | 'root_canal' | 'implant' | 'extraction_required';

type DentalChartEntry = {
  id: string;
  patient_id: string;
  tooth_number: number;
  status: ToothStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  updated_by: string | null;
};

interface DentalChartProps {
  patientId: string;
}

const toothStatusColors: Record<ToothStatus, string> = {
  healthy: 'bg-green-100 hover:bg-green-200 border-green-300 text-green-900',
  caries: 'bg-red-100 hover:bg-red-200 border-red-300 text-red-900',
  filled: 'bg-blue-100 hover:bg-blue-200 border-blue-300 text-blue-900',
  missing: 'bg-gray-100 hover:bg-gray-200 border-gray-300 text-gray-900',
  crown: 'bg-yellow-100 hover:bg-yellow-200 border-yellow-300 text-yellow-900',
  root_canal: 'bg-purple-100 hover:bg-purple-200 border-purple-300 text-purple-900',
  implant: 'bg-indigo-100 hover:bg-indigo-200 border-indigo-300 text-indigo-900',
  extraction_required: 'bg-orange-100 hover:bg-orange-200 border-orange-300 text-orange-900',
};

const teethLayout = {
  upper: {
    right: [18, 17, 16, 15, 14, 13, 12, 11],
    left: [21, 22, 23, 24, 25, 26, 27, 28],
  },
  lower: {
    left: [31, 32, 33, 34, 35, 36, 37, 38],
    right: [48, 47, 46, 45, 44, 43, 42, 41],
  },
};

export function DentalChart({ patientId }: DentalChartProps) {
  const { t } = useTranslation();
  const [teeth, setTeeth] = useState<DentalChartEntry[]>([]);
  const [selectedTooth, setSelectedTooth] = useState<DentalChartEntry | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadChart = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await apiRequest<{ teeth: DentalChartEntry[] }>(`/api/patients/${patientId}/dental-chart`);
      setTeeth(result.teeth);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('dentalChart.unableToLoad'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  const getToothStatus = (toothNumber: number): ToothStatus => {
    const tooth = teeth.find((t) => t.tooth_number === toothNumber);
    return tooth?.status ?? 'healthy';
  };

  const editFields = (t: (key: string, options?: Record<string, unknown>) => string): ModalField[] => [
    {
      name: 'status',
      label: t('dentalChart.status'),
      type: 'select',
      required: true,
      options: [
        { label: t('dentalChart.statusOptions.healthy'), value: 'healthy' },
        { label: t('dentalChart.statusOptions.caries'), value: 'caries' },
        { label: t('dentalChart.statusOptions.filled'), value: 'filled' },
        { label: t('dentalChart.statusOptions.missing'), value: 'missing' },
        { label: t('dentalChart.statusOptions.crown'), value: 'crown' },
        { label: t('dentalChart.statusOptions.rootCanal'), value: 'root_canal' },
        { label: t('dentalChart.statusOptions.implant'), value: 'implant' },
        { label: t('dentalChart.statusOptions.extractionRequired'), value: 'extraction_required' },
      ],
    },
    {
      name: 'notes',
      label: t('dentalChart.notes'),
      type: 'textarea',
      placeholder: t('dentalChart.notesPlaceholder'),
    },
  ];

  const handleSave = async (values: Record<string, string>) => {
    if (!selectedTooth) return;
    setError('');
    try {
      const payload = { tooth_number: selectedTooth.tooth_number, status: values.status, notes: values.notes || null };
      await apiRequest(`/api/patients/${patientId}/dental-chart/${selectedTooth.tooth_number}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      setEditOpen(false);
      setSelectedTooth(null);
      loadChart();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('dentalChart.unableToSave'));
    }
  };

  const handleToothClick = (toothNumber: number) => {
    const tooth = teeth.find((t) => t.tooth_number === toothNumber) || {
      id: '',
      patient_id: patientId,
      tooth_number: toothNumber,
      status: 'healthy' as const,
      notes: null,
      created_at: '',
      updated_at: '',
      updated_by: null,
    };
    setSelectedTooth(tooth);
    setEditOpen(true);
  };

  if (loading) {
    return <p className="py-12 text-center text-sm text-muted-foreground">{t('dentalChart.loading')}</p>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('dentalChart.title')}</CardTitle>
        <CardDescription>{t('dentalChart.description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}

        {/* Legend */}
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <p className="mb-3 text-sm font-semibold text-gray-900">{t('dentalChart.legend')}</p>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            {(
              [
                { status: 'healthy', label: t('dentalChart.statusOptions.healthy') },
                { status: 'caries', label: t('dentalChart.statusOptions.caries') },
                { status: 'filled', label: t('dentalChart.statusOptions.filled') },
                { status: 'missing', label: t('dentalChart.statusOptions.missing') },
                { status: 'crown', label: t('dentalChart.statusOptions.crown') },
                { status: 'root_canal', label: t('dentalChart.statusOptions.rootCanal') },
                { status: 'implant', label: t('dentalChart.statusOptions.implant') },
                { status: 'extraction_required', label: t('dentalChart.statusOptions.extractionRequired') },
              ] as const
            ).map(({ status, label }) => (
              <div key={status} className="flex items-center gap-2">
                <div className={`h-3 w-3 rounded-full border-2 ${toothStatusColors[status].split(' ')[0]}`} />
                <span className="text-xs text-gray-700">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Dental Chart */}
        <div className="space-y-6">
          {/* Upper Jaw */}
          <div>
            <p className="mb-3 text-sm font-semibold text-gray-700">{t('dentalChart.upperJaw')}</p>
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2">
                <span className="text-xs text-gray-500">{t('dentalChart.right')}</span>
                <div className="flex gap-1">
                  {teethLayout.upper.right.map((tooth) => (
                    <button
                      key={tooth}
                      onClick={() => handleToothClick(tooth)}
                      className={`flex h-14 w-14 items-center justify-center rounded-lg border-2 text-sm font-semibold transition ${toothStatusColors[getToothStatus(tooth)]}`}
                      title={`${t('dentalChart.tooth')} ${tooth}: ${t(`dentalChart.statusOptions.${getToothStatus(tooth).replace('_', 'C').replace('root_Canal', 'rootCanal').replace('extraction_Required', 'extractionRequired')}`)}`}
                      aria-label={`${t('dentalChart.tooth')} ${tooth}, ${t(`dentalChart.statusOptions.${getToothStatus(tooth).replace('_', 'C').replace('root_Canal', 'rootCanal').replace('extraction_Required', 'extractionRequired')}`)}`}
                    >
                      {tooth}
                    </button>
                  ))}
                </div>
                <span className="text-xs text-gray-500">{t('dentalChart.left')}</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <span className="text-xs text-gray-500">{t('dentalChart.right')}</span>
                <div className="flex gap-1">
                  {teethLayout.upper.left.map((tooth) => (
                    <button
                      key={tooth}
                      onClick={() => handleToothClick(tooth)}
                      className={`flex h-14 w-14 items-center justify-center rounded-lg border-2 text-sm font-semibold transition ${toothStatusColors[getToothStatus(tooth)]}`}
                      title={`${t('dentalChart.tooth')} ${tooth}: ${t(`dentalChart.statusOptions.${getToothStatus(tooth).replace('_', 'C').replace('root_Canal', 'rootCanal').replace('extraction_Required', 'extractionRequired')}`)}`}
                      aria-label={`${t('dentalChart.tooth')} ${tooth}, ${t(`dentalChart.statusOptions.${getToothStatus(tooth).replace('_', 'C').replace('root_Canal', 'rootCanal').replace('extraction_Required', 'extractionRequired')}`)}`}
                    >
                      {tooth}
                    </button>
                  ))}
                </div>
                <span className="text-xs text-gray-500">{t('dentalChart.left')}</span>
              </div>
            </div>
          </div>

          {/* Lower Jaw */}
          <div>
            <p className="mb-3 text-sm font-semibold text-gray-700">{t('dentalChart.lowerJaw')}</p>
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2">
                <span className="text-xs text-gray-500">{t('dentalChart.left')}</span>
                <div className="flex gap-1">
                  {teethLayout.lower.left.map((tooth) => (
                    <button
                      key={tooth}
                      onClick={() => handleToothClick(tooth)}
                      className={`flex h-14 w-14 items-center justify-center rounded-lg border-2 text-sm font-semibold transition ${toothStatusColors[getToothStatus(tooth)]}`}
                      title={`${t('dentalChart.tooth')} ${tooth}: ${t(`dentalChart.statusOptions.${getToothStatus(tooth).replace('_', 'C').replace('root_Canal', 'rootCanal').replace('extraction_Required', 'extractionRequired')}`)}`}
                      aria-label={`${t('dentalChart.tooth')} ${tooth}, ${t(`dentalChart.statusOptions.${getToothStatus(tooth).replace('_', 'C').replace('root_Canal', 'rootCanal').replace('extraction_Required', 'extractionRequired')}`)}`}
                    >
                      {tooth}
                    </button>
                  ))}
                </div>
                <span className="text-xs text-gray-500">{t('dentalChart.right')}</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <span className="text-xs text-gray-500">{t('dentalChart.left')}</span>
                <div className="flex gap-1">
                  {teethLayout.lower.right.map((tooth) => (
                    <button
                      key={tooth}
                      onClick={() => handleToothClick(tooth)}
                      className={`flex h-14 w-14 items-center justify-center rounded-lg border-2 text-sm font-semibold transition ${toothStatusColors[getToothStatus(tooth)]}`}
                      title={`${t('dentalChart.tooth')} ${tooth}: ${t(`dentalChart.statusOptions.${getToothStatus(tooth).replace('_', 'C').replace('root_Canal', 'rootCanal').replace('extraction_Required', 'extractionRequired')}`)}`}
                      aria-label={`${t('dentalChart.tooth')} ${tooth}, ${t(`dentalChart.statusOptions.${getToothStatus(tooth).replace('_', 'C').replace('root_Canal', 'rootCanal').replace('extraction_Required', 'extractionRequired')}`)}`}
                    >
                      {tooth}
                    </button>
                  ))}
                </div>
                <span className="text-xs text-gray-500">{t('dentalChart.right')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Modal */}
        {selectedTooth && (
          <Modal
            open={editOpen}
            title={`${t('dentalChart.tooth')} ${selectedTooth.tooth_number}`}
            fields={editFields(t)}
            onOpenChange={(open) => {
              setEditOpen(open);
              if (!open) setSelectedTooth(null);
            }}
            onSubmit={handleSave}
            submitLabel={t('common.save')}
            initialValues={{
              status: selectedTooth.status,
              notes: selectedTooth.notes ?? '',
            }}
          />
        )}
      </CardContent>
    </Card>
  );
}
