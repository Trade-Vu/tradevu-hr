import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Activity, Shield, User, FileText, Settings, Key, ChevronLeft, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { gqlClient } from "@/api/graphqlClient";
import { gql } from "graphql-request";

const GET_RECENT_AUDIT_LOGS = gql`
  query GetRecentAuditLogs {
    auditLogs(limit: 50) {
      id
      actor {
        email
      }
      entityType
      action
      createdAt
    }
  }
`;

export default function RecentActivity() {
  const [page, setPage] = useState(1);
  const itemsPerPage = 5;

  const { data: { auditLogs = [] } = {}, isLoading } = useQuery({
    queryKey: ['recentAuditLogs'],
    queryFn: () => gqlClient.request(GET_RECENT_AUDIT_LOGS),
  });

  const totalPages = Math.ceil(auditLogs.length / itemsPerPage);
  const currentLogs = auditLogs.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const getActionIcon = (action) => {
    switch (action) {
      case 'CREATED': return <FileText className="w-4 h-4 text-green-500" />;
      case 'DELETED': return <Activity className="w-4 h-4 text-red-500" />;
      case 'UPDATE_STATUS': return <Settings className="w-4 h-4 text-orange-500" />;
      case 'LOGIN': return <Key className="w-4 h-4 text-blue-500" />;
      default: return <Shield className="w-4 h-4 text-indigo-500" />;
    }
  };

  return (
    <Card className="border-slate-200/60 shadow-sm rounded-xl overflow-hidden bg-white h-full flex flex-col">
      <CardHeader className="border-b border-slate-100 pb-4 shrink-0">
        <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-900">
          <Activity className="w-4 h-4 text-indigo-500" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 flex-1 min-h-0 overflow-y-auto custom-scrollbar">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-slate-500">Loading activity...</div>
        ) : auditLogs.length === 0 ? (
          <div className="p-8 text-center flex flex-col items-center justify-center h-full">
            <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center mb-3 border border-slate-100">
              <Activity className="w-5 h-5 text-slate-300" />
            </div>
            <p className="text-sm text-slate-500 font-medium">No recent activity</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {currentLogs.map((log) => (
              <div key={log.id} className="p-4 hover:bg-slate-50 transition-colors group">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 w-8 h-8 rounded-full bg-white border border-slate-100 shadow-sm flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    {getActionIcon(log.action)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 text-sm mb-0.5 truncate group-hover:text-indigo-600 transition-colors">
                      {log.action.replace(/_/g, ' ')} <span className="text-slate-500 font-normal">{log.entityType}</span>
                    </p>
                    <p className="text-xs text-slate-500 mb-1.5 truncate">
                      By <span className="font-medium text-slate-700">{log.actor?.email || 'System'}</span>
                    </p>
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">
                      {format(new Date(parseInt(log.createdAt)), "MMM d, h:mm a")}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      {totalPages > 1 && (
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-sm shrink-0 mt-auto bg-slate-50/50">
          <span className="text-slate-500">
            Showing {(page - 1) * itemsPerPage + 1} to {Math.min(page * itemsPerPage, auditLogs.length)} of {auditLogs.length}
          </span>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}