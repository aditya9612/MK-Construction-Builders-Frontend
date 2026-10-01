import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/cards/Card';
import { SearchInput } from '../../components/common/SearchInput';
import { DataTable } from '../../components/tables/DataTable';
import { StatusBadge } from '../../components/common/Badge';
import { Modal } from '../../components/modals/Modal';
import { Input, Select } from '../../components/forms/Fields';
import { EmptyState } from '../../components/common/States';
import { customerService, projectService, quotationService } from '../../services/mock';
import { CUSTOMER_TYPES } from '../../constants';
import { formatCurrency } from '../../utils/formatting';
import { isValidEmail, isValidMobile } from '../../utils/validation';
import { toast, useUiStore } from '../../store/uiStore';
import { useForm } from 'react-hook-form';
import { ActionMenu } from '../../components/common/ActionMenu';
import { Eye, Pencil, Plus, Trash2 } from 'lucide-react';

export default function CustomersPage() {
  const [rows, setRows] = useState([]);
  const [projects, setProjects] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const navigate = useNavigate();
  const openConfirm = useUiStore((s) => s.openConfirm);

  const load = async () => {
    setRows(await customerService.getAll());
    setProjects(await projectService.getAll());
    setQuotations(await quotationService.getAll());
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(
    () => rows.filter((r) => `${r.name} ${r.mobile} ${r.email}`.toLowerCase().includes(q.toLowerCase())),
    [rows, q]
  );

  return (
    <div>
      <PageHeader eyebrow="Operations" title="Customers" description="People and organisations you quote for." actions={<Button onClick={() => { setEditing(null); setOpen(true); }}><Plus className="h-4 w-4" /> Add customer</Button>} />
      <Card>
        <SearchInput compact className="mb-4 max-w-md" value={q} onChange={setQ} placeholder="Search customers..." />
        <DataTable
          rows={filtered.map((r) => ({
            ...r,
            projectCount: projects.filter((p) => p.customerId === r.id).length,
            quotationCount: quotations.filter((x) => x.customer?.id === r.id).length,
          }))}
          empty={<EmptyState title="No customers yet" actionLabel="Add customer" onAction={() => setOpen(true)} />}
          columns={[
            { key: 'name', header: 'Customer Name', sortable: true },
            { key: 'mobile', header: 'Mobile' },
            { key: 'email', header: 'Email' },
            { key: 'projectCount', header: 'Projects' },
            { key: 'quotationCount', header: 'Quotations' },
            { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
            {
              key: 'actions',
              header: '',
              render: (r) => (
                <ActionMenu
                  items={[
                    { label: 'View', icon: Eye, onClick: () => navigate(`/customers/${r.id}`) },
                    { label: 'Edit', icon: Pencil, onClick: () => { setEditing(r); setOpen(true); } },
                    {
                      label: 'Delete',
                      icon: Trash2,
                      danger: true,
                      onClick: () =>
                        openConfirm({
                          title: 'Delete customer',
                          message: `Are you sure you want to delete ${r.name}?`,
                          confirmLabel: 'Delete',
                          danger: true,
                          onConfirm: async () => {
                            await customerService.delete(r.id);
                            toast('Customer deleted');
                            load();
                          },
                        }),
                    },
                  ]}
                />
              ),
            },
          ]}
        />
      </Card>
      <CustomerForm open={open} onClose={() => setOpen(false)} editing={editing} onSaved={load} />
    </div>
  );
}

export function CustomerForm({ open, onClose, editing, onSaved }) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: editing || { name: '', mobile: '', email: '', type: 'Individual', address: '' },
  });
  useEffect(() => {
    reset(editing || { name: '', mobile: '', email: '', type: 'Individual', address: '', status: 'Active' });
  }, [editing, reset, open]);

  return (
    <Modal
      open={open}
      title={editing ? 'Edit customer' : 'Add customer'}
      description="Customer records used across quotations and projects"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleSubmit(async (values) => {
              if (editing) await customerService.update(editing.id, values);
              else await customerService.create(values);
              toast(editing ? 'Customer updated' : 'Customer created');
              onSaved();
              onClose();
            })}
          >
            Save
          </Button>
        </>
      }
    >
      <form className="grid gap-3">
        <Input label="Customer Name" required error={errors.name?.message} {...register('name', { required: 'Required' })} />
        <Input label="Mobile" required error={errors.mobile?.message} {...register('mobile', { validate: (v) => isValidMobile(v) || 'Invalid mobile' })} />
        <Input label="Email" error={errors.email?.message} {...register('email', { validate: (v) => isValidEmail(v) || 'Invalid email' })} />
        <Select label="Customer Type" {...register('type')}>{CUSTOMER_TYPES.map((t) => <option key={t}>{t}</option>)}</Select>
        <Input label="Address" {...register('address')} />
      </form>
    </Modal>
  );
}

export function CustomerValue({ customerId, quotations }) {
  const total = quotations.filter((q) => q.customer?.id === customerId).reduce((s, q) => s + (Number(q.grandTotal) || 0), 0);
  return formatCurrency(total);
}
