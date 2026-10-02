import React, { useState } from "react";
import { gqlClient } from "@/api/graphqlClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Briefcase, Users, Upload, Eye, CheckCircle, XCircle, Clock, Star } from "lucide-react";
import { format } from "date-fns";
import ApplicantsList from "@/components/recruitment/ApplicantsList";
import CreateJobPostForm from "@/components/recruitment/CreateJobPostForm";

export default function Recruitment() {
  const queryClient = useQueryClient();
  const [showJobForm, setShowJobForm] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [uploadingCV, setUploadingCV] = useState(false);

  const { data: jobs = [] } = useQuery({
    queryKey: ['job-postings'],
    queryFn: async () => [],
    initialData: [],
  });

  const { data: applicants = [] } = useQuery({
    queryKey: ['applicants'],
    queryFn: async () => [],
    initialData: [],
  });

  const createJobMutation = useMutation({
    mutationFn: async (data) => {
      console.log("Mock create job", data);
      return {
        ...data,
        id: `job_${Date.now()}`,
        posted_date: new Date().toISOString().split('T')[0],
        applicants_count: 0,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-postings'] });
      setShowJobForm(false);
      setJobFormData({
        job_title: '',
        department: '',
        location: '',
        employment_type: 'full_time',
        salary_range: '',
        description: '',
        requirements: '',
        responsibilities: '',
        status: 'draft',
        published_to: [],
      });
    },
  });

  const handleCVUpload = async (jobId, file) => {
    setUploadingCV(true);
    try {
      const file_url = URL.createObjectURL(file);
      
      const cvData = {
        status: "success",
        output: {
          full_name: "Mock Applicant",
          email: "mock@example.com",
          phone: "1234567890",
          experience_years: 5,
          skills: ["React", "JavaScript"],
          education: "BSc Computer Science",
        }
      };

      if (cvData.status === "success") {
        const job = jobs.find(j => j.id === jobId) || { job_title: "Mock Job" };
        
        const aiAnalysis = {
          score: 85,
          summary: "Strong candidate with relevant experience."
        };

        // Mock create applicant
        console.log("Mock create applicant", {
          job_posting_id: jobId,
          full_name: cvData.output.full_name,
          email: cvData.output.email,
          phone: cvData.output.phone,
          cv_url: file_url,
          experience_years: cvData.output.experience_years,
          status: 'new',
          ai_score: aiAnalysis.score,
          ai_summary: aiAnalysis.summary,
          source: 'direct',
          application_date: new Date().toISOString().split('T')[0],
        });

        queryClient.invalidateQueries({ queryKey: ['applicants'] });
      }
    } catch (error) {
      console.error("Error processing CV:", error);
    }
    setUploadingCV(false);
  };

  const updateApplicantStatus = useMutation({
    mutationFn: async ({ id, status }) => {
      console.log("Mock update applicant status", id, status);
      return { id, status };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applicants'] });
    },
  });

  const activeJobs = jobs.filter(j => j.status === 'active').length;
  const totalApplicants = applicants.length;
  const shortlisted = applicants.filter(a => a.status === 'shortlisted' || a.status === 'interview_scheduled').length;

  const statusConfig = {
    new: { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Clock },
    reviewed: { color: 'bg-purple-100 text-purple-700 border-purple-200', icon: Eye },
    shortlisted: { color: 'bg-green-100 text-green-700 border-green-200', icon: Star },
    interview_scheduled: { color: 'bg-orange-100 text-orange-700 border-orange-200', icon: Clock },
    offered: { color: 'bg-teal-100 text-teal-700 border-teal-200', icon: CheckCircle },
    hired: { color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle },
    rejected: { color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm mb-4">
              <UserPlus className="w-4 h-4 text-indigo-600" />
              <span className="text-sm font-medium text-slate-700">Recruitment Management</span>
            </div>
            
            <p className="text-lg text-slate-600">
              Manage job postings and track applicants
            </p>
          </div>
          <Button 
            onClick={() => setShowJobForm(!showJobForm)}
            className="bg-gradient-to-r from-indigo-600 to-blue-600"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Post New Job
          </Button>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6">
          <Card className="border-slate-200">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="bg-indigo-100 p-3 rounded-xl">
                  <Briefcase className="w-6 h-6 text-indigo-600" />
                </div>
              </div>
              <div className="text-3xl font-bold text-slate-900 mb-1">{activeJobs}</div>
              <div className="text-sm text-slate-600">Active Jobs</div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="bg-blue-100 p-3 rounded-xl">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div className="text-3xl font-bold text-slate-900 mb-1">{totalApplicants}</div>
              <div className="text-sm text-slate-600">Total Applicants</div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="bg-green-100 p-3 rounded-xl">
                  <Star className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <div className="text-3xl font-bold text-slate-900 mb-1">{shortlisted}</div>
              <div className="text-sm text-slate-600">Shortlisted</div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="bg-purple-100 p-3 rounded-xl">
                  <CheckCircle className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <div className="text-3xl font-bold text-slate-900 mb-1">
                {applicants.filter(a => a.status === 'hired').length}
              </div>
              <div className="text-sm text-slate-600">Hired</div>
            </CardContent>
          </Card>
        </div>

        {/* Job Form */}
        {showJobForm && (
          <CreateJobPostForm
            onSubmit={(data) => createJobMutation.mutate(data)}
            onCancel={() => setShowJobForm(false)}
            isPending={createJobMutation.isPending}
          />
        )}

        {/* Main Content */}
        <Tabs defaultValue="jobs" className="space-y-6">
          <TabsList className="bg-slate-100 p-1 rounded-xl h-auto inline-flex border border-slate-200/70">
            <TabsTrigger
              value="jobs"
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm"
            >
              <Briefcase className="w-4 h-4" />
              <span>Job Postings</span>
              <span className="ml-1.5 px-2 py-0.5 text-xs rounded-full bg-slate-200/70 text-slate-700 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
                {jobs.length}
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="applicants"
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm"
            >
              <Users className="w-4 h-4" />
              <span>Applicants</span>
              <span className="ml-1.5 px-2 py-0.5 text-xs rounded-full bg-slate-200/70 text-slate-700 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
                {applicants.length}
              </span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="jobs" className="focus-visible:outline-none">
            <div className="grid md:grid-cols-2 gap-6">
              {jobs.map(job => (
                <Card key={job.id} className="border-slate-200 hover:shadow-lg transition-shadow">
                  <CardHeader className="border-b border-slate-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl mb-1">{job.job_title}</CardTitle>
                        <p className="text-sm text-slate-600">{job.department}</p>
                      </div>
                      <Badge variant="outline" className={
                        job.status === 'active' ? 'bg-green-100 text-green-700 border-green-200' :
                        job.status === 'draft' ? 'bg-slate-100 text-slate-700 border-slate-200' :
                        'bg-orange-100 text-orange-700 border-orange-200'
                      }>
                        {job.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <p className="text-sm text-slate-600 mb-4 line-clamp-3">{job.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500">
                        {applicants.filter(a => a.job_posting_id === job.id).length} applicants
                      </span>
                      <div className="flex gap-2">
                        <input
                          type="file"
                          id={`cv-${job.id}`}
                          accept=".pdf,.doc,.docx"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleCVUpload(job.id, e.target.files[0]);
                            }
                          }}
                          className="hidden"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => document.getElementById(`cv-${job.id}`).click()}
                          disabled={uploadingCV}
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          {uploadingCV ? "Processing..." : "Upload CV"}
                        </Button>
                        <Button size="sm" onClick={() => setSelectedJob(job)}>
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="applicants" className="focus-visible:outline-none">
            <ApplicantsList
              applicants={applicants}
              jobs={jobs}
              statusConfig={statusConfig}
              onUpdateStatus={(id, status) =>
                updateApplicantStatus.mutate({ id, status })
              }
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}