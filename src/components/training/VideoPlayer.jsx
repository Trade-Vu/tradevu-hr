import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, CheckCircle, Play, Clock, ChevronRight } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

export default function VideoPlayer({ video, platform, employeeId, currentProgress, onBack, allVideos, onVideoSelect }) {
  const queryClient = useQueryClient();
  const [watchProgress, setWatchProgress] = useState(currentProgress?.progress_percentage || 0);
  const [canComplete, setCanComplete] = useState(currentProgress?.progress_percentage >= 80 || false);
  const [notes, setNotes] = useState("");
  const videoRef = useRef(null);

  useEffect(() => {
    // Simulate video progress tracking
    const interval = setInterval(() => {
      if (watchProgress < 100) {
        setWatchProgress(prev => {
          const newProgress = Math.min(prev + 5, 100);
          if (newProgress >= 80) {
            setCanComplete(true);
          }
          return newProgress;
        });
      }
    }, 3000); // Update every 3 seconds for demo

    return () => clearInterval(interval);
  }, [watchProgress]);

  const updateProgressMutation = useMutation({
    mutationFn: async (data) => {
      if (currentProgress) {
        return base44.entities.VideoProgress.update(currentProgress.id, data);
      } else {
        return base44.entities.VideoProgress.create({
          employee_id: employeeId,
          video_id: video.id,
          ...data,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['video-progress', employeeId] });
    },
  });

  const handleComplete = () => {
    updateProgressMutation.mutate({
      progress_percentage: 100,
      completed: true,
      last_watched_date: new Date().toISOString().split('T')[0],
      time_spent_minutes: (currentProgress?.time_spent_minutes || 0) + (video.duration_minutes || 10),
    });
  };

  const handleProgressUpdate = () => {
    updateProgressMutation.mutate({
      progress_percentage: watchProgress,
      last_watched_date: new Date().toISOString().split('T')[0],
      time_spent_minutes: (currentProgress?.time_spent_minutes || 0) + 5,
    });
  };

  // Extract video ID from URL
  const getVideoEmbedUrl = (url) => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const videoId = url.includes('youtu.be') 
        ? url.split('youtu.be/')[1]?.split('?')[0]
        : new URLSearchParams(new URL(url).search).get('v');
      return `https://www.youtube.com/embed/${videoId}`;
    }
    return url;
  };

  const currentIndex = allVideos.findIndex(v => v.id === video.id);
  const nextVideo = currentIndex < allVideos.length - 1 ? allVideos[currentIndex + 1] : null;

  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={onBack} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to {platform.name}
      </Button>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Video Player */}
        <div className="lg:col-span-2">
          <Card className="border-slate-200 shadow-xl">
            <CardContent className="p-0">
              <div className="aspect-video bg-black rounded-t-xl overflow-hidden">
                {video.video_url ? (
                  <iframe
                    ref={videoRef}
                    src={getVideoEmbedUrl(video.video_url)}
                    className="w-full h-full"
                    allowFullScreen
                    title={video.title}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white">
                    <div className="text-center">
                      <Play className="w-16 h-16 mx-auto mb-4" />
                      <p>Video player</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">{video.title}</h2>
                    {video.description && (
                      <p className="text-slate-600">{video.description}</p>
                    )}
                  </div>
                  {currentProgress?.completed && (
                    <Badge className="bg-green-100 text-green-700 border-green-200 ml-4">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Completed
                    </Badge>
                  )}
                </div>

                <div className="space-y-4">
                  {/* Watch Progress */}
                  {employeeId && (
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <div className="flex justify-between text-sm text-slate-600 mb-2">
                        <span className="font-medium">Your Progress</span>
                        <span className="font-semibold">{watchProgress}%</span>
                      </div>
                      <Progress value={watchProgress} className="h-2 mb-3" />
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={handleProgressUpdate}
                        >
                          Save Progress
                        </Button>
                        <Button 
                          size="sm"
                          onClick={handleComplete}
                          disabled={!canComplete || currentProgress?.completed}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          {canComplete ? 'Mark as Complete' : `Watch ${80 - watchProgress}% more to complete`}
                        </Button>
                      </div>
                      {!canComplete && (
                        <p className="text-xs text-slate-500 mt-2">
                          You need to watch at least 80% of the video to mark it as complete
                        </p>
                      )}
                    </div>
                  )}

                  {/* Video Details */}
                  {video.duration_minutes && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">{video.duration_minutes} minutes</span>
                    </div>
                  )}

                  {/* Notes */}
                  {employeeId && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Your Notes
                      </label>
                      <Textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Take notes while watching..."
                        rows={4}
                      />
                    </div>
                  )}

                  {/* Transcript */}
                  {video.transcript && (
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-2">Transcript</h3>
                      <div className="p-4 bg-slate-50 rounded-lg text-sm text-slate-600 max-h-64 overflow-y-auto">
                        {video.transcript}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Next Video */}
          {nextVideo && (
            <Card className="border-slate-200 shadow-lg mt-4">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Up Next</p>
                    <h3 className="font-semibold text-slate-900">{nextVideo.title}</h3>
                  </div>
                  <Button onClick={() => onVideoSelect(nextVideo)}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Playlist */}
        <div>
          <Card className="border-slate-200 shadow-lg sticky top-4">
            <CardHeader className="border-b border-slate-200">
              <CardTitle className="text-lg">Course Content</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[600px] overflow-y-auto">
                {allVideos.map((v, index) => {
                  const isCurrentVideo = v.id === video.id;
                  return (
                    <div
                      key={v.id}
                      className={`p-4 border-b border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors ${
                        isCurrentVideo ? 'bg-purple-50' : ''
                      }`}
                      onClick={() => onVideoSelect(v)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-semibold ${
                          isCurrentVideo ? 'bg-purple-600 text-white' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className={`font-medium text-sm ${isCurrentVideo ? 'text-purple-900' : 'text-slate-900'}`}>
                            {v.title}
                          </h4>
                          {v.duration_minutes && (
                            <p className="text-xs text-slate-500 mt-1">{v.duration_minutes} min</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}