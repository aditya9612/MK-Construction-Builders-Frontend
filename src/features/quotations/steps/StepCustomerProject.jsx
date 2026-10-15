import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { SectionCard } from '../../../components/cards/Card';
import { Button } from '../../../components/common/Button';
import { Input, Select, DatePicker } from '../../../components/forms/Fields';
import { Modal } from '../../../components/modals/Modal';
import { customerService, projectService, rateService } from '../../../services/api';
import { CUSTOMER_TYPES, FLOOR_OPTIONS } from '../../../constants';
import { isValidEmail, isValidMobile } from '../../../utils/validation';
import { defaultConstructionItems, defaultPaintingItems } from '../../../mock/quotations';
import { toast } from '../../../store/uiStore';
import { Users, Building2 } from 'lucide-react';

export function StepCustomerProject({ quotation, onPatch }) {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      customerName: quotation.customer?.name || '',
      mobile: quotation.customer?.mobile || '',
      email: quotation.customer?.email || '',
      customerType: quotation.customer?.customer_type || quotation.customer?.type || 'INDIVIDUAL',
      projectName: quotation.project?.project_name || quotation.project?.name || '',
      siteAddress: quotation.project?.site_address || quotation.project?.siteAddress || '',
      plotArea: quotation.project?.plot_area ?? quotation.project?.plotArea ?? '',
      constructionArea: quotation.project?.construction_area ?? quotation.project?.constructionArea ?? '',
      floors: quotation.project?.floor_type || quotation.project?.floors || 'G+1',
      quotationDate: quotation.quotation_date || quotation.quotationDate,
    },
  });
  const [customers, setCustomers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [openCust, setOpenCust] = useState(false);
  const [openProj, setOpenProj] = useState(false);

  useEffect(() => {
    customerService.getAll().then((data) => setCustomers(Array.isArray(data) ? data : []));
    projectService.getAll().then((data) => setProjects(Array.isArray(data) ? data : []));
  }, []);

  const constructionArea = watch('constructionArea');

  const apply = (values) => {
    const area = Number(values.constructionArea) || 0;
    const prevArea = Number(quotation.project?.construction_area ?? quotation.project?.constructionArea) || 0;
    const patch = {
      quotationDate: values.quotationDate,
      quotation_date: values.quotationDate,
      customer: {
        ...quotation.customer,
        id: quotation.customer?.id || quotation.customer_id,
        name: values.customerName,
        mobile: values.mobile,
        email: values.email,
        type: values.customerType,
        customer_type: values.customerType,
      },
      customer_id: quotation.customer?.id || quotation.customer_id,
      project: {
        ...quotation.project,
        id: quotation.project?.id || quotation.project_id,
        name: values.projectName,
        project_name: values.projectName,
        siteAddress: values.siteAddress,
        site_address: values.siteAddress,
        plotArea: values.plotArea,
        plot_area: values.plotArea,
        constructionArea: area,
        construction_area: area,
        floors: values.floors,
        floor_type: values.floors,
      },
      project_id: quotation.project?.id || quotation.project_id,
    };
    if (area && area !== prevArea) {
      rateService.getAll().then((rates) => {
        onPatch({
          ...patch,
          constructionItems: defaultConstructionItems(area, rates),
          painting: defaultPaintingItems(rates, area),
        });
      });
    } else {
      onPatch(patch);
    }
  };

  return (
    <form className="space-y-5" onChange={handleSubmit(apply)} onBlur={handleSubmit(apply)}>
      <SectionCard
        title="Customer information"
        icon={Users}
        description="Client details used on the quotation document."
        action={
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => setOpenCust(true)}>
              <Users className="h-4 w-4 mr-1" /> Select existing customer
            </Button>
          </div>
        }
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Input label="Customer Name" required error={errors.customerName?.message} {...register('customerName', { required: 'Customer name is required' })} />
          <Input
            label="Mobile Number"
            required
            error={errors.mobile?.message}
            {...register('mobile', {
              required: 'Mobile number is required',
              validate: (v) => isValidMobile(v) || 'Enter a valid 10-digit Indian mobile number',
            })}
          />
          <Input
            label="Email"
            type="email"
            error={errors.email?.message}
            {...register('email', { validate: (v) => isValidEmail(v) || 'Enter a valid email' })}
          />
          <Select label="Customer Type" {...register('customerType')}>
            {CUSTOMER_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </Select>
        </div>
      </SectionCard>

      <SectionCard
        title="Project information"
        icon={Building2}
        description="Site measurements drive construction quantities."
        action={<Button variant="secondary" size="sm" onClick={() => setOpenProj(true)}><Building2 className="h-4 w-4 mr-1" /> Select existing project</Button>}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Input label="Project Name" required error={errors.projectName?.message} {...register('projectName', { required: 'Project name is required' })} />
          <div className="md:col-span-2">
            <Input label="Site Address" required error={errors.siteAddress?.message} {...register('siteAddress', { required: 'Site address is required' })} />
          </div>
          <Input label="Plot Area (sqft)" type="number" min="0" {...register('plotArea')} />
          <Input label="Construction Area (sqft)" type="number" min="0" {...register('constructionArea')} hint={constructionArea ? `Foundation example: ${Number(constructionArea).toLocaleString('en-IN')} × 900` : ''} />
          <Select label="Number of Floors" {...register('floors')}>
            {FLOOR_OPTIONS.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </Select>
          <DatePicker label="Quotation Date" {...register('quotationDate')} />
        </div>
      </SectionCard>

      <Modal open={openCust} title="Select customer" onClose={() => setOpenCust(false)}>
        <div className="max-h-80 space-y-2 overflow-y-auto">
          {customers.length === 0 ? (
            <p className="text-xs text-slate-400 p-4 text-center">No customers found.</p>
          ) : (
            customers.map((c) => (
              <button
                key={c.id}
                type="button"
                className="w-full rounded-lg border border-line px-3 py-2.5 text-left text-sm transition duration-ui hover:border-brand/40 hover:bg-brand-pale cursor-pointer"
                onClick={() => {
                  setValue('customerName', c.name);
                  setValue('mobile', c.mobile);
                  setValue('email', c.email);
                  setValue('customerType', c.customer_type || c.type || 'INDIVIDUAL');
                  onPatch({
                    customer: { id: c.id, name: c.name, mobile: c.mobile, email: c.email, type: c.customer_type || c.type || 'INDIVIDUAL' },
                    customer_id: c.id,
                  });
                  setOpenCust(false);
                  toast('Customer selected');
                }}
              >
                <p className="font-medium text-slate-900">{c.name}</p>
                <p className="text-muted text-xs">{c.mobile} · {c.email || 'No email'}</p>
              </button>
            ))
          )}
        </div>
      </Modal>

      <Modal open={openProj} title="Select project" onClose={() => setOpenProj(false)}>
        <div className="max-h-80 space-y-2 overflow-y-auto">
          {projects.length === 0 ? (
            <p className="text-xs text-slate-400 p-4 text-center">No projects found.</p>
          ) : (
            projects.map((p) => (
              <button
                key={p.id}
                type="button"
                className="w-full rounded-lg border border-line px-3 py-2.5 text-left text-sm transition duration-ui hover:border-brand/40 hover:bg-brand-pale cursor-pointer"
                onClick={() => {
                  const pName = p.project_name || p.name;
                  const sAddress = p.site_address || p.siteAddress;
                  const pArea = p.plot_area ?? p.plotArea;
                  const cArea = p.construction_area ?? p.constructionArea;
                  const fType = p.floor_type || p.floors || 'G+1';

                  setValue('projectName', pName);
                  setValue('siteAddress', sAddress);
                  setValue('plotArea', pArea);
                  setValue('constructionArea', cArea);
                  setValue('floors', fType);

                  const patchData = {
                    project: {
                      id: p.id,
                      name: pName,
                      project_name: pName,
                      siteAddress: sAddress,
                      site_address: sAddress,
                      plotArea: pArea,
                      plot_area: pArea,
                      constructionArea: cArea,
                      construction_area: cArea,
                      floors: fType,
                      floor_type: fType,
                    },
                    project_id: p.id,
                  };

                  if (p.customer_id && !quotation.customer_id) {
                    const matchedCust = customers.find((c) => String(c.id) === String(p.customer_id));
                    if (matchedCust) {
                      setValue('customerName', matchedCust.name);
                      setValue('mobile', matchedCust.mobile);
                      setValue('email', matchedCust.email);
                      setValue('customerType', matchedCust.customer_type || matchedCust.type || 'INDIVIDUAL');
                      patchData.customer = {
                        id: matchedCust.id,
                        name: matchedCust.name,
                        mobile: matchedCust.mobile,
                        email: matchedCust.email,
                        type: matchedCust.customer_type || matchedCust.type || 'INDIVIDUAL',
                      };
                      patchData.customer_id = matchedCust.id;
                    }
                  }

                  onPatch(patchData);
                  setOpenProj(false);
                  toast('Project selected');
                }}
              >
                <p className="font-medium text-slate-900">{p.project_name || p.name}</p>
                <p className="text-muted text-xs">{p.site_address || p.siteAddress} · {p.construction_area || p.constructionArea || 0} sqft</p>
              </button>
            ))
          )}
        </div>
      </Modal>
    </form>
  );
}
