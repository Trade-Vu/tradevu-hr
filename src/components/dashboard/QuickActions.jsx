import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { UserPlus, FileText, BarChart3, Users } from "lucide-react";
import { motion } from "framer-motion";

const actions = [
  {
    title: "Add New Hire",
    description: "Onboard a new employee",
    icon: UserPlus,
    url: createPageUrl("Employees?action=add"),
    color: "blue",
  },
  {
    title: "Create Template",
    description: "Build onboarding template",
    icon: FileText,
    url: createPageUrl("Templates?action=add"),
    color: "indigo",
  },
  {
    title: "View Analytics",
    description: "Check performance metrics",
    icon: BarChart3,
    url: createPageUrl("Analytics"),
    color: "purple",
  },
  {
    title: "Manage Employees",
    description: "View all employees",
    icon: Users,
    url: createPageUrl("Employees"),
    color: "green",
  },
];

const colorClasses = {
  blue: { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-100" },
  indigo: { bg: "bg-indigo-50", text: "text-indigo-600", border: "border-indigo-100" },
  purple: { bg: "bg-purple-50", text: "text-purple-600", border: "border-purple-100" },
  green: { bg: "bg-green-50", text: "text-green-600", border: "border-green-100" },
};

export default function QuickActions() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {actions.map((action, i) => {
        const colors = colorClasses[action.color] || colorClasses.blue;
        return (
          <Link key={action.title} to={action.url}>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card className="h-full border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer group bg-white rounded-xl">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className={`w-10 h-10 shrink-0 rounded-lg flex items-center justify-center border ${colors.bg} ${colors.border}`}>
                    <action.icon className={`w-5 h-5 ${colors.text} group-hover:scale-110 transition-transform duration-300`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors">{action.title}</h3>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{action.description}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </Link>
        );
      })}
    </div>
  );
}