import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Folder,
  FileText,
  Paperclip,
  Check,
  UploadCloud,
  ChevronDown,
  Search,
  ExternalLink,
  BookOpen,
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { companyLibraryApi } from '@/api';
import { queryKeys } from '@/constants/queryKeys';
import { formatBytes, getFileTypeBadge } from '@/lib/fileFormatUtils';

export default function CompanyLibraryAssetSelector({
  selectedAssetId,
  templateName,
  templateUrl,
  onSelectAsset,
  onClearAsset,
  isUploadingTemplate,
  onTemplateUpload,
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  // Fetch all company library folders with their assets
  const { data: folders = [], isLoading } = useQuery({
    queryKey: queryKeys.companyLibrary.folders(''),
    queryFn: () => companyLibraryApi.getFolders(''),
  });

  // Filter folders and assets by search query
  const filteredFolders = folders
    .map((folder) => {
      const folderMatches = folder.name?.toLowerCase().includes(search.toLowerCase());
      const matchingAssets = (folder.assets || []).filter(
        (asset) =>
          folderMatches ||
          asset.name?.toLowerCase().includes(search.toLowerCase()) ||
          asset.fileType?.toLowerCase().includes(search.toLowerCase())
      );
      return {
        ...folder,
        assets: matchingAssets,
      };
    })
    .filter((folder) => folder.assets && folder.assets.length > 0);

  const totalAvailableAssets = folders.reduce(
    (sum, f) => sum + (f.assets?.length || 0),
    0
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
          <Paperclip className="w-3.5 h-3.5 text-indigo-600" />
          <span>Attach Company Library Asset / Document Template</span>
        </Label>
        <span className="text-[11px] text-slate-500">
          Provides blank template for employee to download & complete
        </span>
      </div>

      {/* Selected Asset Pill Preview */}
      {templateUrl ? (
        <div className="p-3 bg-emerald-50/80 border border-emerald-200/90 rounded-xl flex items-center justify-between text-xs shadow-2xs">
          <div className="flex items-center gap-2.5 truncate">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
              <Check className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="truncate">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-900 truncate">
                  {templateName || 'Attached Document Template'}
                </span>
                <Badge variant="outline" className="text-[10px] bg-white text-emerald-700 border-emerald-200 shrink-0">
                  Attached Template
                </Badge>
              </div>
              <a
                href={templateUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-indigo-600 hover:underline inline-flex items-center gap-1 mt-0.5"
              >
                Preview attached document <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClearAsset}
            className="text-slate-400 hover:text-rose-600 font-bold text-xs h-8 px-2 cursor-pointer"
            title="Remove attached asset"
          >
            Remove
          </Button>
        </div>
      ) : (
        /* Selector Controls: Dropdown Popover + Direct Upload */
        <div className="flex flex-wrap items-center gap-2.5">
          {/* 1. Popover Dropdown Grouped by Folder */}
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="h-9 px-3.5 text-xs font-semibold bg-white border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg shadow-2xs gap-2 cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                <span>Select from Company Library</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
              </Button>
            </PopoverTrigger>

            <PopoverContent align="start" className="w-80 sm:w-96 p-0 text-xs shadow-lg rounded-xl">
              {/* Search Inside Popover */}
              <div className="p-3 border-b border-slate-100 bg-slate-50/50">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="Search by asset or folder name..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-8 text-xs pl-8 bg-white"
                    autoFocus
                  />
                </div>
              </div>

              {/* Grouped Asset List */}
              <div className="max-h-64 overflow-y-auto p-2 space-y-3">
                {isLoading ? (
                  <div className="p-4 text-center text-slate-400 text-xs">
                    Loading company library assets...
                  </div>
                ) : filteredFolders.length === 0 ? (
                  <div className="p-6 text-center space-y-1 text-slate-500">
                    <p className="font-semibold text-xs text-slate-700">No assets found</p>
                    <p className="text-[11px] text-slate-400">
                      {totalAvailableAssets === 0
                        ? 'Your Company Library is currently empty. Upload files in Settings > Company Library.'
                        : 'No assets matched your search filter.'}
                    </p>
                  </div>
                ) : (
                  filteredFolders.map((folder) => (
                    <div key={folder.id} className="space-y-1">
                      {/* Folder Group Header */}
                      <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 bg-slate-50/80 rounded">
                        <Folder className="w-3 h-3 text-indigo-500" />
                        <span>{folder.name}</span>
                        <span className="text-slate-300 font-normal">({folder.assets.length})</span>
                      </div>

                      {/* Assets in this folder */}
                      <div className="space-y-0.5">
                        {folder.assets.map((asset) => {
                          const badge = getFileTypeBadge(asset.fileType);
                          return (
                            <button
                              key={asset.id}
                              type="button"
                              onClick={() => {
                                onSelectAsset({
                                  id: asset.id,
                                  name: asset.name,
                                  fileUrl: asset.fileUrl,
                                  folderName: folder.name,
                                });
                                setOpen(false);
                              }}
                              className="w-full text-left p-2 rounded-lg hover:bg-indigo-50/70 hover:text-indigo-900 transition-colors flex items-center justify-between group cursor-pointer"
                            >
                              <div className="flex items-center gap-2 truncate">
                                <FileText className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 shrink-0" />
                                <div className="truncate">
                                  <span className="font-medium text-slate-800 group-hover:text-indigo-950 block truncate text-xs">
                                    {asset.name}
                                  </span>
                                  {asset.fileSize && (
                                    <span className="text-[10px] text-slate-400">
                                      {formatBytes(asset.fileSize)}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${badge.bg} ${badge.text} ${badge.border} shrink-0 ml-2`}>
                                {badge.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </PopoverContent>
          </Popover>

          <span className="text-xs text-slate-400 font-medium">or</span>

          {/* 2. Direct File Upload Button */}
          <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-dashed border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-indigo-400 text-xs font-semibold cursor-pointer shadow-2xs transition-colors">
            <UploadCloud className="w-3.5 h-3.5 text-indigo-600" />
            <span>
              {isUploadingTemplate ? 'Uploading...' : 'Upload File Directly'}
            </span>
            <input
              type="file"
              className="hidden"
              disabled={isUploadingTemplate}
              onChange={(e) => {
                if (e.target.files?.[0]) onTemplateUpload(e.target.files[0]);
              }}
            />
          </label>
        </div>
      )}
    </div>
  );
}
