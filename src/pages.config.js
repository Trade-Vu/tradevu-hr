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
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: Layout,
};