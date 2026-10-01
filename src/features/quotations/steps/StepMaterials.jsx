import { useEffect, useState } from 'react';
import { SectionCard } from '../../../components/cards/Card';
import { materialService } from '../../../services/mock';
import { MATERIAL_CATEGORIES } from '../../../constants';
import { Button } from '../../../components/common/Button';
import { uid } from '../../../utils/formatting';
import { Boxes, ChevronDown, Layers, Zap, Droplets, DoorOpen, Square, Paintbrush } from 'lucide-react';

const ICONS = {
  'RCC Materials': Layers,
  'Brick & Plaster Materials': Boxes,
  'Granite & Tiles': Square,
  'Electrical Materials': Zap,
  'Plumbing Materials': Droplets,
  'Doors & Frames': DoorOpen,
  Sliding: DoorOpen,
  Painting: Paintbrush,
};

export function StepMaterials({ quotation, onPatch }) {
  const [master, setMaster] = useState([]);
  const [open, setOpen] = useState(MATERIAL_CATEGORIES[0]);

  useEffect(() => {
    materialService.getAll().then(setMaster);
  }, []);

  const selected = quotation.materials || [];

  const toggle = (material) => {
    const exists = selected.find((m) => m.materialId === material.id);
    if (exists) {
      onPatch({ materials: selected.filter((m) => m.materialId !== material.id) });
    } else {
      onPatch({
        materials: [
          ...selected,
          {
            id: uid('qmat'),
            materialId: material.id,
            name: material.name,
            category: material.category,
            brand: material.brand,
            specification: material.specification,
            unit: material.unit,
            selected: true,
          },
        ],
      });
    }
  };

  return (
    <div className="space-y-3">
      {MATERIAL_CATEGORIES.map((cat) => (
        <SectionCard
          key={cat}
          title={cat}
          icon={ICONS[cat] || Boxes}
          action={
            <button type="button" className="rounded-md p-1 text-muted hover:bg-slate-50" onClick={() => setOpen(open === cat ? '' : cat)} aria-label="Toggle">
              <ChevronDown className={`h-4 w-4 transition ${open === cat ? 'rotate-180' : ''}`} />
            </button>
          }
        >
          {open === cat ? (
            <div className="space-y-2">
              {master
                .filter((m) => m.category === cat)
                .map((m) => {
                  const checked = selected.some((s) => s.materialId === m.id);
                  return (
                    <label key={m.id} className="flex items-start gap-3 rounded-lg border border-line p-3 text-sm transition hover:bg-slate-50">
                      <input type="checkbox" checked={checked} onChange={() => toggle(m)} className="mt-0.5" />
                      <span>
                        <span className="font-medium text-ink">{m.name}</span>
                        <span className="block text-[13px] text-muted">
                          {m.brand} · {m.specification}
                        </span>
                      </span>
                    </label>
                  );
                })}
              <Button
                variant="secondary"
                size="sm"
                onClick={() =>
                  onPatch({
                    materials: [
                      ...selected,
                      {
                        id: uid('qmat'),
                        materialId: uid('mat'),
                        name: 'Custom material',
                        category: cat,
                        brand: '',
                        specification: '',
                        unit: 'nos',
                        selected: true,
                      },
                    ],
                  })
                }
              >
                Add material
              </Button>
            </div>
          ) : (
            <p className="text-[13px] text-muted">{master.filter((m) => m.category === cat).length} specifications</p>
          )}
        </SectionCard>
      ))}
    </div>
  );
}
