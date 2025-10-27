import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Video, CheckCircle, Clock, Award } from "lucide-react";

export default function TrainingStats({ totalVideos, completedVideos, totalTimeSpent, overallProgress }) {
  return (
    <Card className="border-slate-200 shadow-xl overflow-hidden">
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">Your Learning Progress</h2>
            <p className="text-purple-100">Keep up the great work!</p>
          </div>
          <div className="text-4xl font-bold">{overallProgress}%</div>
        </div>
        <Progress value={overallProgress} className="h-3 bg-purple-400" />
      </div>
      <CardContent className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Video className="w-6 h-6 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{totalVideos}</div>
            <div className="text-sm text-slate-600">Total Videos</div>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-green-600">{completedVideos}</div>
            <div className="text-sm text-slate-600">Completed</div>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{totalTimeSpent}</div>
            <div className="text-sm text-slate-600">Minutes Watched</div>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Award className="w-6 h-6 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{totalVideos - completedVideos}</div>
            <div className="text-sm text-slate-600">In Progress</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}