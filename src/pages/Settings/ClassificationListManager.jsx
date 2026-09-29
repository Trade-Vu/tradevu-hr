import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Edit, X, Check, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { toTitleCase } from '@/lib/utils';
import { toast } from 'sonner';

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
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [inputValue, setInputValue] = useState('');

  const handleStartAdd = () => {
    setIsAdding(true);
    setEditingIndex(null);
    setInputValue('');
  };

  const handleStartEdit = (index) => {
    setInputValue(toTitleCase(items[index]));
    setEditingIndex(index);
    setIsAdding(true);
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingIndex(null);
    setInputValue('');
  };

  const handleSubmit = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) {
      toast.error(`${itemLabel} name cannot be empty`);
      return;
    }

    const upperTrimmed = trimmed.toUpperCase();
    let updated = [...items];

    if (editingIndex !== null) {
      if (updated.some((item, i) => i !== editingIndex && item.toUpperCase() === upperTrimmed)) {
        toast.error(`${itemLabel} "${trimmed}" already exists`);
        return;
      }
      updated[editingIndex] = upperTrimmed;
    } else {
      if (updated.some((item) => item.toUpperCase() === upperTrimmed)) {
        toast.error(`${itemLabel} "${trimmed}" already exists`);
        return;
      }
      updated.push(upperTrimmed);
    }

    onSave(updated, () => {
      handleCancel();
    });
  };

  const handleDelete = (index) => {
    const itemToDelete = toTitleCase(items[index]);
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
            className="bg-blue-600 hover:bg-blue-700 shadow-sm"
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
          <CardContent>
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
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, idx) => (
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
                        {toTitleCase(item)}
                      </h4>
                      <span className="text-xs text-slate-400 font-mono">
                        {item.toUpperCase()}
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
              </CardContent>
            </Card>
          </motion.div>
        ))}
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
