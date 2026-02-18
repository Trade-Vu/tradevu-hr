import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Target,
  TrendingUp,
  Users,
  Award,
  Plus,
  Search,
  Calendar,
  Star,
  CheckCircle,
  Clock,
} from "lucide-react";

export default function Performance() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTab, setSelectedTab] = useState("overview");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: evaluations = [], isLoading } = useQuery({
    queryKey: ["evaluations"],
    queryFn: () => base44.entities.Evaluation.list("-created_date"),
  });

  const { data: employees = [] } = useQuery({
    queryKey: ["employees"],
    queryFn: () => base44.entities.Employee.list(),
  });

  const { data: trainingNeeds = [] } = useQuery({
    queryKey: ["trainingNeeds"],
    queryFn: () => base44.entities.TrainingNeed.list(),
  });

  const [newEvaluation, setNewEvaluation] = useState({
    employee_id: "",
    evaluation_type: "manager",
    period: "",
    competencies: {
      communication: 0,
      teamwork: 0,
      problem_solving: 0,
      technical_skills: 0,
      leadership: 0,
    },
    strengths: "",
    areas_for_improvement: "",
    overall_rating: 0,
    document_url: "",
  });
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const createEvaluationMutation = useMutation({
    mutationFn: async (data) => {
      const user = await base44.auth.me();
      return base44.entities.Evaluation.create({
        ...data,
        evaluator_email: user.email,
        status: "draft",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["evaluations"] });
      setIsDialogOpen(false);
      setUploadedFile(null);
      setNewEvaluation({
        employee_id: "",
        evaluation_type: "manager",
        period: "",
        competencies: {
          communication: 0,
          teamwork: 0,
          problem_solving: 0,
          technical_skills: 0,
          leadership: 0,
        },
        strengths: "",
        areas_for_improvement: "",
        overall_rating: 0,
        document_url: "",
      });
    },
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      setNewEvaluation({ ...newEvaluation, document_url: result.file_url });
      setUploadedFile(file.name);
    } catch (error) {
      console.error("Error uploading file:", error);
    } finally {
      setIsUploading(false);
    }
  };

  // Calculate stats
  const totalEvaluations = evaluations.length;
  const completedEvaluations = evaluations.filter((e) => e.status === "reviewed").length;
  const avgRating =
    evaluations.length > 0
      ? (
          evaluations.reduce((sum, e) => sum + (e.overall_rating || 0), 0) / evaluations.length
        ).toFixed(1)
      : 0;
  const pendingEvaluations = evaluations.filter((e) => e.status === "draft").length;

  const getEmployeeName = (employeeId) => {
    const employee = employees.find((e) => e.id === employeeId);
    return employee?.full_name || "Unknown";
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: "bg-yellow-100 text-yellow-800",
      submitted: "bg-blue-100 text-blue-800",
      reviewed: "bg-green-100 text-green-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getRatingColor = (rating) => {
    if (rating >= 4) return "text-green-600";
    if (rating >= 3) return "text-blue-600";
    if (rating >= 2) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
              <Target className="w-8 h-8 text-blue-600" />
              Performance Management
            </h1>
            <p className="text-slate-600 mt-1">
              Track and manage employee performance evaluations
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                New Evaluation
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Performance Evaluation</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Employee</Label>
                  <Select
                    value={newEvaluation.employee_id}
                    onValueChange={(value) =>
                      setNewEvaluation({ ...newEvaluation, employee_id: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id}>
                          {emp.full_name} - {emp.job_title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Evaluation Type</Label>
                    <Select
                      value={newEvaluation.evaluation_type}
                      onValueChange={(value) =>
                        setNewEvaluation({ ...newEvaluation, evaluation_type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="self">Self Evaluation</SelectItem>
                        <SelectItem value="manager">Manager Review</SelectItem>
                        <SelectItem value="peer">Peer Review</SelectItem>
                        <SelectItem value="360">360 Review</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Period</Label>
                    <Input
                      placeholder="e.g., Q1 2026"
                      value={newEvaluation.period}
                      onChange={(e) =>
                        setNewEvaluation({ ...newEvaluation, period: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div>
                  <Label className="mb-2 block">Competencies (1-5)</Label>
                  <div className="space-y-3">
                    {Object.keys(newEvaluation.competencies).map((key) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-sm capitalize">
                          {key.replace(/_/g, " ")}
                        </span>
                        <div className="flex gap-2">
                          {[1, 2, 3, 4, 5].map((rating) => (
                            <button
                              key={rating}
                              type="button"
                              onClick={() =>
                                setNewEvaluation({
                                  ...newEvaluation,
                                  competencies: {
                                    ...newEvaluation.competencies,
                                    [key]: rating,
                                  },
                                })
                              }
                              className={`w-8 h-8 rounded-full border-2 transition-all ${
                                newEvaluation.competencies[key] >= rating
                                  ? "bg-blue-600 border-blue-600 text-white"
                                  : "border-gray-300 hover:border-blue-400"
                              }`}
                            >
                              {rating}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Strengths</Label>
                  <Textarea
                    value={newEvaluation.strengths}
                    onChange={(e) =>
                      setNewEvaluation({ ...newEvaluation, strengths: e.target.value })
                    }
                    placeholder="Key strengths observed..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label>Areas for Improvement</Label>
                  <Textarea
                    value={newEvaluation.areas_for_improvement}
                    onChange={(e) =>
                      setNewEvaluation({
                        ...newEvaluation,
                        areas_for_improvement: e.target.value,
                      })
                    }
                    placeholder="Areas that need improvement..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label>Overall Rating (1-5)</Label>
                  <div className="flex gap-2 mt-2">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        type="button"
                        onClick={() =>
                          setNewEvaluation({ ...newEvaluation, overall_rating: rating })
                        }
                        className={`flex-1 h-12 rounded-lg border-2 transition-all ${
                          newEvaluation.overall_rating === rating
                            ? "bg-blue-600 border-blue-600 text-white font-bold"
                            : "border-gray-300 hover:border-blue-400"
                        }`}
                      >
                        {rating}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Supporting Document (Optional)</Label>
                  <div className="mt-2">
                    <Input
                      type="file"
                      onChange={handleFileUpload}
                      disabled={isUploading}
                      accept=".pdf,.doc,.docx,.txt"
                    />
                    {isUploading && (
                      <p className="text-sm text-blue-600 mt-2">Uploading...</p>
                    )}
                    {uploadedFile && (
                      <p className="text-sm text-green-600 mt-2">✓ {uploadedFile}</p>
                    )}
                  </div>
                </div>

                <Button
                  onClick={() => createEvaluationMutation.mutate(newEvaluation)}
                  disabled={!newEvaluation.employee_id || !newEvaluation.period}
                  className="w-full"
                >
                  Create Evaluation
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Total Evaluations</p>
                  <p className="text-3xl font-bold text-slate-900 mt-1">
                    {totalEvaluations}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Target className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Completed</p>
                  <p className="text-3xl font-bold text-slate-900 mt-1">
                    {completedEvaluations}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Average Rating</p>
                  <p className="text-3xl font-bold text-slate-900 mt-1">{avgRating}</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                  <Star className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Pending</p>
                  <p className="text-3xl font-bold text-slate-900 mt-1">
                    {pendingEvaluations}
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList>
            <TabsTrigger value="overview">All Evaluations</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Search evaluations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="grid gap-4">
              {evaluations
                .filter((evaluation) =>
                  getEmployeeName(evaluation.employee_id)
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase())
                )
                .map((evaluation) => (
                  <Card key={evaluation.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-slate-900">
                              {getEmployeeName(evaluation.employee_id)}
                            </h3>
                            <Badge className={getStatusColor(evaluation.status)}>
                              {evaluation.status}
                            </Badge>
                            <Badge variant="outline">{evaluation.evaluation_type}</Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-slate-600 mb-3">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {evaluation.period}
                            </span>
                            <span>By: {evaluation.evaluator_email}</span>
                          </div>
                          {evaluation.overall_rating > 0 && (
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-slate-600">Overall Rating:</span>
                              <div className="flex gap-1">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-4 h-4 ${
                                      i < evaluation.overall_rating
                                        ? "fill-yellow-500 text-yellow-500"
                                        : "text-gray-300"
                                    }`}
                                  />
                                ))}
                              </div>
                              <span
                                className={`font-semibold ${getRatingColor(
                                  evaluation.overall_rating
                                )}`}
                              >
                                {evaluation.overall_rating}/5
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

              {evaluations.length === 0 && (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Target className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">
                      No evaluations yet
                    </h3>
                    <p className="text-slate-600">
                      Start by creating your first performance evaluation
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="pending" className="space-y-4 mt-6">
            <div className="grid gap-4">
              {evaluations
                .filter((e) => e.status === "draft" || e.status === "submitted")
                .map((evaluation) => (
                  <Card key={evaluation.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900 mb-2">
                            {getEmployeeName(evaluation.employee_id)}
                          </h3>
                          <div className="flex items-center gap-3 text-sm text-slate-600">
                            <span>{evaluation.period}</span>
                            <Badge className={getStatusColor(evaluation.status)}>
                              {evaluation.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>

          <TabsContent value="completed" className="space-y-4 mt-6">
            <div className="grid gap-4">
              {evaluations
                .filter((e) => e.status === "reviewed")
                .map((evaluation) => (
                  <Card key={evaluation.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900 mb-2">
                            {getEmployeeName(evaluation.employee_id)}
                          </h3>
                          <div className="flex items-center gap-3 text-sm text-slate-600 mb-3">
                            <span>{evaluation.period}</span>
                            <Badge className={getStatusColor(evaluation.status)}>
                              {evaluation.status}
                            </Badge>
                          </div>
                          {evaluation.overall_rating > 0 && (
                            <div className="flex items-center gap-2">
                              <div className="flex gap-1">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-4 h-4 ${
                                      i < evaluation.overall_rating
                                        ? "fill-yellow-500 text-yellow-500"
                                        : "text-gray-300"
                                    }`}
                                  />
                                ))}
                              </div>
                              <span
                                className={`font-semibold ${getRatingColor(
                                  evaluation.overall_rating
                                )}`}
                              >
                                {evaluation.overall_rating}/5
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}