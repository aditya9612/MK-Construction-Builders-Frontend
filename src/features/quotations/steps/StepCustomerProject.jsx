import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { SectionCard } from '../../../components/cards/Card';
import { Button } from '../../../components/common/Button';
import { Input, Select, DatePicker } from '../../../components/forms/Fields';
import { Modal } from '../../../components/modals/Modal';
import { customerService, projectService, rateService } from '../../../services/mock';
import { CUSTOMER_TYPES, FLOOR_OPTIONS } from '../../../constants';
import { isValidEmail, isValidMobile } from '../../../utils/validation';
import { defaultConstructionItems, defaultPaintingItems } from '../../../mock/quotations';
import { MOCK_RATES } from '../../../mock/rates';
import { toast } from '../../../store/uiStore';
import { Users, Building2 } from 'lucide-react';

export function StepCustomerProject({ quotation, onPatch }) {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      customerName: quotation.customer?.name || '',
      mobile: quotation.customer?.mobile || '',
      email: quotation.customer?.email || '',
      customerType: quotation.customer?.type || 'Individual',
      projectName: quotation.project?.name || '',
      siteAddress: quotation.project?.siteAddress || '',
      plotArea: quotation.project?.plotArea || '',
      constructionArea: quotation.project?.constructionArea || '',
      floors: quotation.project?.floors || 'G+1',
      quotationDate: quotation.quotationDate,
    },
  });
  const [customers, setCustomers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [openCust, setOpenCust] = useState(false);
  const [openProj, setOpenProj] = useState(false);

  useEffect(() => {
    customerService.getAll().then(setCustomers);
    projectService.getAll().then(setProjects);
  }, []);

  const constructionArea = watch('constructionArea');

  const apply = (values) => {
    const area = Number(values.constructionArea) || 0;
    const prevArea = Number(quotation.project?.constructionArea) || 0;
    const patch = {
      quotationDate: values.quotationDate,
      customer: {
        ...quotation.customer,
        name: values.customerName,
        mobile: values.mobile,
        email: values.email,
        type: values.customerType,
      },
      project: {
        ...quotation.project,
        name: values.projectName,
        siteAddress: values.siteAddress,
        plotArea: values.plotArea,
        constructionArea: area,
        floors: values.floors,
      },
    };
    if (area && area !== prevArea) {
      rateService.getAll().then((rates) => {
        onPatch({
          ...patch,
          constructionItems: defaultConstructionItems(area, rates.length ? rates : MOCK_RATES),
          painting: defaultPaintingItems(rates.length ? rates : MOCK_RATES, area),
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
              <Users className="h-4 w-4" /> Select existing customer
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
        action={<Button variant="secondary" size="sm" onClick={() => setOpenProj(true)}><Building2 className="h-4 w-4" /> Select existing project</Button>}
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
          {customers.map((c) => (
            <button
              key={c.id}
              type="button"
              className="w-full rounded-lg border border-line px-3 py-2.5 text-left text-sm transition duration-ui hover:border-brand/40 hover:bg-brand-pale"
              onClick={() => {
                setValue('customerName', c.name);
                setValue('mobile', c.mobile);
                setValue('email', c.email);
                setValue('customerType', c.type);
                onPatch({ customer: { id: c.id, name: c.name, mobile: c.mobile, email: c.email, type: c.type } });
                setOpenCust(false);
                toast('Customer selected');
              }}
            >
              <p className="font-medium">{c.name}</p>
              <p className="text-muted">{c.mobile} · {c.email}</p>
            </button>
          ))}
        </div>
      </Modal>
      <Modal open={openProj} title="Select project" onClose={() => setOpenProj(false)}>
        <div className="max-h-80 space-y-2 overflow-y-auto">
          {projects.map((p) => (
            <button
              key={p.id}
              type="button"
              className="w-full rounded-lg border border-line px-3 py-2.5 text-left text-sm transition duration-ui hover:border-brand/40 hover:bg-brand-pale"
              onClick={() => {
                setValue('projectName', p.name);
                setValue('siteAddress', p.siteAddress);
                setValue('plotArea', p.plotArea);
                setValue('constructionArea', p.constructionArea);
                setValue('floors', p.floors);
                onPatch({
                  project: { id: p.id, name: p.name, siteAddress: p.siteAddress, plotArea: p.plotArea, constructionArea: p.constructionArea, floors: p.floors },
                  customer: quotation.customer,
                });
                setOpenProj(false);
                toast('Project selected');
              }}
            >
              <p className="font-medium">{p.name}</p>
              <p className="text-muted">{p.siteAddress}</p>
            </button>
          ))}
        </div>
      </Modal>
    </form>
  );
}
