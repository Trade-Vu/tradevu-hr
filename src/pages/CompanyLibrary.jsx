import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Folder,
  FileText,
  Search,
  Download,
  ExternalLink,
  ChevronRight,
  ArrowLeft,
  BookOpen,
  Filter,
  Sparkles,
  FileCheck,
  Shield,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { companyLibraryApi } from '@/api';
import { queryKeys } from '@/constants/queryKeys';
import {
  formatBytes,
  getFileExtension,
  getFileTypeBadge,
} from '@/lib/fileFormatUtils';

function getUploaderDisplayName(asset) {
  if (asset.uploaderName) return asset.uploaderName;
  if (asset.uploadedBy && typeof asset.uploadedBy === 'object') {
    return (
      asset.uploadedBy.fullName ||
      `${asset.uploadedBy.firstName || ''} ${asset.uploadedBy.lastName || ''}`.trim() ||
      asset.uploadedBy.email ||
      'Admin'
    );
  }
  if (typeof asset.uploadedBy === 'string' && asset.uploadedBy.trim()) {
    if (asset.uploadedBy.includes('@') || asset.uploadedBy.includes(' ')) {
      return asset.uploadedBy;
    }
    return 'Admin';
  }
  return 'Admin';
}

const FOLDER_COLORS = {
  indigo: { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-600', hoverBorder: 'hover:border-indigo-300' },
  blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-600', hoverBorder: 'hover:border-blue-300' },
  emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-600', hoverBorder: 'hover:border-emerald-300' },
  amber: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-600', hoverBorder: 'hover:border-amber-300' },
  purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-600', hoverBorder: 'hover:border-purple-300' },
  rose: { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-600', hoverBorder: 'hover:border-rose-300' },
  slate: { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-600', hoverBorder: 'hover:border-slate-300' },
};

export default function CompanyLibrary() {
  const [search, setSearch] = useState('');
  const [activeFolderId, setActiveFolderId] = useState(null);
  const [filterType, setFilterType] = useState('ALL'); // ALL, PDF, SPREADSHEET, DOC

  // Query folders with backend permission filtering strictly enforced
  const {
    data: folders = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: queryKeys.companyLibrary.folders(search),
    queryFn: () => companyLibraryApi.getFolders(search),
  });

  const activeFolder = useMemo(() => {
    if (!activeFolderId) return null;
    return folders.find((f) => f.id === activeFolderId) || null;
  }, [folders, activeFolderId]);

  // Filter assets inside active folder or org-wide
  const displayedAssets = useMemo(() => {
    if (!activeFolder) return [];
    let assets = activeFolder.assets || [];

    if (filterType !== 'ALL') {
      assets = assets.filter((a) => {
        const ext = getFileExtension(a.fileUrl || a.name);
        if (filterType === 'PDF') return ext === 'pdf';
        if (filterType === 'SPREADSHEET') return ['xls', 'xlsx', 'csv'].includes(ext);
        if (filterType === 'DOC') return ['doc', 'docx', 'txt'].includes(ext);
        return true;
      });
    }

    if (search) {
      const q = search.toLowerCase();
      assets = assets.filter(
        (a) =>
          a.name?.toLowerCase().includes(q) ||
          a.description?.toLowerCase().includes(q)
      );
    }

    return assets;
  }, [activeFolder, filterType, search]);

  const totalAssetCount = useMemo(() => {
    return folders.reduce((sum, f) => sum + (f.assets?.length || f.assetCount || 0), 0);
  }, [folders]);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      {/* 1. Header Banner */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight font-heading flex items-center gap-2.5">
              <span>Company Library & Resources</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-3xl">
              Access official guidelines, policy handbooks, standard form templates, and resources approved for your role and department.
            </p>
          </div>

          {activeFolder && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveFolderId(null)}
              className="text-xs h-9 border-slate-200 text-slate-700 hover:bg-slate-50 gap-1.5 rounded-lg cursor-pointer self-start sm:self-auto shadow-2xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to All Folders
            </Button>
          )}
        </div>

        {/* Search Bar & Quick Counters */}
        <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search documents or templates..."
              className="pl-9 h-9 text-xs bg-slate-50/70 border-slate-200 rounded-lg placeholder:text-slate-400 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 self-start sm:self-auto">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
            <span>
              <strong className="text-slate-800">{folders.length}</strong> available {folders.length === 1 ? 'folder' : 'folders'} •{' '}
              <strong className="text-slate-800">{totalAssetCount}</strong> files
            </span>
          </div>
        </div>
      </div>

      {/* 2. Main Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-40 rounded-xl bg-slate-100 animate-pulse border border-slate-200" />
          ))}
        </div>
      ) : isError ? (
        <div className="p-8 text-center bg-white rounded-xl border border-rose-200 text-xs text-rose-600">
          Failed to load company library. Please try refreshing the page.
        </div>
      ) : folders.length === 0 ? (
        /* Empty State: No folders matching permissions */
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 mx-auto">
            <BookOpen className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900 font-heading">
              {search ? 'No Matching Documents Found' : 'No Resources Assigned to Your Profile'}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {search
                ? `No folders or documents matched your search query "${search}". Try searching for another term.`
                : 'There are currently no document folders visible for your employment class or department. If you need access to specific materials, please contact HR.'}
            </p>
          </div>
          {search && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSearch('')}
              className="text-xs h-8 border-slate-200 text-slate-700"
            >
              Clear Search
            </Button>
          )}
        </div>
      ) : !activeFolder ? (
        /* FOLDERS GRID VIEW */
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4.5">
            {folders.map((folder) => {
              const color = FOLDER_COLORS[folder.color] || FOLDER_COLORS.indigo;
              const assetCount = folder.assets?.length ?? folder.assetCount ?? 0;

              return (
                <div
                  key={folder.id}
                  onClick={() => setActiveFolderId(folder.id)}
                  className={`group bg-white border border-slate-200/90 ${color.hoverBorder} rounded-xl p-5 transition-all duration-200 shadow-2xs hover:shadow-md cursor-pointer flex flex-col justify-between`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className={`w-11 h-11 rounded-xl ${color.bg} border ${color.border} flex items-center justify-center ${color.text} shadow-2xs group-hover:scale-105 transition-transform`}>
                        <Folder className="w-5 h-5" />
                      </div>

                      <Badge variant="outline" className="text-[10px] bg-slate-50 text-slate-600 border-slate-200 font-medium">
                        {assetCount} {assetCount === 1 ? 'file' : 'files'}
                      </Badge>
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors font-heading truncate">
                        {folder.name}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-2 min-h-[2rem]">
                        {folder.description || 'Official company materials and documents.'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span className="text-[11px]">Click to view documents</span>
                    <span className="group-hover:translate-x-1 transition-transform text-indigo-600 font-semibold text-[11px] flex items-center gap-0.5">
                      Explore <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* SINGLE FOLDER DRILL-DOWN VIEW */
        <div className="space-y-5">
          {/* Active Folder Header Card */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className={`w-11 h-11 rounded-xl ${(FOLDER_COLORS[activeFolder.color] || FOLDER_COLORS.indigo).bg} border ${(FOLDER_COLORS[activeFolder.color] || FOLDER_COLORS.indigo).border} flex items-center justify-center ${(FOLDER_COLORS[activeFolder.color] || FOLDER_COLORS.indigo).text} shrink-0`}>
                  <Folder className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 font-heading">
                    {activeFolder.name}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5 max-w-2xl">
                    {activeFolder.description || 'Browse, view, and download documents in this folder.'}
                  </p>
                </div>
              </div>

              {/* Quick Type Filter Pills */}
              <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto">
                <Button
                  variant={filterType === 'ALL' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType('ALL')}
                  className={`text-[11px] h-7 px-2.5 rounded-md cursor-pointer ${
                    filterType === 'ALL' ? 'bg-slate-900 text-white' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  All ({activeFolder.assets?.length || 0})
                </Button>
                <Button
                  variant={filterType === 'PDF' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType('PDF')}
                  className={`text-[11px] h-7 px-2.5 rounded-md cursor-pointer ${
                    filterType === 'PDF' ? 'bg-slate-900 text-white' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  PDFs
                </Button>
                <Button
                  variant={filterType === 'SPREADSHEET' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType('SPREADSHEET')}
                  className={`text-[11px] h-7 px-2.5 rounded-md cursor-pointer ${
                    filterType === 'SPREADSHEET' ? 'bg-slate-900 text-white' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Spreadsheets
                </Button>
                <Button
                  variant={filterType === 'DOC' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType('DOC')}
                  className={`text-[11px] h-7 px-2.5 rounded-md cursor-pointer ${
                    filterType === 'DOC' ? 'bg-slate-900 text-white' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Word / Docs
                </Button>
              </div>
            </div>
          </div>

          {/* Asset List */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                <span>Available Resources ({displayedAssets.length})</span>
              </h3>
            </div>

            {displayedAssets.length === 0 ? (
              <div className="p-10 border border-dashed border-slate-200 rounded-xl text-center space-y-2 bg-slate-50/50">
                <FileText className="w-8 h-8 text-slate-300 mx-auto" />
                <h4 className="text-xs font-semibold text-slate-800">No Documents in this View</h4>
                <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                  {filterType !== 'ALL'
                    ? `No ${filterType.toLowerCase()} files found in this folder.`
                    : 'This folder does not contain any resources yet.'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {displayedAssets.map((asset) => {
                  const badge = getFileTypeBadge(asset.fileType);
                  return (
                    <div
                      key={asset.id}
                      className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 -mx-2 px-3 rounded-lg transition-colors"
                    >
                      <div className="flex items-start gap-3 truncate">
                        <div className={`w-9 h-9 rounded-lg ${badge.bg} border ${badge.border} flex items-center justify-center shrink-0 mt-0.5`}>
                          <FileText className={`w-4 h-4 ${badge.text}`} />
                        </div>

                        <div className="truncate space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
                              {asset.name}
                            </span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full border ${badge.bg} ${badge.text} ${badge.border}`}>
                              {badge.label}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-[11px] text-slate-500">
                            {asset.fileSize && <span>{formatBytes(asset.fileSize)}</span>}
                            <span>•</span>
                            <span>Updated {new Date(asset.createdAt).toLocaleDateString()}</span>
                            <span>•</span>
                            <span>by {getUploaderDisplayName(asset)}</span>
                          </div>

                          {asset.description && (
                            <p className="text-[11px] text-slate-500 truncate max-w-lg">
                              {asset.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                        <a
                          href={asset.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="h-8 px-2.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 inline-flex items-center gap-1.5 text-xs font-medium cursor-pointer shadow-2xs"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                          <span>Preview</span>
                        </a>

                        <a
                          href={asset.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          download
                          className="h-8 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white inline-flex items-center gap-1.5 text-xs font-semibold cursor-pointer shadow-2xs transition-colors"
                        >
                          <Download className="w-3.5 h-3.5 text-white" />
                          <span>Download</span>
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
