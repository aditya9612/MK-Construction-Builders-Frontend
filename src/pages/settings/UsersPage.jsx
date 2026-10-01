import { useEffect, useState } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { Card } from '../../components/cards/Card';
import { DataTable } from '../../components/tables/DataTable';
import { StatusBadge } from '../../components/common/Badge';
import { storage } from '../../utils/storage/localStorage';
import { STORAGE_KEYS } from '../../constants';

export default function UsersPage() {
  const [rows, setRows] = useState([]);
  useEffect(() => { setRows(storage.get(STORAGE_KEYS.users, [])); }, []);
  return (
    <div>
      <PageHeader eyebrow="System" title="Users" description="Frontend user directory. Authentication will connect to the API later." />
      <Card>
        <DataTable
          rows={rows}
          columns={[
            { key: 'name', header: 'Name' },
            { key: 'email', header: 'Email' },
            { key: 'mobile', header: 'Mobile' },
            { key: 'role', header: 'Role' },
            { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
          ]}
        />
      </Card>
    </div>
  );
}
