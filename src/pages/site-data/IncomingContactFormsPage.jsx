import { useMemo, useState } from 'react';
import { Eye, Mail, Phone } from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { PageHeader } from '../../components/common/PageHeader';
import { SearchInput } from '../../components/common/SearchInput';
import { DataTable } from '../../components/tables/DataTable';
import { Modal } from '../../components/modals/Modal';

const DEMO_ENQUIRIES = [
  {
    id: 'ENQ-2048',
    name: 'Aarav Mehta',
    email: 'aarav.mehta@example.com',
    phone: '+91 90000 00001',
    interest: 'New home construction',
    location: 'Baner, Pune',
    message: 'We are planning a 2,000 sq. ft. home and would like to understand the construction process and estimate.',
    submittedAt: '2026-10-28T09:32:00',
    status: 'New',
  },
  {
    id: 'ENQ-2047',
    name: 'Diya Kulkarni',
    email: 'diya.kulkarni@example.com',
    phone: '+91 90000 00002',
    interest: 'Home renovation',
    location: 'Aundh, Pune',
    message: 'Looking for a full renovation of our kitchen and two bathrooms. Could we schedule a site visit next week?',
    submittedAt: '2026-10-27T14:10:00',
    status: 'In Review',
  },
  {
    id: 'ENQ-2046',
    name: 'Rohan Desai',
    email: 'rohan.desai@example.com',
    phone: '+91 90000 00003',
    interest: 'Commercial construction',
    location: 'Wakad, Pune',
    message: 'Please share more details about your experience with small commercial office projects.',
    submittedAt: '2026-10-26T11:45:00',
    status: 'Contacted',
  },
  {
    id: 'ENQ-2045',
    name: 'Isha Patil',
    email: 'isha.patil@example.com',
    phone: '+91 90000 00004',
    interest: 'New home construction',
    location: 'Hinjawadi, Pune',
    message: 'We have a plot and early floor plans ready. I would like to request a construction quotation.',
    submittedAt: '2026-10-25T16:20:00',
    status: 'New',
  },
  {
    id: 'ENQ-2044',
    name: 'Kabir Shah',
    email: 'kabir.shah@example.com',
    phone: '+91 90000 00005',
    interest: 'Interior finishing',
    location: 'Kothrud, Pune',
    message: 'Interested in flooring, painting, and carpentry work for a recently completed apartment.',
    submittedAt: '2026-10-24T10:05:00',
    status: 'In Review',
  },
  {
    id: 'ENQ-2043',
    name: 'Mira Joshi',
    email: 'mira.joshi@example.com',
    phone: '+91 90000 00006',
    interest: 'Home extension',
    location: 'Pashan, Pune',
    message: 'We are considering adding one floor to our existing home and would like to discuss feasibility.',
    submittedAt: '2026-10-22T13:18:00',
    status: 'Contacted',
  },
];

const STATUS_STYLES = {
  New: 'border-sky-200 bg-sky-50 text-sky-700',
  'In Review': 'border-amber-200 bg-amber-50 text-amber-700',
  Contacted: 'border-emerald-200 bg-emerald-50 text-emerald-700',
};

