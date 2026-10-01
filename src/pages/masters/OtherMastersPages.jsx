import { MasterPage, statusCol } from './MasterPage';
import { electricalMasterService, plumbingMasterService, doorsWindowsMasterService, tilesGraniteMasterService, paintingMasterService } from '../../services/mock';

export function ElectricalMasterPage() {
  return (
    <MasterPage
      eyebrow="Masters / Electrical"
      title="Electrical Master"
      description="Default electrical points by room."
      addLabel="Add Point"
      entityLabel="point"
      service={electricalMasterService}
      createFactory={() => ({ name: '', room: 'Hall', code: 'custom', unit: 'nos', status: 'Active' })}
      fields={[
        { name: 'name', label: 'Point' },
        { name: 'room', label: 'Room' },
        { name: 'unit', label: 'Unit' },
        { name: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'] },
      ]}
      columns={[
        { key: 'room', header: 'Room' },
        { key: 'name', header: 'Point' },
        { key: 'unit', header: 'Unit' },
        statusCol(),
      ]}
    />
  );
}

export function PlumbingMasterPage() {
  return (
    <MasterPage
      eyebrow="Masters / Plumbing"
      title="Plumbing Master"
      description="Tanks, fixtures and sanitary items."
      addLabel="Add Item"
      entityLabel="item"
      service={{
        getAll: plumbingMasterService.getAll,
        create: (p) => plumbingMasterService.create(p),
        update: plumbingMasterService.update,
        delete: plumbingMasterService.delete,
      }}
      createFactory={() => ({ item: '', unit: 'nos', category: 'plumbing' })}
      fields={[
        { name: 'item', label: 'Item' },
        { name: 'unit', label: 'Unit' },
        { name: 'category', label: 'Category' },
      ]}
      columns={[
        { key: 'item', header: 'Item' },
        { key: 'unit', header: 'Unit' },
        { key: 'category', header: 'Category' },
      ]}
    />
  );
}

export function DoorsWindowsMasterPage() {
  return (
    <MasterPage
      eyebrow="Masters / Openings"
      title="Doors & Windows Master"
      description="Door shutters and sliding systems."
      addLabel="Add Item"
      entityLabel="item"
      service={doorsWindowsMasterService}
      createFactory={() => ({ item: '', unit: 'nos' })}
      fields={[
        { name: 'item', label: 'Item' },
        { name: 'unit', label: 'Unit' },
      ]}
      columns={[
        { key: 'item', header: 'Item' },
        { key: 'unit', header: 'Unit' },
      ]}
    />
  );
}

export function TilesGraniteMasterPage() {
  return (
    <MasterPage
      eyebrow="Masters / Finishes"
      title="Tiles & Granite Master"
      description="Floor, wall, parking and granite items."
      addLabel="Add Item"
      entityLabel="item"
      service={tilesGraniteMasterService}
      createFactory={() => ({ item: '', category: 'tiles', unit: 'sqft' })}
      fields={[
        { name: 'item', label: 'Item' },
        { name: 'category', label: 'Category' },
        { name: 'unit', label: 'Unit' },
      ]}
      columns={[
        { key: 'item', header: 'Item' },
        { key: 'category', header: 'Category' },
        { key: 'unit', header: 'Unit' },
      ]}
    />
  );
}

export function PaintingMasterPage() {
  return (
    <MasterPage
      eyebrow="Masters / Finishes"
      title="Painting Master"
      description="Inner and outer painting items."
      addLabel="Add Item"
      entityLabel="item"
      service={paintingMasterService}
      createFactory={() => ({ item: '', group: 'outer', unit: 'sqft' })}
      fields={[
        { name: 'item', label: 'Item' },
        { name: 'group', label: 'Group', type: 'select', options: ['outer', 'inner'] },
        { name: 'unit', label: 'Unit' },
      ]}
      columns={[
        { key: 'item', header: 'Item' },
        { key: 'group', header: 'Group' },
        { key: 'unit', header: 'Unit' },
      ]}
    />
  );
}
