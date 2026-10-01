import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/forms/Fields';
import { storage } from '../../utils/storage/localStorage';
import { STORAGE_KEYS } from '../../constants';
import { toast } from '../../store/uiStore';
import { Mail, Lock, Eye, ShieldCheck, ArrowRight } from 'lucide-react';
import { useState } from 'react';

export default function LoginPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { email: 'admin@mkconstruction.com', password: 'demo' },
  });

  return (
    <div className="relative z-10 w-full">
      <div className="mb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-light/50 text-brand font-semibold text-[11px] uppercase tracking-wider mb-5">
          <ShieldCheck className="w-3.5 h-3.5" />
          SECURE WORKSPACE
        </div>
        <h1 className="text-2xl sm:text-[28px] font-bold tracking-tight text-[#0f172a] mb-1 sm:mb-2">Welcome back</h1>
        <p className="text-sm sm:text-[15px] text-[#64748b]">
          Please enter your details to sign in.
        </p>
      </div>

      <form
        className="space-y-4"
        onSubmit={handleSubmit((values) => {
          storage.set(STORAGE_KEYS.session, {
            name: 'Mahesh Kumar',
            email: values.email,
            role: 'Admin',
            token: 'mock-session',
          });
          toast('Successfully signed in', { type: 'success' });
          navigate('/dashboard');
        })}
      >
        <div className="space-y-4">
          <Input 
            label="Email Address" 
            type="email" 
            placeholder="admin@mkconstruction.com"
            error={errors.email?.message}
            leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
            className="h-[46px] rounded-lg border-slate-200 text-slate-800"
            {...register('email', { 
              required: 'Email is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: "Invalid email address"
              }
            })} 
          />
          <Input 
            label="Password" 
            type={showPassword ? "text" : "password"} 
            placeholder="••••••••"
            error={errors.password?.message}
            leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
            rightIcon={
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="focus:outline-none hover:text-slate-600 transition-colors">
                <Eye className="w-4 h-4 text-slate-400" />
              </button>
            }
            className="h-[46px] rounded-lg border-slate-200 text-slate-800"
            {...register('password', { required: 'Password is required' })} 
          />
        </div>

        <div className="flex items-center justify-between mt-3 sm:mt-4">
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-[#0284c7] focus:ring-[#0284c7] cursor-pointer"
            />
            <label htmlFor="remember-me" className="ml-2 block text-[13px] sm:text-sm text-slate-500 cursor-pointer hover:text-slate-800 transition-colors">
              Remember me
            </label>
          </div>

          <div className="text-[13px] sm:text-sm">
            <a href="#" className="font-semibold text-[#0284c7] hover:text-[#0369a1] transition-colors">
              Forgot password?
            </a>
          </div>
        </div>

        <div className="pt-3">
          <Button 
            type="submit" 
            className="w-full flex items-center justify-center gap-2 h-[46px] text-[15px] font-semibold rounded-lg bg-[#0284c7] hover:bg-[#0369a1] text-white transition-all duration-200 shadow-[0_4px_14px_rgba(2,132,199,0.3)] hover:shadow-[0_6px_20px_rgba(2,132,199,0.4)]"
          >
            Sign in
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </form>

      <div className="mt-6 sm:mt-8 pt-6 border-t border-slate-100 text-center">
        <p className="text-[13px] sm:text-[14px] text-slate-500">
          Don't have an account?{' '}
          <a href="#" className="font-semibold text-[#0284c7] hover:text-[#0369a1] transition-colors">
            Contact Administrator
          </a>
        </p>
      </div>
    </div>
  );
}