function formatSubmittedAt(value) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export default function IncomingContactFormsPage() {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All statuses');
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);

  const rows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return DEMO_ENQUIRIES.filter((enquiry) => {
      const matchesStatus = statusFilter === 'All statuses' || enquiry.status === statusFilter;
      const searchableText = [
        enquiry.id,
        enquiry.name,
        enquiry.email,
        enquiry.phone,
        enquiry.interest,
        enquiry.location,
        enquiry.message,
      ].join(' ').toLowerCase();
      return matchesStatus && (!normalizedQuery || searchableText.includes(normalizedQuery));
    });
  }, [query, statusFilter]);

  const columns = [
    {
      key: 'name',
      header: 'Contact',
      sortable: true,
      render: (enquiry) => (
        <div className="min-w-44">
          <p className="font-semibold text-ink">{enquiry.name}</p>
          <p className="mt-0.5 text-xs text-muted">{enquiry.email}</p>
        </div>
      ),
    },
    {
      key: 'interest',
      header: 'Interested in',
      sortable: true,
      render: (enquiry) => (
        <div>
          <p className="font-medium text-ink">{enquiry.interest}</p>
          <p className="mt-0.5 text-xs text-muted">{enquiry.location}</p>
        </div>
      ),
    },
    {
      key: 'submittedAt',
      header: 'Submitted',
      sortable: true,
      render: (enquiry) => <span className="whitespace-nowrap text-muted">{formatSubmittedAt(enquiry.submittedAt)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (enquiry) => <Badge className={`border ${STATUS_STYLES[enquiry.status]}`}>{enquiry.status}</Badge>,
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (enquiry) => (
        <Button size="sm" variant="secondary" onClick={() => setSelectedEnquiry(enquiry)}>
          <Eye className="h-4 w-4" />
          View
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Site Data"
        title="Incoming Contact Forms"
        description="Enquiries submitted through your public website."
      />

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Summary label="Total enquiries" value={DEMO_ENQUIRIES.length} />
        <Summary label="New" value={DEMO_ENQUIRIES.filter((enquiry) => enquiry.status === 'New').length} />
        <Summary label="In review" value={DEMO_ENQUIRIES.filter((enquiry) => enquiry.status === 'In Review').length} />
        <Summary label="Contacted" value={DEMO_ENQUIRIES.filter((enquiry) => enquiry.status === 'Contacted').length} />
      </div>

      <div className="mb-4 flex flex-col gap-3 border-y border-line py-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput value={query} onChange={setQuery} placeholder="Search enquiries" className="w-full sm:max-w-sm" compact />
        <label className="flex items-center gap-2 text-[13px] text-muted">
          <span>Status</span>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="input-control input-control-sm min-w-36"
          >
            <option>All statuses</option>
            <option>New</option>
            <option>In Review</option>
            <option>Contacted</option>
          </select>
        </label>
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        rowKey="id"
        pageSize={10}
        empty={(
          <div className="border-b border-line px-5 py-12 text-center text-sm text-muted">
            No enquiries match this search or status.
          </div>
        )}
        mobileCard={(enquiry) => (
          <article className="rounded-lg border border-line bg-white p-3.5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold text-ink">{enquiry.name}</p>
                <p className="mt-0.5 truncate text-xs text-muted">{enquiry.email}</p>
              </div>
              <Badge className={`shrink-0 border ${STATUS_STYLES[enquiry.status]}`}>{enquiry.status}</Badge>
            </div>
            <p className="mt-3 text-sm font-medium text-ink">{enquiry.interest}</p>
            <p className="mt-1 text-xs text-muted">{enquiry.location} · {formatSubmittedAt(enquiry.submittedAt)}</p>
            <Button className="mt-3 w-full" size="sm" variant="secondary" onClick={() => setSelectedEnquiry(enquiry)}>
              <Eye className="h-4 w-4" />
              View enquiry
            </Button>
          </article>
        )}
      />

      <p className="mt-4 text-xs text-faint">Demo records only. All names, contact details, and messages are fictional.</p>

      <Modal
        open={Boolean(selectedEnquiry)}
        onClose={() => setSelectedEnquiry(null)}
        title={selectedEnquiry?.name || 'Enquiry details'}
        description={selectedEnquiry ? `${selectedEnquiry.id} · Submitted ${formatSubmittedAt(selectedEnquiry.submittedAt)}` : undefined}
        footer={<Button variant="secondary" onClick={() => setSelectedEnquiry(null)}>Close</Button>}
      >
        {selectedEnquiry ? (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge className={`border ${STATUS_STYLES[selectedEnquiry.status]}`}>{selectedEnquiry.status}</Badge>
              <Badge className="bg-brand-pale text-brand-deep">{selectedEnquiry.interest}</Badge>
            </div>
            <div className="grid gap-3 rounded-lg border border-line bg-surface p-3 sm:grid-cols-2">
              <Detail label="Email" value={selectedEnquiry.email} icon={Mail} />
              <Detail label="Phone" value={selectedEnquiry.phone} icon={Phone} />
              <Detail label="Location" value={selectedEnquiry.location} />
              <Detail label="Enquiry ID" value={selectedEnquiry.id} />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-faint">Message</p>
              <p className="mt-1.5 whitespace-pre-wrap text-sm leading-6 text-ink">{selectedEnquiry.message}</p>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

function Summary({ label, value }) {
  return (
    <div className="border-y border-line bg-white px-3 py-3 sm:px-4">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-faint">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums text-brand-navy">{value}</p>
    </div>
  );
}

function Detail({ label, value, icon: Icon }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-faint">{label}</p>
      <p className="mt-1 flex items-center gap-1.5 break-all text-[13px] font-medium text-ink">
        {Icon ? <Icon className="h-3.5 w-3.5 shrink-0 text-muted" /> : null}
        {value}
      </p>
    </div>
  );
}