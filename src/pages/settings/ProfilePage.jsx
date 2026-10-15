import { useState, useEffect } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { Card } from '../../components/cards/Card';
import { Input } from '../../components/forms/Fields';
import { Button } from '../../components/common/Button';
import { storage } from '../../utils/storage/localStorage';
import { STORAGE_KEYS } from '../../constants';
import { toast } from '../../store/uiStore';
import { initials } from '../../utils/formatting';
import { authService, extractErrorMessage } from '../../services/api/authService';
import {
  User,
  Mail,
  Phone,
  Shield,
  Save,
  RefreshCw,
  Loader2,
  AlertCircle,
  BadgeCheck,
  CheckCircle2,
  Copy,
  Check,
  Hash,
  Layers,
  Lock,
  ExternalLink,
} from 'lucide-react';

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [apiError, setApiError] = useState('');
  const [copied, setCopied] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });

  const [isSaving, setIsSaving] = useState(false);

  // Fetch authenticated user profile from GET /api/v1/auth/me
  const fetchProfile = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);
    setApiError('');

    try {
      const userData = await authService.getCurrentUser();
      const currentSession = storage.get(STORAGE_KEYS.session, null);
      setUser(userData);
      setSession(currentSession);
      setFormData({
        name: userData?.name || '',
        email: userData?.email || '',
        phone: userData?.phone || '',
      });
      if (isManualRefresh) {
        toast('Profile synchronized with API!', 'success');
      }
    } catch (err) {
      const errorMsg = extractErrorMessage(err, 'Failed to fetch user profile');
      setApiError(errorMsg);
      const currentSession = storage.get(STORAGE_KEYS.session, null);
      if (currentSession) {
        setSession(currentSession);
        setUser({
          id: currentSession.id,
          name: currentSession.name,
          email: currentSession.email,
          phone: currentSession.phone || '',
          role: { name: currentSession.role || 'USER' },
          is_active: true,
        });
        setFormData({
          name: currentSession.name || '',
          email: currentSession.email || '',
          phone: currentSession.phone || '',
        });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleCopy = (text, type) => {
    if (!text) return;
    navigator.clipboard.writeText(String(text));
    setCopied(type);
    toast(`Copied ${type} to clipboard!`, 'info');
    setTimeout(() => setCopied(''), 2000);
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast('Full name is required', 'error');
      return;
    }

    setIsSaving(true);
    setTimeout(() => {
      const currentSession = storage.get(STORAGE_KEYS.session, null) || {};
      const updated = {
        ...currentSession,
        name: formData.name.trim(),
        phone: formData.phone.trim(),
      };
      storage.set(STORAGE_KEYS.session, updated);
      setSession(updated);
      setUser((prev) => ({
        ...prev,
        name: formData.name.trim(),
        phone: formData.phone.trim(),
      }));
      setIsSaving(false);
      toast('Profile updated successfully!', 'success');
      window.dispatchEvent(new Event('storage'));
    }, 400);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Loader2 className="h-9 w-9 animate-spin text-[#0284c7] mb-3" />
        <p className="text-sm font-medium text-slate-500">Loading profile from server...</p>
      </div>
    );
  }

  const roleName = user?.role?.name || (typeof user?.role === 'string' ? user.role : 'USER');
  const roleId = user?.role_id ?? user?.role?.id ?? 4;
  const userId = user?.id ?? '—';

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Account"
        title="My Profile"
        description="Authenticated user details"
      />

      {apiError && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 animate-fade-in-up">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold">Unable to connect to profile API:</span> {apiError}
          </div>
          <button
            type="button"
            onClick={() => fetchProfile(true)}
            className="text-xs font-semibold underline text-red-800 hover:text-red-950"
          >
            Retry
          </button>
        </div>
      )}

      {/* Next-Level Hero Identity Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#07192F] via-[#0B2545] to-[#12365F] p-6 sm:p-8 text-white shadow-xl shadow-slate-900/10">
        {/* Subtle decorative glow overlays */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-sky-500/15 blur-3xl" />
        <div className="pointer-events-none absolute right-1/3 -bottom-20 h-48 w-48 rounded-full bg-blue-600/15 blur-2xl" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="relative">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#0284c7] via-[#0ea5e9] to-[#38bdf8] text-2xl font-bold text-white shadow-lg shadow-sky-500/30 ring-4 ring-white/10">
                {initials(user?.name || user?.email || 'User')}
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#07192F] ring-2 ring-white/20">
                <span className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl font-bold tracking-tight text-white capitalize">
                  {user?.name || 'Authenticated User'}
                </h1>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-0.5 text-xs font-semibold text-sky-200 backdrop-blur-md border border-white/15 uppercase tracking-wide">
                  <Shield className="h-3.5 w-3.5 text-sky-400" />
                  {roleName}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-sm text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-slate-400" />
                  {user?.email}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(user?.email, 'email')}
                  className="inline-flex items-center text-slate-400 hover:text-white transition-colors"
                  title="Copy email"
                >
                  {copied === 'email' ? (
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-300/80">
                <span>•</span>
                <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                  <CheckCircle2 className="h-3 w-3" />
                  Active Account
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column: Personal Information Form */}
        <div className="space-y-6 lg:col-span-8">
          <Card className="p-6 sm:p-7 rounded-2xl border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] bg-white">
            <div className="flex items-center gap-3 pb-5 mb-5 border-b border-slate-100">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-[#0284c7]">
                <User className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-[17px] font-bold text-slate-800 tracking-tight">
                  Personal Information
                </h2>
                <p className="text-xs text-slate-500">
                  Manage your official profile details and communication contact.
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <Input
                  label="Full Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  leftIcon={<User className="w-4 h-4 text-slate-400" />}
                  placeholder="Enter your full name"
                  className="h-[46px] rounded-xl border-slate-200 focus:border-[#0284c7] focus:ring-[#0284c7]/20"
                />

                <Input
                  label="Email Address"
                  type="email"
                  value={formData.email}
                  disabled
                  leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
                  hint="Official login identifier"
                  className="h-[46px] rounded-xl border-slate-200 bg-slate-50 text-slate-600 cursor-not-allowed"
                />

                <Input
                  label="Phone / Mobile"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  leftIcon={<Phone className="w-4 h-4 text-slate-400" />}
                  placeholder="Enter your phone number"
                  className="h-[46px] rounded-xl border-slate-200 focus:border-[#0284c7] focus:ring-[#0284c7]/20"
                />

                <Input
                  label="Assigned Role"
                  value={roleName}
                  disabled
                  leftIcon={<Shield className="w-4 h-4 text-slate-400" />}
                  className="h-[46px] rounded-xl border-slate-200 bg-slate-50 text-slate-600 font-semibold cursor-not-allowed"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-2 h-[44px] px-6 text-sm font-semibold rounded-xl bg-[#0284c7] hover:bg-[#0369a1] text-white shadow-[0_4px_14px_rgba(2,132,199,0.3)] hover:shadow-[0_6px_20px_rgba(2,132,199,0.4)] transition-all"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? 'Saving...' : 'Save Profile Changes'}
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Right Column: Role Capabilities & Security Overview */}
        <div className="space-y-6 lg:col-span-4">
          {/* Workspace Access & Permissions Card */}
          <Card className="p-6 rounded-2xl border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] bg-white">
            <div className="flex items-center gap-3 pb-4 mb-4 border-b border-slate-100">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-[#0284c7]">
                <Layers className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-[15px] font-bold text-slate-800 tracking-tight">
                  Workspace Access
                </h3>
                <p className="text-xs text-slate-400">Permissions for {roleName}</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="font-medium text-slate-700">Quotations & Drafts</span>
                <span className="font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                  Read Access
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="font-medium text-slate-700">Project Directory</span>
                <span className="font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                  Enabled
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="font-medium text-slate-700">Rates & Masters</span>
                <span className="font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  View Only
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="font-medium text-slate-700">System Administration</span>
                <span className="font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                  Admin Tier
                </span>
              </div>
            </div>
          </Card>

          {/* Account Credential Notice */}
          <Card className="p-5 rounded-2xl border border-slate-200/80 bg-gradient-to-b from-slate-50/80 to-slate-100/40">
            <div className="flex items-center gap-2 mb-2 text-slate-800">
              <Lock className="w-4 h-4 text-[#0284c7]" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Security & Credentials
              </h4>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed mb-3">
              To change your password, update official email, or request role upgrades, please contact your MK Construction administrator.
            </p>
            <a
              href="mailto:support@mkconstruction.site"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0284c7] hover:text-[#0369a1] transition-colors"
            >
              <span>Contact Administrator</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </Card>
        </div>
      </div>
    </div>
  );
}
