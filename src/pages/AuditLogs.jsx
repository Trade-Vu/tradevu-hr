import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { gqlClient } from '@/api/graphqlClient';
import { gql } from 'graphql-request';
import { format } from 'date-fns';
import { Shield, Search, Filter, Monitor, Eye } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AuditLogDetailsModal } from '@/components/AuditLogDetailsModal';

const GET_AUDIT_LOGS = gql`
  query GetAuditLogs($entityType: String, $action: String, $page: Int, $limit: Int) {
    auditLogs(entityType: $entityType, action: $action, page: $page, limit: $limit) {
      data {
        id
        actor {
          email
          role
          employee {
            fullName
            phone
          }
        }
        entityType
        entityId
        action
        previousValue
        newValue
        details
        ipAddress
        location
        createdAt
      }
      total
      page
      limit
    }
  }
`;

export default function AuditLogs() {
  const [entityTypeFilter, setEntityTypeFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data: { auditLogs } = {}, isLoading } = useQuery({
    queryKey: ['auditLogs', entityTypeFilter, actionFilter, page],
    queryFn: () => gqlClient.request(GET_AUDIT_LOGS, {
      entityType: entityTypeFilter || null,
      action: actionFilter || null,
      page,
      limit
    }),
  });

  const logs = auditLogs?.data || [];
  const total = auditLogs?.total || 0;
  const totalPages = Math.ceil(total / limit);

  const formatAction = (action, entityType) => {
    if (!action) return 'Unknown Action';
    const formattedAction = action.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
    
    if (['Create', 'Update', 'Delete'].includes(formattedAction) && entityType) {
      const cleanEntity = entityType.replace(/([A-Z])/g, ' $1').trim();
      return `${formattedAction} ${cleanEntity}`;
    }
    
    return formattedAction;
  };

  const renderChanges = (log) => {
    try {
      const prev = log.previousValue ? JSON.parse(log.previousValue) : null;
      const next = log.newValue ? JSON.parse(log.newValue) : null;
      
      if (!prev && !next) return <span className="text-slate-400 italic">No details</span>;

      // Extract specific fields if it's an employee status update or leave etc
      if (log.action === 'UPDATE_STATUS' || log.action === 'APPROVED' || log.action === 'REJECTED') {
        const prevStatus = prev?.status || prev?.employmentStatus || 'Unknown';
        const nextStatus = next?.status || next?.employmentStatus || 'Unknown';
        return (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 line-through">{prevStatus}</span>
            <span className="text-xs text-slate-400">→</span>
            <span className="text-xs font-semibold text-indigo-700">{nextStatus}</span>
          </div>
        );
      }

      if (log.action === 'CREATED' && log.entityType === 'SalaryHistory') {
        return (
          <div className="text-xs">
            <span className="text-slate-500">Old Basic: </span><span className="line-through">{prev?.basicSalary}</span>
            <br/>
            <span className="font-semibold text-green-700">New Basic: {next?.basicSalary}</span>
          </div>
        );
      }

      // Generic fallback
      return (
        <div className="text-xs text-slate-500 truncate max-w-[200px]" title={log.newValue}>
          {log.newValue ? "Data updated" : "Metadata logged"}
        </div>
      );
    } catch (e) {
      return <span className="text-slate-400 italic">Unparseable</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          
          <p className="text-slate-500 mt-1">Organization-wide historical tracking and compliance records.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Filter by Entity Type (e.g. Employee, PayrollRun)" 
            className="pl-9 bg-slate-50"
            value={entityTypeFilter}
            onChange={(e) => setEntityTypeFilter(e.target.value)}
          />
        </div>
        <div className="relative flex-1 min-w-[200px]">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Filter by Action (e.g. UPDATE, APPROVED)" 
            className="pl-9 bg-slate-50"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
          />
        </div>
        <Button variant="outline" onClick={() => { setEntityTypeFilter(''); setActionFilter(''); setPage(1); }}>
          Reset Filters
        </Button>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
              <tr>
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">Actor</th>
                <th className="px-6 py-4">Entity</th>
                <th className="px-6 py-4">Action</th>
                <th className="px-6 py-4">Changes</th>
                <th className="px-6 py-4">Device / IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-500">Loading audit logs...</td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                    <Shield className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p>No audit logs match your filters.</p>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors cursor-pointer" onClick={() => setSelectedLog(log)}>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-slate-900">{format(new Date(parseInt(log.createdAt)), 'MMM d, yyyy')}</div>
                      <div className="text-xs text-slate-500">{format(new Date(parseInt(log.createdAt)), 'h:mm:ss a')}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0 border border-indigo-100">
                          {log.actor?.employee?.fullName?.charAt(0) || log.actor?.email?.charAt(0).toUpperCase() || 'S'}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-slate-900">{log.actor?.employee?.fullName || 'System'}</div>
                          <div className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded uppercase tracking-wider w-fit mt-0.5">
                            {log.actor?.role?.replace('_', ' ') || 'SYSTEM'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-indigo-600">{log.entityType}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate max-w-[100px]">{log.entityId}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded-md tracking-wider">
                        {formatAction(log.action, log.entityType)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {renderChanges(log)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-500">
                        {log.ipAddress ? (
                          <>
                            <Monitor className="w-3.5 h-3.5" />
                            <span className="text-xs font-mono">{log.ipAddress}</span>
                          </>
                        ) : (
                          <span className="text-xs italic">Not tracked</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between bg-slate-50">
            <span className="text-sm text-slate-500">
              Showing <span className="font-medium text-slate-900">{((page - 1) * limit) + 1}</span> to <span className="font-medium text-slate-900">{Math.min(page * limit, total)}</span> of <span className="font-medium text-slate-900">{total}</span> results
            </span>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <div className="text-sm font-medium px-2">Page {page} of {totalPages}</div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
      
      <AuditLogDetailsModal 
        isOpen={!!selectedLog} 
        onClose={() => setSelectedLog(null)} 
        log={selectedLog} 
      />
    </div>
  );
}
