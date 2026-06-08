import re

with open('src/Layout.jsx', 'r') as f:
    content = f.read()

# 1. Add Moon, Sun to lucide-react imports
content = re.sub(
    r'BookOpen\n} from "lucide-react";',
    'BookOpen,\n  Moon,\n  Sun\n} from "lucide-react";',
    content
)

# 2. Modify NavMenuItem signature to accept theme
content = content.replace('function NavMenuItem({ item, location }) {', 'function NavMenuItem({ item, location, theme }) {\n  const isDark = theme === "dark";\n  const textClass = isDark ? "text-slate-400" : "text-slate-600";\n  const hoverClass = isDark ? "hover:bg-white/5 hover:text-slate-200" : "hover:bg-purple-50 hover:text-purple-700";\n  const activeClass = isDark ? "bg-indigo-500/20 text-indigo-300 font-medium shadow-sm" : "bg-purple-50 text-purple-700 font-medium shadow-sm";')

# 3. Modify NavMenuItem link rendering (Collapsible Trigger)
content = re.sub(
    r'<SidebarMenuButton className="hover:bg-purple-50 hover:text-purple-700 transition-all duration-200 rounded-lg mb-1 text-slate-600">',
    r'<SidebarMenuButton className={`transition-all duration-200 rounded-lg mb-1 ${textClass} ${hoverClass}`}>',
    content
)

# 4. Modify NavMenuItem link rendering (Collapsible Child)
content = re.sub(
    r'className={`flex items-center gap-3 px-3 py-2 hover:bg-purple-50 hover:text-purple-700 transition-all duration-200 rounded-lg \${\n\s+location\.pathname === child\.url \? \'bg-purple-50 text-purple-700 font-medium shadow-sm\' : \'text-slate-600\'\n\s+}`}',
    r'className={`flex items-center gap-3 px-3 py-2 transition-all duration-200 rounded-lg ${location.pathname === child.url ? activeClass : `${textClass} ${hoverClass}`}`}',
    content
)

# 5. Modify NavMenuItem link rendering (Direct item)
content = re.sub(
    r'className={`flex items-center gap-3 px-3 py-2\.5 hover:bg-purple-50 hover:text-purple-700 transition-all duration-200 rounded-lg \${\n\s+location\.pathname === item\.url \? \'bg-purple-50 text-purple-700 font-medium shadow-sm\' : \'text-slate-600\'\n\s+}`}',
    r'className={`flex items-center gap-3 px-3 py-2.5 transition-all duration-200 rounded-lg ${location.pathname === item.url ? activeClass : `${textClass} ${hoverClass}`}`}',
    content
)

# 6. Add theme state to Layout
content = content.replace(
    'const [organization, setOrganization] = useState(null);',
    'const [organization, setOrganization] = useState(null);\n  const [theme, setTheme] = useState(() => localStorage.getItem("sidebarTheme") || "dark");\n\n  useEffect(() => {\n    localStorage.setItem("sidebarTheme", theme);\n  }, [theme]);\n\n  const toggleTheme = () => setTheme(prev => prev === "dark" ? "light" : "dark");\n  const isDark = theme === "dark";'
)

# 7. Modify Layout Sidebar props
content = content.replace(
    '<Sidebar className="border-r border-slate-200 bg-white">',
    '<Sidebar className={`border-r ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>'
)

# 8. Modify Layout SidebarHeader props
content = content.replace(
    '<SidebarHeader className="border-b border-slate-200 p-6">',
    '<SidebarHeader className={`border-b p-6 ${isDark ? "border-slate-800" : "border-slate-200"}`}>'
)

# 9. Modify Logo src
content = content.replace(
    'src="/logo-icon.png"',
    'src={isDark ? "/logo-icon-white.png" : "/logo-icon.png"}'
)

# 10. Modify Layout Tradevu text
content = content.replace(
    '<h2 className="font-bold text-slate-900 text-lg leading-tight">Tradevu</h2>',
    '<h2 className={`font-bold text-lg leading-tight ${isDark ? "text-white" : "text-slate-900"}`}>Tradevu</h2>'
)

content = content.replace(
    '<SidebarGroupLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3 mb-2">',
    '<SidebarGroupLabel className={`text-xs font-semibold uppercase tracking-wider px-4 py-3 mb-2 ${isDark ? "text-slate-500" : "text-slate-500"}`}>'
)

# 11. Pass theme to NavMenuItem
content = content.replace(
    '<NavMenuItem key={item.title} item={item} location={location} />',
    '<NavMenuItem key={item.title} item={item} location={location} theme={theme} />'
)

# 12. Modify Settings link
content = re.sub(
    r'<SidebarMenuButton \n\s+asChild \n\s+className={`hover:bg-purple-50 hover:text-purple-700 transition-all duration-200 rounded-lg mb-1 \${\n\s+location\.pathname === createPageUrl\("Settings"\) \? \'bg-purple-50 text-purple-700 font-medium shadow-sm\' : \'text-slate-600\'\n\s+}`}',
    r'<SidebarMenuButton asChild className={`transition-all duration-200 rounded-lg mb-1 ${location.pathname === createPageUrl("Settings") ? (isDark ? "bg-indigo-500/20 text-indigo-300 font-medium shadow-sm" : "bg-purple-50 text-purple-700 font-medium shadow-sm") : (isDark ? "text-slate-400 hover:bg-white/5 hover:text-slate-200" : "text-slate-600 hover:bg-purple-50 hover:text-purple-700")}`}',
    content
)

# 13. Modify SidebarFooter
content = content.replace(
    '<SidebarFooter className="border-t border-slate-200 p-4">',
    '<SidebarFooter className={`border-t p-4 flex flex-col gap-2 ${isDark ? "border-slate-800" : "border-slate-200"}`}>'
)

# Add theme toggle button before the user dropdown in SidebarFooter
toggle_button = """
            <Button 
              variant="ghost" 
              onClick={toggleTheme}
              className={`w-full justify-start gap-3 mb-2 ${isDark ? "text-slate-400 hover:text-slate-200 hover:bg-white/5" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              <span className="font-medium text-sm">{isDark ? "Light Mode" : "Dark Mode"}</span>
            </Button>
"""
content = content.replace(
    '<DropdownMenu>',
    toggle_button + '\n            <DropdownMenu>'
)

# Modify Dropdown trigger button classes
content = content.replace(
    '<Button variant="ghost" className="w-full justify-start gap-3 hover:bg-slate-100">',
    '<Button variant="ghost" className={`w-full justify-start gap-3 h-12 ${isDark ? "hover:bg-white/5" : "hover:bg-slate-100"}`}>'
)

# Modify user text inside dropdown trigger
content = content.replace(
    '<p className="font-medium text-slate-900 text-sm truncate">',
    '<p className={`font-medium text-sm truncate ${isDark ? "text-slate-200" : "text-slate-900"}`}>'
)

with open('src/Layout.jsx', 'w') as f:
    f.write(content)
