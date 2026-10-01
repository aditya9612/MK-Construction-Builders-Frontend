import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/cards/Card';
import { SearchInput } from '../../components/common/SearchInput';
import { DataTable } from '../../components/tables/DataTable';
import { CategoryBadge, StatusBadge } from '../../components/common/Badge';
import { ActionMenu } from '../../components/common/ActionMenu';
import { Modal } from '../../components/modals/Modal';
import { Input, Select } from '../../components/forms/Fields';
import { EmptyState } from '../../components/common/States';
import { toast, useUiStore } from '../../store/uiStore';
import { formatCurrency } from '../../utils/formatting';

export function MasterPage({
  title,
  description,
  eyebrow,
  addLabel = 'Add',
  entityLabel = 'record',
  uppercase,
  service,
  fields,
  columns,
  createFactory,
}) {
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({});
  const [editing, setEditing] = useState(null);
  const openConfirm = useUiStore((s) => s.openConfirm);

  const load = async () => setRows(await service.getAll());
  useEffect(() => { load(); }, []);

  const categories = useMemo(
    () => [...new Set(rows.map((r) => r.category).filter(Boolean))],
    [rows]
  );
  const statuses = useMemo(
    () => [...new Set(rows.map((r) => r.status).filter(Boolean))],
    [rows]
  );
  const hasCategory = categories.length > 0;
  const hasStatus = statuses.length > 0;

  const filtered = useMemo(() => {
    const term = q.toLowerCase();
    return rows.filter((r) => {
      if (term && !JSON.stringify(r).toLowerCase().includes(term)) return false;
      if (category && r.category !== category) return false;
      if (status && r.status !== status) return false;
      return true;
    });
  }, [rows, q, category, status]);

  const stats = useMemo(() => {
    const active = rows.filter((r) => (r.status || 'Active') === 'Active').length;
    return {
      total: rows.length,
      active,
      categories: categories.length,
    };
  }, [rows, categories.length]);

  const openCreate = () => {
    setEditing(null);
    setForm(createFactory());
    setOpen(true);
  };

  return (
    <div>
      <PageHeader
        eyebrow={eyebrow}
        title={title}
        uppercase={uppercase}
        description={description}
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> {addLabel}
          </Button>
        }
      />
      {hasStatus || hasCategory ? (
        <div className="mb-5 grid gap-3 sm:grid-cols-3">
          <Kpi label={hasStatus ? `Active ${entityLabel}s` : `Total ${entityLabel}s`} value={hasStatus ? stats.active : stats.total} />
          {hasCategory ? <Kpi label="Categories" value={stats.categories} /> : <Kpi label="Records" value={stats.total} />}
          <Kpi label="Visible" value={filtered.length} />
        </div>
      ) : null}
      <Card className="p-4 sm:p-5">
        <div className="mb-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_160px_140px]">
          <SearchInput compact value={q} onChange={setQ} placeholder={`Search ${entityLabel}s...`} />
          {hasCategory ? (
            <Select value={category} onChange={(e) => setCategory(e.target.value)} className="input-control-sm">
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </Select>
          ) : null}
          {hasStatus ? (
            <Select value={status} onChange={(e) => setStatus(e.target.value)} className="input-control-sm">
              <option value="">All statuses</option>
              {statuses.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </Select>
          ) : null}
        </div>
        <DataTable
          rows={filtered}
          empty={<EmptyState title={`No ${entityLabel}s`} actionLabel={addLabel} onAction={openCreate} />}
          columns={[
            ...columns,
            {
              key: 'actions',
              header: '',
              headerClassName: 'text-right',
              className: 'text-right',
              render: (r) => (
                <ActionMenu
                  items={[
                    {
                      label: 'Edit',
                      icon: Pencil,
                      onClick: () => {
                        setEditing(r);
                        setForm(r);
                        setOpen(true);
                      },
                    },
                    {
                      label: 'Delete',
                      icon: Trash2,
                      danger: true,
                      onClick: () =>
                        openConfirm({
                          title: `Delete ${entityLabel}`,
                          message: 'Are you sure you want to delete this item?',
                          confirmLabel: 'Delete',
                          danger: true,
                          onConfirm: async () => {
                            await service.delete(r.id);
                            toast('Item removed successfully');
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
      <Modal
        open={open}
        title={editing ? `Edit ${entityLabel}` : addLabel}
        description={`Define ${entityLabel} details used across construction estimates`}
        onClose={() => setOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              onClick={async () => {
                if (editing) await service.update(editing.id, form);
                else await service.create(form);
                toast(editing ? 'Updated successfully' : 'Created successfully');
                setOpen(false);
                load();
              }}
            >
              Save {entityLabel.charAt(0).toUpperCase() + entityLabel.slice(1)}
            </Button>
          </>
        }
      >
        <div className="grid gap-3">
          {fields.map((field) =>
            field.type === 'select' ? (
              <Select key={field.name} label={field.label} value={form[field.name] || ''} onChange={(e) => setForm({ ...form, [field.name]: e.target.value })}>
                {field.options.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </Select>
            ) : (
              <Input
                key={field.name}
                label={field.label}
                type={field.type || 'text'}
                value={form[field.name] ?? ''}
                onChange={(e) => setForm({ ...form, [field.name]: field.type === 'number' ? Number(e.target.value) : e.target.value })}
              />
            )
          )}
        </div>
      </Modal>
    </div>
  );
}

function Kpi({ label, value }) {
  return (
    <Card className="relative overflow-hidden p-4">
      <span className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r bg-brand" />
      <p className="pl-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-faint">{label}</p>
      <p className="mt-2 pl-2 text-[22px] font-semibold tracking-tight tabular-nums text-brand-navy">{value}</p>
    </Card>
  );
}

export function moneyCol(key = 'rate') {
  return {
    key,
    header: 'Rate',
    headerClassName: 'text-right',
    className: 'text-right font-medium tabular-nums money text-ink',
    render: (r) => formatCurrency(r[key]),
    sortable: true,
  };
}

export function statusCol() {
  return { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status || 'Active'} /> };
}

export function categoryCol() {
  return { key: 'category', header: 'Category', render: (r) => <CategoryBadge category={r.category} /> };
}
