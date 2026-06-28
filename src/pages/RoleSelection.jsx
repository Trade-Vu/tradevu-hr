import React, { useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Users, Briefcase, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function RoleSelection() {
  const { user, changeViewMode } = useAuth();
  const navigate = useNavigate();

  // If they somehow reached here without being an active admin, auto-redirect
  useEffect(() => {
    if (user) {
      const isSuperAdmin = user.role === 'SUPER_ADMIN' || user.is_organization_owner;
      const isAdmin = user.role?.includes('ADMIN') || user.role === 'admin' || isSuperAdmin;
      const isEmployeeActive = user.employee?.employmentStatus === 'ACTIVE';
      const hasDualRoles = isSuperAdmin || (isAdmin && isEmployeeActive);
      
      if (!hasDualRoles) {
        changeViewMode('EMPLOYEE');
        navigate('/employeeselfservice', { replace: true });
      }
    }
  }, [user, navigate, changeViewMode]);

  const handleSelect = (mode) => {
    changeViewMode(mode);
    if (mode === 'ADMIN') {
      navigate('/', { replace: true });
    } else {
      navigate('/employeeselfservice', { replace: true });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <img src="/logo-icon.png" alt="TradeVu Logo" className="w-16 h-auto mx-auto mb-6" />
          <h1 className="text-4xl font-bold text-slate-900 mb-3 tracking-tight">Select your view</h1>
          <p className="text-lg text-slate-500">Choose how you want to use TradeVu today.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Admin Panel Card */}
          <div 
            onClick={() => handleSelect('ADMIN')}
            className="group cursor-pointer bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all text-left flex flex-col h-full relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all duration-300">
              <ChevronRight className="w-6 h-6 text-slate-400" />
            </div>
            
            <div className="w-14 h-14 bg-slate-900 rounded-xl flex items-center justify-center mb-6">
              <Users className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">Admin Panel</h2>
            <p className="text-slate-500 mb-8 flex-grow">
              Access the full administrative dashboard to manage employees, process payroll, review approvals, and configure organization settings.
            </p>
            <Button className="w-full bg-slate-100 text-slate-900 hover:bg-slate-200" variant="secondary">
              Enter Admin Panel
            </Button>
          </div>

          {/* Employee Portal Card */}
          <div 
            onClick={() => handleSelect('EMPLOYEE')}
            className="group cursor-pointer bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all text-left flex flex-col h-full relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all duration-300">
              <ChevronRight className="w-6 h-6 text-slate-400" />
            </div>
            
            <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
              <Briefcase className="w-7 h-7 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">Employee Portal</h2>
            <p className="text-slate-500 mb-8 flex-grow">
              Access your personal self-service dashboard to request leave, view your profile, manage tasks, and check your training courses.
            </p>
            <Button className="w-full bg-slate-100 text-slate-900 hover:bg-slate-200" variant="secondary">
              Enter Employee Portal
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
