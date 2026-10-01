import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/cards/Card';
import { SearchInput } from '../../components/common/SearchInput';
import { DataTable } from '../../components/tables/DataTable';
import { StatusBadge } from '../../components/common/Badge';
import { Modal } from '../../components/modals/Modal';
import { Input, Select, DatePicker } from '../../components/forms/Fields';
import { EmptyState } from '../../components/common/States';
import { projectService, customerService } from '../../services/mock';
import { PROJECT_STATUSES, FLOOR_OPTIONS } from '../../constants';
import { toast, useUiStore } from '../../store/uiStore';
import { useForm } from 'react-hook-form';
import { formatDate } from '../../utils/formatting';
import { ActionMenu } from '../../components/common/ActionMenu';
import { Eye, Pencil, Plus, Trash2 } from 'lucide-react';

export default function ProjectsPage() {
  const [rows, setRows] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const navigate = useNavigate();
  const openConfirm = useUiStore((s) => s.openConfirm);

  const load = async () => {
    setRows(await projectService.getAll());
    setCustomers(await customerService.getAll());
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(
    () => rows.filter((r) => `${r.name} ${r.siteAddress}`.toLowerCase().includes(q.toLowerCase())),
    [rows, q]
  );

  const nameOf = (id) => customers.find((c) => c.id === id)?.name || '—';

  return (
    <div>
      <PageHeader eyebrow="Operations" title="Projects" description="Sites, customers and estimated construction value." actions={<Button onClick={() => { setEditing(null); setOpen(true); }}><Plus className="h-4 w-4" /> Add project</Button>} />
      <Card>
        <SearchInput compact className="mb-4 max-w-md" value={q} onChange={setQ} placeholder="Search projects..." />
        <DataTable
          rows={filtered}
          empty={<EmptyState title="No projects found" actionLabel="Add project" onAction={() => setOpen(true)} />}
          columns={[
            { key: 'name', header: 'Project Name', sortable: true },
            { key: 'customer', header: 'Customer', render: (r) => nameOf(r.customerId) },
            { key: 'siteAddress', header: 'Site Address' },
            { key: 'plotArea', header: 'Plot Area' },
            { key: 'constructionArea', header: 'Construction Area' },
            { key: 'floors', header: 'Floors' },
            { key: 'startDate', header: 'Start Date', render: (r) => formatDate(r.startDate) },
            { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
            {
              key: 'actions',
              header: '',
              render: (r) => (
                <ActionMenu
                  items={[
                    { label: 'View', icon: Eye, onClick: () => navigate(`/projects/${r.id}`) },
                    { label: 'Edit', icon: Pencil, onClick: () => { setEditing(r); setOpen(true); } },
                    {
                      label: 'Delete',
                      icon: Trash2,
                      danger: true,
                      onClick: () => openConfirm({
                        title: 'Delete project',
                        message: 'Are you sure you want to delete this project?',
                        confirmLabel: 'Delete',
                        danger: true,
                        onConfirm: async () => { await projectService.delete(r.id); toast('Project deleted'); load(); },
                      }),
                    },
                  ]}
                />
              ),
            },
          ]}
        />
      </Card>
      <ProjectForm open={open} onClose={() => setOpen(false)} editing={editing} customers={customers} onSaved={load} />
    </div>
  );
}

function ProjectForm({ open, onClose, editing, customers, onSaved }) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  useEffect(() => {
    reset(editing || { name: '', customerId: customers[0]?.id, siteAddress: '', plotArea: '', constructionArea: '', floors: 'G+1', startDate: '', status: 'Planning' });
  }, [editing, reset, open, customers]);

  return (
    <Modal open={open} title={editing ? 'Edit project' : 'Add project'} description="Project records used on construction estimates" onClose={onClose} className="max-w-xl"
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={handleSubmit(async (values) => {
        if (editing) await projectService.update(editing.id, values);
        else await projectService.create(values);
        toast(editing ? 'Project updated' : 'Project created');
        onSaved();
        onClose();
      })}>Save</Button></>}>
      <div className="grid gap-3 md:grid-cols-2">
        <Input label="Project Name" required className="md:col-span-2" error={errors.name?.message} {...register('name', { required: 'Required' })} />
        <Select label="Customer" {...register('customerId')}>{customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select>
        <Input label="Site Address" required className="md:col-span-2" {...register('siteAddress', { required: 'Required' })} />
        <Input label="Plot Area" type="number" {...register('plotArea')} />
        <Input label="Construction Area" type="number" {...register('constructionArea')} />
        <Select label="Floors" {...register('floors')}>{FLOOR_OPTIONS.map((f) => <option key={f}>{f}</option>)}</Select>
        <DatePicker label="Start Date" {...register('startDate')} />
        <Select label="Status" {...register('status')}>{PROJECT_STATUSES.map((s) => <option key={s}>{s}</option>)}</Select>
      </div>
    </Modal>
  );
}
