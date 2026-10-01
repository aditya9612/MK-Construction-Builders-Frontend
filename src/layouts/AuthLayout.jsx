import { Outlet } from 'react-router-dom';
import { BrandLogo } from '../components/common/BrandLogo';
import { BarChart2, Folder, RefreshCw } from 'lucide-react';
import authBg from '../assets/brand/auth-bg.png';

export function AuthLayout() {
  return (
    <div className="h-screen w-full flex flex-col lg:flex-row bg-[#020b16] overflow-hidden">
      {/* Left Section - Branding / Visuals */}
      <div className="relative hidden lg:flex lg:w-5/12 xl:w-[55%] bg-[#020813] overflow-hidden flex-col justify-between p-8 xl:p-12 text-white">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img src={authBg} alt="Digital Blueprint" className="w-full h-full object-cover opacity-80 mix-blend-screen" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#020b16] via-transparent to-transparent"></div>
        </div>
        
        {/* Floating Badges */}
        <div className="absolute top-[35%] left-[15%] hidden xl:flex items-center gap-3 bg-[#0a1a30]/80 backdrop-blur-md border border-[#234568] px-4 py-2.5 rounded-lg shadow-lg animate-float" style={{ animationDelay: '0s' }}>
          <BarChart2 className="text-[#38bdf8] w-5 h-5" />
          <span className="text-xs font-bold tracking-widest text-white">ESTIMATION</span>
          <div className="w-1.5 h-1.5 rounded-full bg-[#38bdf8] shadow-[0_0_8px_#38bdf8] ml-2"></div>
        </div>

        <div className="absolute top-[45%] right-[10%] hidden xl:flex items-center gap-3 bg-[#0a1a30]/80 backdrop-blur-md border border-[#234568] px-4 py-2.5 rounded-lg shadow-lg animate-float" style={{ animationDelay: '2s' }}>
          <Folder className="text-[#38bdf8] w-5 h-5" />
          <span className="text-xs font-bold tracking-widest text-white">PROJECTS</span>
          <div className="w-1.5 h-1.5 rounded-full bg-[#38bdf8] shadow-[0_0_8px_#38bdf8] ml-2"></div>
        </div>

        <div className="absolute bottom-[35%] right-[20%] hidden xl:flex items-center gap-3 bg-[#0a1a30]/80 backdrop-blur-md border border-[#234568] px-4 py-2.5 rounded-lg shadow-lg animate-float" style={{ animationDelay: '1s' }}>
          <RefreshCw className="text-[#38bdf8] w-5 h-5" />
          <span className="text-xs font-bold tracking-widest text-white">LIVE SYNC</span>
          <div className="w-1.5 h-1.5 rounded-full bg-[#38bdf8] shadow-[0_0_8px_#38bdf8] ml-2"></div>
        </div>

        <div className="relative z-10 animate-fade-in-right">
          <BrandLogo variant="light" className="h-auto w-[180px] xl:w-[260px] max-w-full" />
          <div className="mt-4 xl:mt-6 inline-flex items-center rounded-full bg-white/10 px-3.5 py-1 text-[11px] font-semibold text-brand-light backdrop-blur-md border border-white/20">
            v2.0 Workspace
          </div>
        </div>

        <div className="relative z-10 max-w-lg animate-fade-in-right pb-10" style={{ animationDelay: '150ms', animationFillMode: 'both' }}>
          <h2 className="text-[32px] xl:text-[44px] font-bold tracking-tight text-white mb-4 xl:mb-6 leading-[1.1]">
            Build with precision,<br />scale with confidence.
          </h2>
          <p className="text-sm xl:text-base text-blue-100/70 leading-relaxed max-w-[400px]">
            The next-generation estimation and project management platform designed specifically for MK Construction.
          </p>
          
          <div className="mt-8 xl:mt-12 flex items-center gap-4">
            <div className="flex -space-x-3">
              <img className="h-10 w-10 rounded-full border-[3px] border-[#020b16]" src="https://i.pravatar.cc/100?img=1" alt="User" />
              <img className="h-10 w-10 rounded-full border-[3px] border-[#020b16]" src="https://i.pravatar.cc/100?img=2" alt="User" />
              <img className="h-10 w-10 rounded-full border-[3px] border-[#020b16]" src="https://i.pravatar.cc/100?img=3" alt="User" />
            </div>
            <div className="text-[13px] font-medium text-blue-100/70 leading-tight">
              <span className="text-white">Trusted by</span><br />our estimation team
            </div>
          </div>
        </div>
      </div>

      {/* Right Section - Form */}
      <div className="flex flex-1 items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-y-auto bg-[#f8fafc]">
        {/* Subtle background decorative shapes */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-50 rounded-bl-full opacity-70 -z-10 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-50/60 rounded-tr-full opacity-70 -z-10 pointer-events-none"></div>
        
        <div className="w-full max-w-[460px] relative z-10">
          <div className="lg:hidden mb-6 flex justify-center animate-fade-in-up" style={{ animationDelay: '100ms', animationFillMode: 'both' }}>
            <BrandLogo variant="dark" className="h-auto w-[160px] max-w-full" />
          </div>
          
          <div className="bg-white rounded-[24px] shadow-[0_12px_40px_rgba(0,0,0,0.06)] p-8 sm:p-10 relative animate-fade-in-up" style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
            <Outlet />
          </div>
          
          <div className="mt-8 text-center text-[13px] text-slate-400 font-medium">
            &copy; {new Date().getFullYear()} MK Construction. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  );
}
