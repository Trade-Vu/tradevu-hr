import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import Templates from './pages/Templates';
import EmployeeDetail from './pages/EmployeeDetail';
import Analytics from './pages/Analytics';
import EmployeePortal from './pages/EmployeePortal';
import Training from './pages/Training';
import Evaluations from './pages/Evaluations';
import Attendance from './pages/Attendance';
import Payroll from './pages/Payroll';
import HRLetters from './pages/HRLetters';
import Recruitment from './pages/Recruitment';
import Expenses from './pages/Expenses';
import Surveys from './pages/Surveys';
import OrganizationSetup from './pages/OrganizationSetup';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import TaskManager from './pages/TaskManager';
import LeaveManagement from './pages/LeaveManagement';
import Chat from './pages/Chat';
import CompanyWall from './pages/CompanyWall';
import Loans from './pages/Loans';
import Assets from './pages/Assets';
import Organogram from './pages/Organogram';
import AllLeaveRequests from './pages/AllLeaveRequests';
import Offboarding from './pages/Offboarding';
import HRAssistant from './pages/HRAssistant';
import EmployeeSelfService from './pages/EmployeeSelfService';
import ComplianceDashboard from './pages/ComplianceDashboard';
import AdvancedAnalytics from './pages/AdvancedAnalytics';
import PayrollAI from './pages/PayrollAI';
import Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Employees": Employees,
    "Templates": Templates,
    "EmployeeDetail": EmployeeDetail,
    "Analytics": Analytics,
    "EmployeePortal": EmployeePortal,
    "Training": Training,
    "Evaluations": Evaluations,
    "Attendance": Attendance,
    "Payroll": Payroll,
    "HRLetters": HRLetters,
    "Recruitment": Recruitment,
    "Expenses": Expenses,
    "Surveys": Surveys,
    "OrganizationSetup": OrganizationSetup,
    "Settings": Settings,
    "Profile": Profile,
    "TaskManager": TaskManager,
    "LeaveManagement": LeaveManagement,
    "Chat": Chat,
    "CompanyWall": CompanyWall,
    "Loans": Loans,
    "Assets": Assets,
    "Organogram": Organogram,
    "AllLeaveRequests": AllLeaveRequests,
    "Offboarding": Offboarding,
    "HRAssistant": HRAssistant,
    "EmployeeSelfService": EmployeeSelfService,
    "ComplianceDashboard": ComplianceDashboard,
    "AdvancedAnalytics": AdvancedAnalytics,
    "PayrollAI": PayrollAI,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: Layout,
};