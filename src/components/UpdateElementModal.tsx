import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import Modal from '@/components/Modal';
import { FormField, FormInput, FormSelect } from '@/components/FormElements';
import { useAppState } from '@/context/AppContext';
import { useAdminApi } from '@/services/api';
import type { RadarElement } from '@/context/AppContext';

interface Props {
  open: boolean;
  onClose: () => void;
  element: RadarElement;
  teamId: string;
  onSuccess: () => void;
}

export default function UpdateElementModal({ open, onClose, element, teamId, onSuccess }: Props) {
  const { organization } = useAppState();
  const [form, setForm] = useState({
    title: '', type: 'THREAT', category: 'BUSINESS', distance: 'DETECTED',
    impact: 'LOW', risk: 'LOW', assess: '', detect: '', respond: '',
  });

  useEffect(() => {
    setForm({
      title: element.title, type: element.type, category: element.category,
      distance: element.distance, impact: element.impact, risk: element.risk,
      assess: element.assess || '', detect: element.detect || '', respond: element.respond || '',
    });
  }, [element]);

  const update = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  const submit = async () => {
    const payload = {
      environmentalChangeId: element.environmentalChangeId,
      teamId,
      organizationId: organization.orgId,
      ...form,
    };
    try {
      await useAdminApi.updateEnvironmentalChange(element.environmentalChangeId, payload, organization.sid!, organization.userId!);
      onClose();
      toast.success('Element updated');
      setTimeout(onSuccess, 1000);
    } catch (e: any) { toast.error(`Error: ${e.message}`); }
  };

  return (
    <Modal open={open} onClose={onClose} title="Update Element" subtitle="Edit radar element details">
      <FormField label="Title"><FormInput value={form.title} onChange={update('title')} /></FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Type"><FormSelect value={form.type} onChange={update('type')}><option value="THREAT">Threat</option><option value="OPPORTUNITY">Opportunity</option></FormSelect></FormField>
        <FormField label="Category"><FormSelect value={form.category} onChange={update('category')}><option value="BUSINESS">Business</option><option value="OPERATING_MODEL">Operating Model</option><option value="CAPABILITIES">Capabilities</option><option value="PEOPLE_KNOWLEDGE">People & Knowledge</option></FormSelect></FormField>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <FormField label="Distance"><FormSelect value={form.distance} onChange={update('distance')}><option value="DETECTED">Detected</option><option value="ASSESSING">Assessing</option><option value="ASSESSED">Assessed</option><option value="RESPONDING">Responding</option></FormSelect></FormField>
        <FormField label="Impact"><FormSelect value={form.impact} onChange={update('impact')}><option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option></FormSelect></FormField>
        <FormField label="Risk"><FormSelect value={form.risk} onChange={update('risk')}><option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option></FormSelect></FormField>
      </div>
      <FormField label="Assess"><FormInput value={form.assess} onChange={update('assess')} /></FormField>
      <FormField label="Detect"><FormInput value={form.detect} onChange={update('detect')} /></FormField>
      <FormField label="Respond"><FormInput value={form.respond} onChange={update('respond')} /></FormField>
      <div className="flex gap-2.5 mt-5">
        <button onClick={onClose} className="flex-1 border border-border bg-background text-muted-foreground rounded-lg py-2.5 font-semibold text-sm hover:text-foreground transition-all">Cancel</button>
        <button onClick={submit} className="flex-1 bg-primary text-primary-foreground rounded-lg py-2.5 font-semibold text-sm hover:opacity-90 transition-all">Save Changes</button>
      </div>
    </Modal>
  );
}
