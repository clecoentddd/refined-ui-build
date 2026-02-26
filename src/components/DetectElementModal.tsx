import { useState } from 'react';
import { toast } from 'sonner';
import Modal from '@/components/Modal';
import { FormField, FormInput, FormSelect } from '@/components/FormElements';
import { useAppState } from '@/context/AppContext';
import { useAdminApi } from '@/services/api';

interface Props {
  open: boolean;
  onClose: () => void;
  teamId: string;
  teamName: string;
  onSuccess: () => void;
}

export default function DetectElementModal({ open, onClose, teamId, teamName, onSuccess }: Props) {
  const { company, radarIds } = useAppState();
  const [form, setForm] = useState({
    title: '', type: 'THREAT', category: 'BUSINESS', distance: 'DETECTED',
    impact: 'LOW', risk: 'LOW', assess: '', detect: '', respond: '',
  });

  const update = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  const submit = async () => {
    if (!form.title.trim()) return toast.error('Title required');
    const radarId = radarIds[teamId];
    if (!radarId) return toast.error('Radar not initialized for this team');
    const payload = {
      radarId, radarElementId: crypto.randomUUID(), teamId,
      organizationId: company.orgId, ...form,
    };
    try {
      await useAdminApi.detectRadarElement(payload, company.sid!);
      onClose();
      toast.success(`"${form.title}" detected`);
      setForm({ title: '', type: 'THREAT', category: 'BUSINESS', distance: 'DETECTED', impact: 'LOW', risk: 'LOW', assess: '', detect: '', respond: '' });
      setTimeout(onSuccess, 1500);
    } catch (e: any) { toast.error(`Error: ${e.message}`); }
  };

  return (
    <Modal open={open} onClose={onClose} title="Detect Element" subtitle={`// team: ${teamName}`}>
      <FormField label="Title"><FormInput value={form.title} onChange={update('title')} placeholder="AI Regulation Risk" /></FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Type"><FormSelect value={form.type} onChange={update('type')}><option value="THREAT">Threat</option><option value="OPPORTUNITY">Opportunity</option></FormSelect></FormField>
        <FormField label="Category"><FormSelect value={form.category} onChange={update('category')}><option value="BUSINESS">Business</option><option value="OPERATING_MODEL">Operating Model</option><option value="CAPABILITIES">Capabilities</option><option value="PEOPLE_KNOWLEDGE">People & Knowledge</option></FormSelect></FormField>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <FormField label="Distance"><FormSelect value={form.distance} onChange={update('distance')}><option value="DETECTED">Detected</option><option value="ASSESSING">Assessing</option><option value="ASSESSED">Assessed</option><option value="RESPONDING">Responding</option></FormSelect></FormField>
        <FormField label="Impact"><FormSelect value={form.impact} onChange={update('impact')}><option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option></FormSelect></FormField>
        <FormField label="Risk"><FormSelect value={form.risk} onChange={update('risk')}><option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option></FormSelect></FormField>
      </div>
      <FormField label="Assess"><FormInput value={form.assess} onChange={update('assess')} placeholder="Assessment notes" /></FormField>
      <FormField label="Detect"><FormInput value={form.detect} onChange={update('detect')} placeholder="How was this detected?" /></FormField>
      <FormField label="Respond"><FormInput value={form.respond} onChange={update('respond')} placeholder="Response plan" /></FormField>
      <div className="flex gap-2.5 mt-5">
        <button onClick={onClose} className="flex-1 border border-border-strong bg-card text-muted-foreground rounded-lg py-2.5 font-bold text-sm hover:text-foreground transition-all">Cancel</button>
        <button onClick={submit} className="flex-1 bg-success text-success-foreground rounded-lg py-2.5 font-bold text-sm hover:opacity-90 transition-all shadow-md">Detect Element</button>
      </div>
    </Modal>
  );
}
