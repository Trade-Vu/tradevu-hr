import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Video, Play, CheckCircle, Clock, Award, BookOpen, TrendingUp } from "lucide-react";
import PlatformCard from "../components/training/PlatformCard";
import VideoPlayer from "../components/training/VideoPlayer";
import TrainingStats from "../components/training/TrainingStats";

export default function Training() {
  const [user, setUser] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        
        const employees = await base44.entities.Employee.filter({ email: currentUser.email });
        if (employees.length > 0) {
          setEmployee(employees[0]);
        }
      } catch (error) {
        console.error("Error loading user:", error);
      }
    };
    loadUser();
  }, []);

  const { data: platforms = [], isLoading: loadingPlatforms } = useQuery({
    queryKey: ['training-platforms'],
    queryFn: () => base44.entities.TrainingPlatform.list(),
    initialData: [],
  });

  const { data: videos = [], isLoading: loadingVideos } = useQuery({
    queryKey: ['training-videos'],
    queryFn: () => base44.entities.TrainingVideo.list('order'),
    initialData: [],
  });

  const { data: progress = [], isLoading: loadingProgress } = useQuery({
    queryKey: ['video-progress', employee?.id],
    queryFn: () => base44.entities.VideoProgress.filter({ employee_id: employee.id }),
    enabled: !!employee,
    initialData: [],
  });

  const getVideoProgress = (videoId) => {
    return progress.find(p => p.video_id === videoId) || null;
  };

  const getPlatformProgress = (platformId) => {
    const platformVideos = videos.filter(v => v.platform_id === platformId);
    if (platformVideos.length === 0) return 0;
    
    const completedCount = platformVideos.filter(v => {
      const prog = getVideoProgress(v.id);
      return prog?.completed;
    }).length;
    
    return Math.round((completedCount / platformVideos.length) * 100);
  };

  const totalVideos = videos.length;
  const completedVideos = progress.filter(p => p.completed).length;
  const totalTimeSpent = progress.reduce((sum, p) => sum + (p.time_spent_minutes || 0), 0);
  const overallProgress = totalVideos > 0 ? Math.round((completedVideos / totalVideos) * 100) : 0;

  const categoryFilters = ['all', 'technical', 'soft_skills', 'compliance', 'product', 'tools', 'leadership'];
  const [categoryFilter, setCategoryFilter] = useState('all');

  const filteredPlatforms = categoryFilter === 'all' 
    ? platforms 
    : platforms.filter(p => p.category === categoryFilter);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm mb-4">
            <Video className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium text-slate-700">Learning Management System</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-3">
            Training Center
          </h1>
          <p className="text-lg text-slate-600">
            Expand your skills with our comprehensive training library
          </p>
        </div>

        {/* Overall Stats */}
        {employee && (
          <TrainingStats
            totalVideos={totalVideos}
            completedVideos={completedVideos}
            totalTimeSpent={totalTimeSpent}
            overallProgress={overallProgress}
          />
        )}

        {/* Main Content */}
        {selectedVideo ? (
          <VideoPlayer
            video={selectedVideo}
            platform={selectedPlatform}
            employeeId={employee?.id}
            currentProgress={getVideoProgress(selectedVideo.id)}
            onBack={() => setSelectedVideo(null)}
            allVideos={videos.filter(v => v.platform_id === selectedPlatform?.id)}
            onVideoSelect={setSelectedVideo}
          />
        ) : selectedPlatform ? (
          <Card className="border-slate-200 shadow-xl">
            <CardHeader className="border-b border-slate-200 bg-gradient-to-r from-purple-50 to-blue-50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl mb-2">{selectedPlatform.name}</CardTitle>
                  <p className="text-slate-600">{selectedPlatform.description}</p>
                </div>
                <Button variant="outline" onClick={() => setSelectedPlatform(null)}>
                  Back to Platforms
                </Button>
              </div>
              {employee && (
                <div className="mt-4">
                  <div className="flex justify-between text-sm text-slate-600 mb-2">
                    <span>Your Progress</span>
                    <span className="font-semibold">{getPlatformProgress(selectedPlatform.id)}%</span>
                  </div>
                  <Progress value={getPlatformProgress(selectedPlatform.id)} className="h-2" />
                </div>
              )}
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                {videos
                  .filter(v => v.platform_id === selectedPlatform.id)
                  .map((video, index) => {
                    const videoProgress = getVideoProgress(video.id);
                    const isCompleted = videoProgress?.completed;
                    
                    return (
                      <div
                        key={video.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                          isCompleted ? 'bg-green-50 border-green-200' : 'bg-white border-slate-200'
                        }`}
                        onClick={() => setSelectedVideo(video)}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            isCompleted ? 'bg-green-100' : 'bg-purple-100'
                          }`}>
                            {isCompleted ? (
                              <CheckCircle className="w-6 h-6 text-green-600" />
                            ) : (
                              <Play className="w-6 h-6 text-purple-600" />
                            )}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-slate-900 mb-1">
                              {index + 1}. {video.title}
                            </h3>
                            {video.description && (
                              <p className="text-sm text-slate-600 mb-2">{video.description}</p>
                            )}
                            <div className="flex items-center gap-3 text-sm text-slate-500">
                              {video.duration_minutes && (
                                <span className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  {video.duration_minutes} min
                                </span>
                              )}
                              {videoProgress && videoProgress.progress_percentage > 0 && !isCompleted && (
                                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                  {videoProgress.progress_percentage}% watched
                                </Badge>
                              )}
                              {isCompleted && (
                                <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">
                                  Completed
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Category Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {categoryFilters.map(cat => (
                <Button
                  key={cat}
                  variant={categoryFilter === cat ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCategoryFilter(cat)}
                  className="whitespace-nowrap"
                >
                  {cat.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Button>
              ))}
            </div>

            {/* Platforms Grid */}
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Training Platforms</h2>
              {loadingPlatforms ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array(6).fill(0).map((_, i) => (
                    <div key={i} className="h-64 bg-white rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : filteredPlatforms.length === 0 ? (
                <Card className="border-slate-200">
                  <CardContent className="p-12 text-center">
                    <Video className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                    <p className="text-slate-500">No training platforms available</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredPlatforms.map(platform => (
                    <PlatformCard
                      key={platform.id}
                      platform={platform}
                      progress={getPlatformProgress(platform.id)}
                      videoCount={videos.filter(v => v.platform_id === platform.id).length}
                      onClick={() => setSelectedPlatform(platform)}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}