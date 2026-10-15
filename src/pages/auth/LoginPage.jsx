import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/forms/Fields';
import { storage } from '../../utils/storage/localStorage';
import { STORAGE_KEYS } from '../../constants';
import { toast } from '../../store/uiStore';
import { authService, extractErrorMessage } from '../../services/api/authService';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowRight,
  Loader2,
  AlertCircle,
} from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  // Initialize saved email from storage if remembered
  const savedEmail = storage.get(STORAGE_KEYS.rememberedEmail, '');

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Check for remembered email or existing valid session with refresh token on mount
  useEffect(() => {
    let mounted = true;

    async function checkExistingAuth() {
      if (savedEmail) {
        setValue('email', savedEmail);
        setRememberMe(true);
      }

      const existingSession = authService.getSession();
      if (existingSession?.refresh_token) {
        try {
          // Attempt silent session refresh using POST /api/v1/auth/refresh
          const { session } = await authService.refreshSession();
          if (mounted && session?.access_token) {
            toast('Welcome back! Session restored.', 'success');
            navigate('/dashboard', { replace: true });
            return;
          }
        } catch (err) {
          // Token is expired or invalid; clear stale session cleanly
          console.info('Saved session expired, re-login required.', err);
          authService.logout();
        }
      }

      if (mounted) {
        setIsCheckingSession(false);
      }
    }

    checkExistingAuth();

    return () => {
      mounted = false;
    };
  }, [navigate, savedEmail, setValue]);

  const onSubmit = async (values) => {
    setServerError('');
    setIsSubmitting(true);

    try {
      // Connect to Login API: POST /api/v1/auth/login
      const result = await authService.login({
        email: values.email.trim(),
        password: values.password,
      });

      // Handle "Remember me"
      if (rememberMe) {
        storage.set(STORAGE_KEYS.rememberedEmail, values.email.trim());
      } else {
        storage.remove(STORAGE_KEYS.rememberedEmail);
      }

      toast(result.raw?.message || 'Successfully signed in!', 'success');
      navigate('/dashboard', { replace: true });
    } catch (error) {
      const errorMsg = extractErrorMessage(
        error,
        'Invalid email or password. Please try again.'
      );
      setServerError(errorMsg);
      toast(errorMsg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isCheckingSession) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Loader2 className="w-8 h-8 text-[#0284c7] animate-spin mb-3" />
        <p className="text-sm font-medium text-slate-500">Checking secure session...</p>
      </div>
    );
  }

  return (
    <div className="relative z-10 w-full">
      <div className="mb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-light/50 text-brand font-semibold text-[11px] uppercase tracking-wider mb-5">
          <ShieldCheck className="w-3.5 h-3.5" />
          SECURE WORKSPACE
        </div>
        <h1 className="text-2xl sm:text-[28px] font-bold tracking-tight text-[#0f172a] mb-1 sm:mb-2">
          Welcome back
        </h1>
        <p className="text-sm sm:text-[15px] text-[#64748b]">
          Please enter your credentials to sign in to MK Construction.
        </p>
      </div>

      {serverError && (
        <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-xs sm:text-sm text-red-700 animate-fade-in-up">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
          <div className="flex-1 font-medium leading-relaxed">{serverError}</div>
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            placeholder="name@company.com"
            disabled={isSubmitting}
            error={errors.email?.message}
            leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
            className="h-[46px] rounded-lg border-slate-200 text-slate-800"
            {...register('email', {
              required: 'Email is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Please enter a valid email address',
              },
              onChange: () => {
                if (serverError) setServerError('');
              },
            })}
          />

          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            disabled={isSubmitting}
            error={errors.password?.message}
            leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="focus:outline-none hover:text-slate-600 transition-colors p-1"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4 text-slate-400" />
                ) : (
                  <Eye className="w-4 h-4 text-slate-400" />
                )}
              </button>
            }
            className="h-[46px] rounded-lg border-slate-200 text-slate-800"
            {...register('password', {
              required: 'Password is required',
              onChange: () => {
                if (serverError) setServerError('');
              },
            })}
          />
        </div>

        <div className="flex items-center justify-between mt-3 sm:mt-4">
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              disabled={isSubmitting}
              className="h-4 w-4 rounded border-slate-300 text-[#0284c7] focus:ring-[#0284c7] cursor-pointer disabled:opacity-50"
            />
            <label
              htmlFor="remember-me"
              className="ml-2 block text-[13px] sm:text-sm text-slate-500 cursor-pointer hover:text-slate-800 transition-colors"
            >
              Remember me
            </label>
          </div>

          <div className="text-[13px] sm:text-sm">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                toast('Please contact your system administrator to reset credentials.', 'info');
              }}
              className="font-semibold text-[#0284c7] hover:text-[#0369a1] transition-colors"
            >
              Forgot password?
            </a>
          </div>
        </div>

        <div className="pt-3">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 h-[46px] text-[15px] font-semibold rounded-lg bg-[#0284c7] hover:bg-[#0369a1] disabled:bg-slate-300 disabled:cursor-not-allowed text-white transition-all duration-200 shadow-[0_4px_14px_rgba(2,132,199,0.3)] hover:shadow-[0_6px_20px_rgba(2,132,199,0.4)]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                Sign in
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      </form>

      <div className="mt-6 sm:mt-8 pt-6 border-t border-slate-100 text-center">
        <p className="text-[13px] sm:text-[14px] text-slate-500">
          Need an account?{' '}
          <a
            href="mailto:support@mkconstruction.site"
            className="font-semibold text-[#0284c7] hover:text-[#0369a1] transition-colors"
          >
            Contact Administrator
          </a>
        </p>
      </div>
    </div>
  );
}
