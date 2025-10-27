import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Video, Lock, CheckCircle } from "lucide-react";

const categoryColors = {
  technical: "from-blue-500 to-blue-600",
  soft_skills: "from-green-500 to-green-600",
  compliance: "from-red-500 to-red-600",
  product: "from-purple-500 to-purple-600",
  tools: "from-orange-500 to-orange-600",
  leadership: "from-indigo-500 to-indigo-600",
};

export default function PlatformCard({ platform, progress, videoCount, onClick }) {
  const isCompleted = progress === 100;

  return (
    <Card 
      className="border-slate-200 hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-1"
      onClick={onClick}
    >
      <CardContent className="p-0">
        <div className={`h-32 bg-gradient-to-r ${categoryColors[platform.category] || 'from-slate-500 to-slate-600'} rounded-t-xl flex items-center justify-center relative overflow-hidden`}>
          <div className="absolute inset-0 bg-black/10" />
          <Video className="w-16 h-16 text-white z-10" />
          {platform.is_mandatory && (
            <Badge className="absolute top-3 right-3 bg-red-500 text-white border-0">
              <Lock className="w-3 h-3 mr-1" />
              Mandatory
            </Badge>
          )}
          {isCompleted && (
            <div className="absolute top-3 left-3 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
          )}
        </div>
        <div className="p-6">
          <h3 className="font-bold text-lg text-slate-900 mb-2">{platform.name}</h3>
          {platform.description && (
            <p className="text-sm text-slate-600 mb-4 line-clamp-2">{platform.description}</p>
          )}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">{videoCount} videos</span>
              {platform.total_duration_minutes && (
                <span className="text-slate-600">{platform.total_duration_minutes} min</span>
              )}
            </div>
            <div>
              <div className="flex justify-between text-sm text-slate-600 mb-1">
                <span>Progress</span>
                <span className="font-semibold">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
            <Badge variant="outline" className="capitalize">
              {platform.category.replace('_', ' ')}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}