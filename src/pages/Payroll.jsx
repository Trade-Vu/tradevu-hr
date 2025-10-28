import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DollarSign, TrendingUp, Users, Calendar, Plus, Download, Search } from "lucide-react";
import { format } from "date-fns";

export default function Payroll() {
  const [searchTerm, setSearchTerm] = useState("");
  const [monthFilter, setMonthFilter] = useState(new Date().toISOString().slice(0, 7));

  const { data: payrolls = [] } = useQuery({
    queryKey: ['payroll'],
    queryFn: () => base44.entities.Payroll.list('-month'),
    initialData: [],
  });

  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: () => base44.entities.Employee.list(),
    initialData: [],
  });

  const currentMonthPayrolls = payrolls.filter(p => p.month === monthFilter);
  const totalPayroll = currentMonthPayrolls.reduce((sum, p) => sum + (p.net_salary || 0), 0);
  const approvedCount = currentMonthPayrolls.filter(p => p.status === 'approved' || p.status === 'paid').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm mb-4">
              <DollarSign className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-slate-700">Payroll Management</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-3">
              Payroll
            </h1>
            <p className="text-lg text-slate-600">
              Automated salary processing and management
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button className="bg-gradient-to-r from-green-600 to-emerald-600">
              <Plus className="w-4 h-4 mr-2" />
              Generate Payroll
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6">
          <Card className="border-slate-200">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="bg-green-100 p-3 rounded-xl">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <div className="text-3xl font-bold text-slate-900 mb-1">
                {totalPayroll.toLocaleString()} SAR
              </div>
              <div className="text-sm text-slate-600">Total This Month</div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="bg-blue-100 p-3 rounded-xl">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div className="text-3xl font-bold text-slate-900 mb-1">
                {currentMonthPayrolls.length}
              </div>
              <div className="text-sm text-slate-600">Employees</div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="bg-purple-100 p-3 rounded-xl">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <div className="text-3xl font-bold text-slate-900 mb-1">
                {approvedCount}
              </div>
              <div className="text-sm text-slate-600">Approved</div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="bg-orange-100 p-3 rounded-xl">
                  <Calendar className="w-6 h-6 text-orange-600" />
                </div>
              </div>
              <div className="text-3xl font-bold text-slate-900 mb-1">
                {monthFilter}
              </div>
              <div className="text-sm text-slate-600">Current Period</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border-slate-200">
          <CardContent className="p-6">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search employee..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Input
                type="month"
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
                className="w-48"
              />
            </div>
          </CardContent>
        </Card>

        {/* Payroll List */}
        <Card className="border-slate-200">
          <CardHeader className="border-b border-slate-200">
            <CardTitle>Payroll Records</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {currentMonthPayrolls.length === 0 ? (
              <div className="p-12 text-center">
                <DollarSign className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No payroll records</h3>
                <p className="text-slate-500 mb-4">Generate payroll for this month to get started</p>
                <Button>Generate Payroll</Button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {currentMonthPayrolls.map((payroll) => (
                  <div key={payroll.id} className="p-6 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900 mb-1">{payroll.employee_name}</h3>
                        <div className="flex items-center gap-4 text-sm text-slate-600">
                          <span>Basic: {payroll.basic_salary.toLocaleString()} SAR</span>
                          <span>Net: {payroll.net_salary.toLocaleString()} SAR</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className={
                          payroll.status === 'paid' ? 'bg-green-100 text-green-700 border-green-200' :
                          payroll.status === 'approved' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                          'bg-slate-100 text-slate-700 border-slate-200'
                        }>
                          {payroll.status}
                        </Badge>
                        <Button variant="ghost" size="sm">View Details</Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}