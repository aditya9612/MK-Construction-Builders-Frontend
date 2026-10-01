import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/forms/Fields';
import { storage } from '../../utils/storage/localStorage';
import { STORAGE_KEYS } from '../../constants';
import { toast } from '../../store/uiStore';

export default function LoginPage() {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { email: 'admin@mkconstruction.com', password: 'demo' },
  });

  return (
    <form
      className="space-y-4"
      onSubmit={handleSubmit((values) => {
        storage.set(STORAGE_KEYS.session, {
          name: 'Mahesh Kumar',
          email: values.email,
          role: 'Admin',
          token: 'mock-session',
        });
        toast('Welcome back');
        navigate('/dashboard');
      })}
    >
      <div className="text-center">
        <h1 className="text-[22px] font-semibold tracking-tight text-ink">Sign in</h1>
        <p className="mt-1.5 text-sm text-muted">Access the MK Construction estimation workspace.</p>
      </div>
      <Input label="Email" type="email" error={errors.email?.message} {...register('email', { required: 'Email is required' })} />
      <Input label="Password" type="password" error={errors.password?.message} {...register('password', { required: 'Password is required' })} />
      <Button type="submit" className="w-full">Continue</Button>
    </form>
  );
}
