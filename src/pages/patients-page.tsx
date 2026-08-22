import { useEffect, useState } from 'react';
import { Plus, Search, UserRound, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { apiRequest, useAuth } from '@/lib/auth-context';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Input } from '@/components/ui/primitives';
import { EmptyState, Modal, type ModalField } from '@/components/modal';
import { formatDate } from '@/lib/utils';

type Patient = { id: string; full_name: string; date_of_birth: string | null; dob?: string | null; gender: string | null; phone: string | null; email: string | null; address: string | null; medical_notes: string | null };

const fields: ModalField[] = [{ name: 'full_name', label: 'Full name', required: true }, { name: 'phone', label: 'Phone', type: 'tel' }, { name: 'email', label: 'Email', type: 'email' }, { name: 'date_of_birth', label: 'Date of birth', type: 'date' }, { name: 'gender', label: 'Gender', type: 'select', options: [{ label: 'Female', value: 'female' }, { label: 'Male', value: 'male' }, { label: 'Other', value: 'other' }] }, { name: 'address', label: 'Address' }];

export function PatientsPage() {
  const { user } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const search = useDebouncedValue(query);
  const canEdit = user?.role === 'admin' || user?.role === 'staff';

  const loadPatients = () => { apiRequest<{ patients: Patient[] }>(`/api/patients?pageSize=100&query=${encodeURIComponent(search)}`).then((result) => setPatients(result.patients)); };
  useEffect(() => { loadPatients(); }, [search]);

  const createPatient = async (values: Record<string, string>) => { setError(''); try { await apiRequest('/api/patients', { method: 'POST', body: JSON.stringify(values) }); loadPatients(); } catch (err) { setError(err instanceof Error ? err.message : 'Unable to create patient'); } };

  return <div className="space-y-6"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-medium text-primary">Directory</p><h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">Patients</h1><p className="mt-2 text-sm text-muted-foreground">Find and manage patient contact details and notes.</p></div>{canEdit && <Button onClick={() => setOpen(true)}><Plus size={16} />Add patient</Button>}</div>{error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}<Card><CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between"><div><CardTitle>Patient directory</CardTitle><CardDescription>{patients.length} patients shown</CardDescription></div><div className="relative w-full sm:w-72"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} /><Input className="pl-9" placeholder="Search name or phone" value={query} onChange={(event) => setQuery(event.target.value)} /></div></CardHeader><CardContent>{patients.length === 0 ? <EmptyState title="No patients found" description={query ? 'Try a different name or phone number.' : 'Add your first patient to start building the directory.'} action={canEdit && !query ? <Button onClick={() => setOpen(true)}><Plus size={16} />Add patient</Button> : undefined} /> : <div className="overflow-x-auto"><table className="w-full min-w-[640px] text-left text-sm"><thead className="border-b text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="pb-3 font-medium">Patient</th><th className="pb-3 font-medium">Date of birth</th><th className="pb-3 font-medium">Phone</th><th className="pb-3 font-medium">Email</th><th className="pb-3" /></tr></thead><tbody className="divide-y">{patients.map((patient) => <tr className="group" key={patient.id}><td className="py-4"><Link to={`/patients/${patient.id}`} className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary"><UserRound size={16} /></div><span className="font-medium text-slate-900 group-hover:text-primary">{patient.full_name}</span></Link></td><td className="py-4 text-muted-foreground">{formatDate(patient.dob)}</td><td className="py-4 text-muted-foreground">{patient.phone ?? 'Not provided'}</td><td className="py-4 text-muted-foreground">{patient.email ?? 'Not provided'}</td><td className="py-4 text-right"><Link to={`/patients/${patient.id}`} className="inline-flex items-center gap-1 text-xs font-medium text-primary">View <ArrowRight size={14} /></Link></td></tr>)}</tbody></table></div>}</CardContent></Card><Modal open={open} onOpenChange={setOpen} title="Add patient" description="Create a patient record for the clinic directory." fields={fields} onSubmit={createPatient} submitLabel="Create patient" /></div>;
}
