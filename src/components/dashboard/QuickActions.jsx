import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { UserPlus, FileText, BarChart3, Users } from "lucide-react";

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
  blue: "from-blue-500 to-blue-600",
  indigo: "from-indigo-500 to-indigo-600",
  purple: "from-purple-500 to-purple-600",
  green: "from-green-500 to-green-600",
};

export default function QuickActions() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {actions.map((action) => (
        <Link key={action.title} to={action.url}>
          <Card className="border-slate-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer group">
            <CardContent className="p-6">
              <div className={`w-12 h-12 bg-gradient-to-br ${colorClasses[action.color]} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <action.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">{action.title}</h3>
              <p className="text-sm text-slate-500">{action.description}</p>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}