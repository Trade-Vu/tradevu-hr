import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Edit, X, Check, RefreshCw, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { toTitleCase } from '@/lib/utils';
import { toast } from 'sonner';

const getItemName = (item) => {
  if (typeof item === 'object' && item !== null) {
    return String(item.name || item.value || '').toUpperCase();
  }
  return String(item || '').toUpperCase();
};

const getItemPermissions = (item) => {
  if (typeof item === 'object' && item !== null) {
    const name = String(item.name || item.value || '').toUpperCase();
    const isMgr = /MANAGER/i.test(name);
    return {
      canManage: typeof item.canManage === 'boolean' ? item.canManage : isMgr,
      canApproveLeave: typeof item.canApproveLeave === 'boolean' ? item.canApproveLeave : isMgr,
    };
  }
  const name = String(item || '').toUpperCase();
  const isMgr = /MANAGER/i.test(name);
  return {
    canManage: isMgr,
    canApproveLeave: isMgr,
  };
};

export default function ClassificationListManager({
  title,
  itemLabel,
  description,
  icon: Icon,
  items = [],
  onSave,
  isSaving = false,
  defaultItems = [],
  placeholder = 'e.g. Full Time',
  hasPermissions = false,
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [canManage, setCanManage] = useState(false);
  const [canApproveLeave, setCanApproveLeave] = useState(false);

  const handleStartAdd = () => {
    setIsAdding(true);
    setEditingIndex(null);
    setInputValue('');
    setCanManage(false);
    setCanApproveLeave(false);
  };

  const handleStartEdit = (index) => {
    const it = items[index];
    const name = getItemName(it);
    setInputValue(toTitleCase(name));
    if (hasPermissions) {
      const perms = getItemPermissions(it);
      setCanManage(perms.canManage);
      setCanApproveLeave(perms.canApproveLeave);
    }
    setEditingIndex(index);
    setIsAdding(true);
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingIndex(null);
    setInputValue('');
    setCanManage(false);
    setCanApproveLeave(false);
  };

  const handleSubmit = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) {
      toast.error(`${itemLabel} name cannot be empty`);
      return;
    }

    const upperTrimmed = trimmed.toUpperCase();
    let updated = [...items];

    const newItem = hasPermissions
      ? { name: upperTrimmed, canManage, canApproveLeave }
      : upperTrimmed;

    if (editingIndex !== null) {
      if (updated.some((it, i) => i !== editingIndex && getItemName(it) === upperTrimmed)) {
        toast.error(`${itemLabel} "${trimmed}" already exists`);
        return;
      }
      updated[editingIndex] = newItem;
    } else {
      if (updated.some((it) => getItemName(it) === upperTrimmed)) {
        toast.error(`${itemLabel} "${trimmed}" already exists`);
        return;
      }
      updated.push(newItem);
    }

    onSave(updated, () => {
      handleCancel();
    });
  };

  const handleDelete = (index) => {
    const itemToDelete = toTitleCase(getItemName(items[index]));
    const updated = items.filter((_, i) => i !== index);
    onSave(updated, () => {
      toast.info(`Removed ${itemToDelete}`);
    });
  };

  const handleResetDefaults = () => {
    if (defaultItems.length === 0) return;
    onSave(defaultItems, () => {
      toast.success(`Reset ${title} to default options`);
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold tracking-tight text-slate-800">{title}</h3>
            <Badge variant="secondary" className="font-medium text-xs bg-slate-100 text-slate-700">
              {items.length} {items.length === 1 ? 'item' : 'items'}
            </Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">{description}</p>
        </div>

        <div className="flex items-center gap-2">
          {defaultItems.length > 0 && items.length === 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetDefaults}
              disabled={isSaving}
              className="text-slate-600"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Load Defaults
            </Button>
          )}
          <Button
            onClick={handleStartAdd}
            disabled={isSaving}
          >
            <Plus className="w-4 h-4 mr-2" /> Add {itemLabel}
          </Button>
        </div>
      </div>

      {isAdding && (
        <Card className="border-blue-100 bg-blue-50/30 shadow-sm animate-in fade-in-50 duration-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-slate-800">
              {editingIndex !== null ? `Edit ${itemLabel}` : `Add New ${itemLabel}`}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
              <div className="space-y-1.5 flex-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                  {itemLabel} Name
                </label>
                <Input
                  placeholder={placeholder}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSubmit();
                    if (e.key === 'Escape') handleCancel();
                  }}
                  autoFocus
                  className="bg-white"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleSubmit}
                  disabled={isSaving}
                  className="bg-blue-600 hover:bg-blue-700 min-w-[90px]"
                >
                  {isSaving ? 'Saving...' : <><Check className="w-4 h-4 mr-1.5" /> Save</>}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="bg-white hover:bg-slate-100"
                >
                  <X className="w-4 h-4 mr-1.5" /> Cancel
                </Button>
              </div>
            </div>

            {hasPermissions && (
              <div className="pt-3 border-t border-slate-200/80 space-y-2.5">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Tier Permissions
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                      canManage
                        ? 'bg-blue-50/70 border-blue-200 text-blue-900 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={canManage}
                      onChange={(e) => setCanManage(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <span className="text-sm font-medium block">Can Manage</span>
                      <span className="text-xs text-slate-500 block">
                        Allows employees in this class to be assigned as direct managers.
                      </span>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                      canApproveLeave
                        ? 'bg-blue-50/70 border-blue-200 text-blue-900 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={canApproveLeave}
                      onChange={(e) => setCanApproveLeave(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <span className="text-sm font-medium block">Can Approve Leave</span>
                      <span className="text-xs text-slate-500 block">
                        Authorizes employees in this class to approve leave requests.
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, idx) => {
          const name = getItemName(item);
          const perms = hasPermissions ? getItemPermissions(item) : null;

          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Card className="group hover:shadow-md hover:border-blue-200 transition-all duration-200 bg-white">
                <CardContent className="p-5">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex items-center gap-3">
                      {Icon && (
                        <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                          <Icon className="w-4 h-4" />
                        </div>
                      )}
                      <div>
                        <h4 className="font-semibold text-slate-800 text-base leading-snug">
                          {toTitleCase(name)}
                        </h4>
                        <span className="text-xs text-slate-400 font-mono">
                          {name}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleStartEdit(idx)}
                        disabled={isSaving}
                        className="h-8 w-8 p-0 text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                        title="Edit"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(idx)}
                        disabled={isSaving}
                        className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  {hasPermissions && perms && (
                    <div className="mt-3.5 pt-3 border-t border-slate-100 flex flex-wrap gap-1.5">
                      {perms.canManage ? (
                        <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200 text-[11px] font-medium flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          Can Manage
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-slate-400 border-slate-200 text-[11px] font-normal">
                          No Direct Reports
                        </Badge>
                      )}

                      {perms.canApproveLeave && (
                        <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200 text-[11px] font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-blue-600" />
                          Can Approve Leave
                        </Badge>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {items.length === 0 && !isAdding && (
        <div className="text-center p-12 bg-white rounded-xl border border-slate-200 border-dashed">
          <div className="bg-blue-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
            <Plus className="w-6 h-6 text-blue-600" />
          </div>
          <h4 className="text-base font-semibold text-slate-900 mb-1">No {title.toLowerCase()} configured</h4>
          <p className="text-sm text-slate-500 mb-4 max-w-sm mx-auto">
            Add options or load the standard defaults to categorize your employees.
          </p>
          <div className="flex justify-center gap-3">
            {defaultItems.length > 0 && (
              <Button onClick={handleResetDefaults} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-1.5" /> Load Defaults
              </Button>
            )}
            <Button onClick={handleStartAdd} size="sm" className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-1.5" /> Add First {itemLabel}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
