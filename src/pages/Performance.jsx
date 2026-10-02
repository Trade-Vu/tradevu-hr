import React, { useState } from "react";
import { gqlClient } from "@/api/graphqlClient";
import { gql } from "graphql-request";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
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
  BarChart3,
} from "lucide-react";
import PerformanceCheckInsList from "@/components/evaluations/PerformanceCheckInsList";

export default function Performance() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTab, setSelectedTab] = useState("overview");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { user } = useAuth();

  const { data: goals = [], isLoading: loadingGoals } = useQuery({
    queryKey: ["goals", user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const GET_GOALS = gql`
        query GetGoals($employeeId: ID!) {
          goals(employeeId: $employeeId) {
            id title description weight status period selfRating managerRating
          }
        }
      `;
      const data = await gqlClient.request(GET_GOALS, { employeeId: user.email });
      return data.goals || [];
    },
    enabled: !!user?.email
  });

  const { data: checkIns = [], isLoading: loadingCheckIns } = useQuery({
    queryKey: ["checkIns", user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const GET_CHECKINS = gql`
        query GetCheckIns($employeeId: ID!) {
          checkIns(employeeId: $employeeId) {
            id employeeId period scheduledDate completedDate selfAppraisal managerNotes overallRating status
          }
        }
      `;
      const data = await gqlClient.request(GET_CHECKINS, { employeeId: user.email });
      return data.checkIns || [];
    },
    enabled: !!user?.email
  });

  const { data: employees = [] } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const EMP_QUERY = gql`query { employees { id fullName email jobTitle } }`;
      const data = await gqlClient.request(EMP_QUERY);
      return (data.employees || []).map(e => ({ ...e, full_name: e.fullName }));
    },
    initialData: [],
  });

  const [newGoal, setNewGoal] = useState({
    title: "",
    period: "Q3 2026",
    weight: 10,
  });

  const createGoalMutation = useMutation({
    mutationFn: async (data) => {
      const CREATE_GOAL = gql`
        mutation CreateGoal($employeeId: ID!, $title: String!, $weight: Float!, $period: String!) {
          createGoal(employeeId: $employeeId, title: $title, weight: $weight, period: $period) {
            id
          }
        }
      `;
      return await gqlClient.request(CREATE_GOAL, {
        employeeId: user?.email,
        title: data.title,
        weight: parseFloat(data.weight),
        period: data.period
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      setIsDialogOpen(false);
      setNewGoal({ title: "", period: "Q3 2026", weight: 10 });
    },
  });

  const updateCheckInMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const UPDATE_CHECKIN = gql`
        mutation UpdateCheckIn($id: ID!, $selfAppraisal: String, $status: String) {
          updateCheckIn(id: $id, selfAppraisal: $selfAppraisal, status: $status) { id }
        }
      `;
      return await gqlClient.request(UPDATE_CHECKIN, { id, ...data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checkIns"] });
    }
  });

  // Calculate stats
  const totalGoals = goals.length;
  const completedGoals = goals.filter((g) => g.status === "COMPLETED").length;
  const avgRating = checkIns.length > 0
    ? (checkIns.reduce((sum, c) => sum + (c.overallRating || 0), 0) / checkIns.length).toFixed(1)
    : 0;
  const pendingCheckIns = checkIns.filter((c) => c.status === "SCHEDULED").length;

  const getEmployeeName = (employeeId) => {
    const employee = employees.find((e) => e.id === employeeId);
    return employee?.full_name || "Unknown";
  };

  const getStatusColor = (status) => {
    const colors = {
      SCHEDULED: "bg-yellow-100 text-yellow-800",
      COMPLETED: "bg-green-100 text-green-800",
      DRAFT: "bg-gray-100 text-gray-800",
      ACTIVE: "bg-blue-100 text-blue-800",
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
            
            <p className="text-slate-600 mt-1">
              Track and manage employee performance evaluations
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                New Goal
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create Performance Goal</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Goal Title</Label>
                  <Input
                    value={newGoal.title}
                    onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                    placeholder="e.g., Increase sales by 10%"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Period</Label>
                    <Select
                      value={newGoal.period}
                      onValueChange={(value) => setNewGoal({ ...newGoal, period: value })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Q1 2026">Q1 2026</SelectItem>
                        <SelectItem value="Q2 2026">Q2 2026</SelectItem>
                        <SelectItem value="Q3 2026">Q3 2026</SelectItem>
                        <SelectItem value="Q4 2026">Q4 2026</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Weight (%)</Label>
                    <Input
                      type="number"
                      value={newGoal.weight}
                      onChange={(e) => setNewGoal({ ...newGoal, weight: e.target.value })}
                    />
                  </div>
                </div>

                <Button
                  onClick={() => createGoalMutation.mutate(newGoal)}
                  disabled={!newGoal.title || createGoalMutation.isPending}
                  className="w-full"
                >
                  {createGoalMutation.isPending ? "Creating..." : "Create Goal"}
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
                  <p className="text-sm text-slate-600">Total Goals</p>
                  <p className="text-3xl font-bold text-slate-900 mt-1">
                    {totalGoals}
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
                  <p className="text-sm text-slate-600">Completed Goals</p>
                  <p className="text-3xl font-bold text-slate-900 mt-1">
                    {completedGoals}
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
                  <p className="text-sm text-slate-600">Pending Check-ins</p>
                  <p className="text-3xl font-bold text-slate-900 mt-1">
                    {pendingCheckIns}
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
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="bg-slate-100 p-1 rounded-xl h-auto inline-flex border border-slate-200/70">
            <TabsTrigger
              value="overview"
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm"
            >
              <BarChart3 className="w-4 h-4" />
              <span>All Evaluations</span>
              <span className="ml-1.5 px-2 py-0.5 text-xs rounded-full bg-slate-200/70 text-slate-700 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
                {goals.length}
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="pending"
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm"
            >
              <Clock className="w-4 h-4" />
              <span>Pending</span>
              <span className="ml-1.5 px-2 py-0.5 text-xs rounded-full bg-slate-200/70 text-slate-700 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
                {checkIns.filter((c) => c.status === "SCHEDULED").length}
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="completed"
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Completed</span>
              <span className="ml-1.5 px-2 py-0.5 text-xs rounded-full bg-slate-200/70 text-slate-700 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
                {checkIns.filter((c) => c.status === "COMPLETED").length}
              </span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-6 focus-visible:outline-none">
            <h2 className="text-xl font-semibold mb-4">My Goals</h2>
            <div className="grid gap-4">
              {goals.map((goal) => (
                <Card key={goal.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-slate-900">
                            {goal.title}
                          </h3>
                          <Badge className={getStatusColor(goal.status)}>
                            {goal.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-600 mb-3">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {goal.period}
                          </span>
                          <span>Weight: {goal.weight}%</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="pending" className="space-y-4 mt-6 focus-visible:outline-none">
            <h2 className="text-xl font-semibold mb-4">Pending Check-ins</h2>
            <PerformanceCheckInsList
              checkIns={checkIns}
              status="SCHEDULED"
              onUpdateCheckIn={(id, data) =>
                updateCheckInMutation.mutate({ id, data })
              }
              getStatusColor={getStatusColor}
            />
          </TabsContent>

          <TabsContent value="completed" className="space-y-4 mt-6 focus-visible:outline-none">
            <h2 className="text-xl font-semibold mb-4">Completed Check-ins</h2>
            <PerformanceCheckInsList
              checkIns={checkIns}
              status="COMPLETED"
              getStatusColor={getStatusColor}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}