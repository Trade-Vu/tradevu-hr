import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

const colorClasses = {
  blue: { text: "text-blue-600", bg: "bg-blue-50" },
  green: { text: "text-green-600", bg: "bg-green-50" },
  orange: { text: "text-orange-600", bg: "bg-orange-50" },
  purple: { text: "text-purple-600", bg: "bg-purple-50" },
};

export default function StatsCard({ title, value, icon: Icon, color = "blue", trend, isLoading }) {
  if (isLoading) {
    return (
      <Card className="border-slate-200/60 shadow-sm rounded-xl overflow-hidden animate-pulse bg-white">
        <CardContent className="p-5">
          <div className="flex justify-between items-start mb-4">
            <div className="w-9 h-9 bg-slate-100 rounded-lg"></div>
            <div className="w-20 h-6 bg-slate-100 rounded-full"></div>
          </div>
          <div>
            <div className="h-3 bg-slate-100 rounded w-24 mb-3"></div>
            <div className="h-8 bg-slate-100 rounded w-16"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const colors = colorClasses[color] || colorClasses.blue;

  return (
    <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
      <Card className="h-full relative overflow-hidden border-slate-200/60 bg-white shadow-sm hover:shadow-md transition-shadow duration-300 rounded-xl group">
        <CardContent className="p-5">
          <div className="flex justify-between items-start mb-4">
            <div className={`p-2 rounded-lg ${colors.bg}`}>
              <Icon className={`w-5 h-5 ${colors.text}`} />
            </div>
            {trend && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-100 text-xs font-medium text-slate-600">
                <TrendingUp className="w-3 h-3 text-slate-400" />
                {trend}
              </div>
            )}
          </div>
          <div>
            <h3 className="text-sm font-medium text-slate-500 mb-1 tracking-tight">{title}</h3>
            <p className="text-3xl font-bold text-slate-900 tracking-tight">{value}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}