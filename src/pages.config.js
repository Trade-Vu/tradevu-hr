import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import Templates from './pages/Templates';
import EmployeeDetail from './pages/EmployeeDetail';
import Analytics from './pages/Analytics';
import EmployeePortal from './pages/EmployeePortal';
import Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Employees": Employees,
    "Templates": Templates,
    "EmployeeDetail": EmployeeDetail,
    "Analytics": Analytics,
    "EmployeePortal": EmployeePortal,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: Layout,
};