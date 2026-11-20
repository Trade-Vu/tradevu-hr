import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Folder,
  FolderPlus,
  FileText,
  UploadCloud,
  Search,
  Lock,
  Globe,
  MoreVertical,
  Edit2,
  Trash2,
  Download,
  ExternalLink,
  ChevronRight,
  ArrowLeft,
  Users,
  Briefcase,
  Building,
  Check,
  AlertCircle,
  FileCode,
  FileSpreadsheet,
  FileImage,
  Layers,
  Sparkles,
  User,
  X,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { companyLibraryApi, organizationsApi, departmentsApi, employeesApi } from '@/api';
import { queryKeys } from '@/constants/queryKeys';
import { uploadToCloudinary } from '@/utils/cloudinary';
import {
  formatBytes,
  getFileExtension,
  getFileTypeBadge,
  validateAssetFile,
} from '@/lib/fileFormatUtils';
import { toTitleCase } from '@/lib/utils';

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

const FOLDER_COLORS = [
  { id: 'indigo', name: 'Indigo', bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-600', dot: 'bg-indigo-500' },
  { id: 'blue', name: 'Blue', bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-600', dot: 'bg-blue-500' },
  { id: 'emerald', name: 'Emerald', bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-600', dot: 'bg-emerald-500' },
  { id: 'amber', name: 'Amber', bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-600', dot: 'bg-amber-500' },
  { id: 'purple', name: 'Purple', bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-600', dot: 'bg-purple-500' },
  { id: 'rose', name: 'Rose', bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-600', dot: 'bg-rose-500' },
  { id: 'slate', name: 'Slate', bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-600', dot: 'bg-slate-500' },
];

function getColorConfig(colorId = 'indigo') {
  return FOLDER_COLORS.find((c) => c.id === colorId) || FOLDER_COLORS[0];
}

const DEFAULT_EMPLOYMENT_TYPES = ['PERMANENT', 'PROBATIONARY', 'CONTRACT', 'CONSULTANT'];
const DEFAULT_EMPLOYEE_CLASSES = [
  'INTERN',
  'TEAM MEMBER',
  'MID LEVEL TEAM MEMBER',
  'MID LEVEL MANAGER',
  'MANAGER',
  'SENIOR MANAGER',
  'EXECUTIVE MANAGER',
];

export default function SettingsCompanyLibrary() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [selectedFolder, setSelectedFolder] = useState(null);

  // Folder Dialog State
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState(null);
  const [folderForm, setFolderForm] = useState({
    name: '',
    description: '',
    color: 'indigo',
    isPublic: true,
    allowedClasses: [],
    allowedEmploymentTypes: [],
    allowedDepartmentIds: [],
    allowedUserIds: [],
  });

  // User Targeting Picker State
  const [userSearch, setUserSearch] = useState('');
  const [isUserPickerOpen, setIsUserPickerOpen] = useState(false);

  // Custom Delete Modal State
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Asset Upload Dialog State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [assetName, setAssetName] = useState('');
  const [assetDescription, setAssetDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Rename Asset Dialog State
  const [editingAsset, setEditingAsset] = useState(null);
  const [editAssetName, setEditAssetName] = useState('');

  // 1. Fetch Folders
  const {
    data: folders = [],
    isLoading: loadingFolders,
    refetch: refetchFolders,
  } = useQuery({
    queryKey: queryKeys.companyLibrary.folders(search),
    queryFn: () => companyLibraryApi.getFolders(search),
  });

  // 2. Fetch Org Settings for targeting options (Classes & Employment Types)
  const { data: orgData } = useQuery({
    queryKey: ['organization', 'me'],
    queryFn: async () => {
      const res = await organizationsApi.getMyOrganization();
      return res?.data || res;
    },
  });

  // 3. Fetch Departments
  const { data: departmentsData } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const res = await departmentsApi.getDepartments();
      return Array.isArray(res) ? res : res?.data || [];
    },
  });

  // 4. Fetch Employees for Specific User Targeting
  const { data: employeesData = [] } = useQuery({
    queryKey: ['employees', 'library-targeting-picker'],
    queryFn: async () => {
      const res = await employeesApi.getAllEmployees();
      return Array.isArray(res) ? res : res?.data || [];
    },
  });

  const availableClasses = useMemo(() => {
    if (Array.isArray(orgData?.employeeClasses) && orgData.employeeClasses.length > 0) {
      return orgData.employeeClasses.map((c) =>
        typeof c === 'string' ? c.toUpperCase() : String(c?.name || c?.value || '').toUpperCase()
      );
    }
    return DEFAULT_EMPLOYEE_CLASSES;
  }, [orgData]);

  const availableEmploymentTypes = useMemo(() => {
    if (Array.isArray(orgData?.employmentTypes) && orgData.employmentTypes.length > 0) {
      return orgData.employmentTypes.map((t) =>
        typeof t === 'string' ? t.toUpperCase() : String(t?.name || '').toUpperCase()
      );
    }
    return DEFAULT_EMPLOYMENT_TYPES;
  }, [orgData]);

  const departments = useMemo(() => {
    return Array.isArray(departmentsData) ? departmentsData : [];
  }, [departmentsData]);

  // Normalized active employees for multi-select user targeting
  const employeeOptions = useMemo(() => {
    return (employeesData || []).map((emp) => {
      const userId = emp.userId?._id || emp.userId?.id || emp.userId || emp.id || emp._id;
      const fullName =
        emp.fullName ||
        `${emp.firstName || ''} ${emp.lastName || ''}`.trim() ||
        emp.userId?.fullName ||
        emp.email ||
        'Employee';
      const email = emp.email || emp.userId?.email || '';
      const subtitle = emp.jobTitle || emp.department?.name || emp.departmentId?.name || emp.role || '';
      return {
        id: String(userId),
        employeeId: String(emp.id || emp._id),
        name: fullName,
        email,
        subtitle,
      };
    });
  }, [employeesData]);

  // Keep selectedFolder in sync if refetched
  const currentFolder = useMemo(() => {
    if (!selectedFolder) return null;
    return folders.find((f) => f.id === selectedFolder.id) || selectedFolder;
  }, [folders, selectedFolder]);

  // Mutations
  const createFolderMutation = useMutation({
    mutationFn: (dto) => companyLibraryApi.createFolder(dto),
    onSuccess: (newFolder) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.companyLibrary.all });
      toast.success('Asset folder created successfully');
      setIsFolderModalOpen(false);
      resetFolderForm();
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to create folder');
    },
  });

  const updateFolderMutation = useMutation({
    mutationFn: ({ id, data }) => companyLibraryApi.updateFolder(id, data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.companyLibrary.all });
      toast.success('Folder updated successfully');
      setIsFolderModalOpen(false);
      resetFolderForm();
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to update folder');
    },
  });

  const deleteFolderMutation = useMutation({
    mutationFn: (id) => companyLibraryApi.deleteFolder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.companyLibrary.all });
      toast.success('Folder and contained assets deleted');
      if (selectedFolder) setSelectedFolder(null);
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to delete folder');
    },
  });

  const createAssetMutation = useMutation({
    mutationFn: (dto) => companyLibraryApi.createAsset(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.companyLibrary.all });
      toast.success('Document uploaded to library');
      setIsUploadModalOpen(false);
      setUploadFile(null);
      setAssetName('');
      setAssetDescription('');
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to upload asset');
    },
  });

  const updateAssetMutation = useMutation({
    mutationFn: ({ id, data }) => companyLibraryApi.updateAsset(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.companyLibrary.all });
      toast.success('Asset updated successfully');
      setEditingAsset(null);
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to update asset');
    },
  });

  const deleteAssetMutation = useMutation({
    mutationFn: (id) => companyLibraryApi.deleteAsset(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.companyLibrary.all });
      toast.success('Asset removed from library');
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to delete asset');
    },
  });

  // Modal Handlers
  const resetFolderForm = () => {
    setEditingFolder(null);
    setFolderForm({
      name: '',
      description: '',
      color: 'indigo',
      isPublic: true,
      allowedClasses: [],
      allowedEmploymentTypes: [],
      allowedDepartmentIds: [],
      allowedUserIds: [],
    });
    setUserSearch('');
    setIsUserPickerOpen(false);
  };

  const openCreateFolder = () => {
    resetFolderForm();
    setIsFolderModalOpen(true);
  };

  const openEditFolder = (folder, e) => {
    e?.stopPropagation();
    setEditingFolder(folder);
    setFolderForm({
      name: folder.name || '',
      description: folder.description || '',
      color: folder.color || 'indigo',
      isPublic: folder.isPublic !== undefined ? folder.isPublic : true,
      allowedClasses: Array.isArray(folder.allowedClasses) ? folder.allowedClasses : [],
      allowedEmploymentTypes: Array.isArray(folder.allowedEmploymentTypes) ? folder.allowedEmploymentTypes : [],
      allowedDepartmentIds: Array.isArray(folder.allowedDepartmentIds) ? folder.allowedDepartmentIds : [],
      allowedUserIds: Array.isArray(folder.allowedUserIds) ? folder.allowedUserIds : [],
    });
    setUserSearch('');
    setIsUserPickerOpen(false);
    setIsFolderModalOpen(true);
  };

  const handleSaveFolder = (e) => {
    e.preventDefault();
    if (!folderForm.name.trim()) {
      toast.error('Folder name is required');
      return;
    }

    const payload = {
      name: folderForm.name.trim(),
      description: folderForm.description.trim() || null,
      color: folderForm.color,
      isPublic: folderForm.isPublic,
      allowedClasses: folderForm.isPublic ? [] : folderForm.allowedClasses,
      allowedEmploymentTypes: folderForm.isPublic ? [] : folderForm.allowedEmploymentTypes,
      allowedDepartmentIds: folderForm.isPublic ? [] : folderForm.allowedDepartmentIds,
      allowedUserIds: folderForm.isPublic ? [] : folderForm.allowedUserIds,
    };

    if (editingFolder) {
      updateFolderMutation.mutate({ id: editingFolder.id, data: payload });
    } else {
      createFolderMutation.mutate(payload);
    }
  };

  const handleToggleClass = (className) => {
    setFolderForm((prev) => {
      const exists = prev.allowedClasses.includes(className);
      return {
        ...prev,
        allowedClasses: exists
          ? prev.allowedClasses.filter((c) => c !== className)
          : [...prev.allowedClasses, className],
      };
    });
  };

  const handleToggleType = (typeName) => {
    setFolderForm((prev) => {
      const exists = prev.allowedEmploymentTypes.includes(typeName);
      return {
        ...prev,
        allowedEmploymentTypes: exists
          ? prev.allowedEmploymentTypes.filter((t) => t !== typeName)
          : [...prev.allowedEmploymentTypes, typeName],
      };
    });
  };

  const handleToggleUser = (userId) => {
    setFolderForm((prev) => {
      const exists = (prev.allowedUserIds || []).includes(userId);
      return {
        ...prev,
        allowedUserIds: exists
          ? prev.allowedUserIds.filter((id) => id !== userId)
          : [...(prev.allowedUserIds || []), userId],
      };
    });
  };

  // Upload Asset Flow
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateAssetFile(file);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    setUploadFile(file);
    // Suggest sanitized name without file extension
    const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
    setAssetName(baseName);
    setIsUploadModalOpen(true);
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
      toast.error('Please choose a file');
      return;
    }
    if (!assetName.trim()) {
      toast.error('Please provide a display name for the document');
      return;
    }

    try {
      setIsUploading(true);
      const cloudRes = await uploadToCloudinary(uploadFile);
      const ext = getFileExtension(uploadFile.name);

      await createAssetMutation.mutateAsync({
        folderId: currentFolder.id,
        name: assetName.trim(),
        description: assetDescription.trim() || null,
        fileUrl: cloudRes.secure_url,
        fileType: ext || cloudRes.format || 'pdf',
        mimeType: uploadFile.type || null,
        fileSize: uploadFile.size,
      });
    } catch (err) {
      toast.error(err.message || 'File upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      {/* 1. Header & Navigation Banner */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight font-heading flex items-center gap-2.5">
              <span>Company Document Library</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-3xl">
              Organize company documents, onboarding forms, and employee resources into secure folders. Set granular access rules based on employee class, employment type, or department.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {currentFolder ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedFolder(null)}
                className="text-xs h-9 border-slate-200 text-slate-700 hover:bg-slate-50 gap-1.5 rounded-lg cursor-pointer shadow-2xs"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                All Folders
              </Button>
            ) : null}

            <Button
              size="sm"
              onClick={openCreateFolder}
              className="text-xs h-9 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg shadow-2xs cursor-pointer gap-1.5"
            >
              <FolderPlus className="w-4 h-4" />
              New Folder
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search folders or documents..."
              className="pl-9 h-9 text-xs bg-slate-50/70 border-slate-200 rounded-lg placeholder:text-slate-400 focus:bg-white"
            />
          </div>

          <div className="text-xs text-slate-500 flex items-center gap-2 self-start sm:self-auto">
            <span className="font-semibold text-slate-700">{folders.length}</span> folders configured
          </div>
        </div>
      </div>

      {/* 2. Main Content Area */}
      {!currentFolder ? (
        /* FOLDERS GRID VIEW */
        <div className="space-y-4">
          {loadingFolders ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-44 rounded-xl bg-slate-100 animate-pulse border border-slate-200" />
              ))}
            </div>
          ) : folders.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mx-auto">
                <Folder className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900 font-heading">No Document Folders Yet</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Create organized folders for policies, contract templates, employee handbooks, or compliance forms.
                </p>
              </div>
              <Button
                size="sm"
                onClick={openCreateFolder}
                className="text-xs h-9 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg shadow-2xs gap-1.5 cursor-pointer"
              >
                <FolderPlus className="w-4 h-4" />
                Create First Folder
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4.5">
              {folders.map((folder) => {
                const color = getColorConfig(folder.color);
                const assetCount = folder.assetCount ?? folder.assets?.length ?? 0;
                const hasClassRules = folder.allowedClasses?.length > 0;
                const hasTypeRules = folder.allowedEmploymentTypes?.length > 0;
                const hasDeptRules = folder.allowedDepartmentIds?.length > 0;
                const hasUserRules = folder.allowedUserIds?.length > 0;

                return (
                  <div
                    key={folder.id}
                    onClick={() => setSelectedFolder(folder)}
                    className="group bg-white border border-slate-200/90 hover:border-indigo-300 rounded-xl p-5 transition-all duration-200 shadow-2xs hover:shadow-md cursor-pointer flex flex-col justify-between relative overflow-hidden"
                  >
                    <div className="space-y-3.5">
                      {/* Top Header of Card */}
                      <div className="flex items-start justify-between gap-3">
                        <div className={`w-11 h-11 rounded-xl ${color.bg} border ${color.border} flex items-center justify-center ${color.text} shadow-2xs shrink-0 group-hover:scale-105 transition-transform`}>
                          <Folder className="w-5 h-5" />
                        </div>

                        <div className="flex items-center gap-1.5">
                          {folder.isPublic ? (
                            <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200 font-medium flex items-center gap-1">
                              <Globe className="w-3 h-3" />
                              Public
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] bg-indigo-50 text-indigo-700 border-indigo-200 font-medium flex items-center gap-1">
                              <Lock className="w-3 h-3" />
                              Restricted
                            </Badge>
                          )}

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
                              >
                                <MoreVertical className="w-3.5 h-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="text-xs">
                              <DropdownMenuItem
                                onClick={(e) => openEditFolder(folder, e)}
                                className="gap-2 cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                                Edit Settings & Permissions
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteTarget({
                                    type: 'folder',
                                    id: folder.id,
                                    name: folder.name,
                                    assetCount: folder.assetCount ?? folder.assets?.length ?? 0,
                                  });
                                }}
                                className="gap-2 text-rose-600 focus:text-rose-700 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                Delete Folder
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      {/* Folder Title & Description */}
                      <div className="space-y-1">
                        <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors font-heading truncate">
                          {folder.name}
                        </h3>
                        <p className="text-xs text-slate-500 line-clamp-2 min-h-[2rem]">
                          {folder.description || 'No folder description provided.'}
                        </p>
                      </div>

                      {/* Granular Permission Tags */}
                      {!folder.isPublic && (
                        <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-1.5 text-[10px]">
                          {hasClassRules && (
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200/80 font-medium">
                              {folder.allowedClasses.length} {folder.allowedClasses.length === 1 ? 'class' : 'classes'}
                            </span>
                          )}
                          {hasTypeRules && (
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200/80 font-medium">
                              {folder.allowedEmploymentTypes.length} {folder.allowedEmploymentTypes.length === 1 ? 'type' : 'types'}
                            </span>
                          )}
                          {hasDeptRules && (
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200/80 font-medium">
                              Specific Depts
                            </span>
                          )}
                          {hasUserRules && (
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200/80 font-medium">
                              {folder.allowedUserIds.length} specific {folder.allowedUserIds.length === 1 ? 'user' : 'users'}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Bottom Metadata */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <span className="font-medium text-slate-700">
                        {assetCount} {assetCount === 1 ? 'document' : 'documents'}
                      </span>
                      <span className="group-hover:translate-x-1 transition-transform text-indigo-600 font-semibold text-[11px] flex items-center gap-0.5">
                        Open folder <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* SINGLE FOLDER DRILL-DOWN / ASSETS MANAGER */
        <div className="space-y-5">
          {/* Folder Details Banner */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-lg ${getColorConfig(currentFolder.color).bg} border ${getColorConfig(currentFolder.color).border} flex items-center justify-center ${getColorConfig(currentFolder.color).text} shrink-0 mt-0.5`}>
                  <Folder className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-900 font-heading">
                      {currentFolder.name}
                    </h2>
                    {currentFolder.isPublic ? (
                      <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200 font-medium">
                        Public to All
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] bg-indigo-50 text-indigo-700 border-indigo-200 font-medium">
                        Attribute Restricted
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {currentFolder.description || 'No folder description.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => openEditFolder(currentFolder, e)}
                  className="text-xs h-8 border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5 mr-1 text-slate-500" />
                  Edit Folder Rules
                </Button>

                <label className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer shadow-2xs transition-colors">
                  <UploadCloud className="w-3.5 h-3.5 text-white" />
                  <span>Upload Document</span>
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </label>
              </div>
            </div>

            {/* Permissions Summary Bar */}
            <div className="p-3 bg-slate-50/80 rounded-lg border border-slate-200/80 text-xs flex flex-wrap items-center gap-3">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-indigo-600" />
                <span>Audience Rules:</span>
              </span>

              {currentFolder.isPublic ? (
                <span className="text-slate-600">All employees in the company have access.</span>
              ) : (
                <div className="flex flex-wrap items-center gap-2 text-[11px]">
                  {currentFolder.allowedClasses?.length > 0 && (
                    <span className="text-slate-600">
                      <strong>Classes:</strong> {currentFolder.allowedClasses.join(', ')}
                    </span>
                  )}
                  {currentFolder.allowedEmploymentTypes?.length > 0 && (
                    <span className="text-slate-600">
                      • <strong>Types:</strong> {currentFolder.allowedEmploymentTypes.join(', ')}
                    </span>
                  )}
                  {currentFolder.allowedDepartmentIds?.length > 0 && (
                    <span className="text-slate-600">
                      • <strong>Departments:</strong> {currentFolder.allowedDepartmentIds.length} targeted
                    </span>
                  )}
                  {currentFolder.allowedUserIds?.length > 0 && (
                    <span className="text-slate-600">
                      • <strong>Specific Users:</strong> {currentFolder.allowedUserIds.length} targeted
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Documents in Folder */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                <span>Documents & Files ({currentFolder.assets?.length || 0})</span>
              </h3>
            </div>

            {(!currentFolder.assets || currentFolder.assets.length === 0) ? (
              <div className="p-10 border border-dashed border-slate-200 rounded-xl text-center space-y-3 bg-slate-50/50">
                <UploadCloud className="w-10 h-10 text-slate-300 mx-auto" />
                <div className="space-y-1">
                  <h4 className="text-xs font-semibold text-slate-800">Folder is Empty</h4>
                  <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                    Upload templates, PDFs, guides, or forms into this folder to share with targeted employees.
                  </p>
                </div>
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer shadow-2xs transition-colors">
                  <UploadCloud className="w-3.5 h-3.5 text-white" />
                  <span>Select File to Upload</span>
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </label>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {currentFolder.assets.map((asset) => {
                  const badge = getFileTypeBadge(asset.fileType);
                  return (
                    <div
                      key={asset.id}
                      className="py-3 sm:py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 -mx-2 px-3 rounded-lg transition-colors"
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
                            <span>Uploaded {new Date(asset.createdAt).toLocaleDateString()}</span>
                            <span>•</span>
                            <span>by {getUploaderDisplayName(asset)}</span>
                          </div>

                          {asset.description && (
                            <p className="text-[11px] text-slate-500 truncate max-w-md">
                              {asset.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 self-end sm:self-auto shrink-0">
                        <a
                          href={asset.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          download
                          className="h-8 px-2.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 inline-flex items-center gap-1 text-xs font-medium cursor-pointer shadow-2xs"
                        >
                          <Download className="w-3.5 h-3.5 text-slate-500" />
                          <span>Download</span>
                        </a>

                        <a
                          href={asset.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="h-8 w-8 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 inline-flex items-center justify-center cursor-pointer shadow-2xs"
                          title="Open preview in new tab"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                        </a>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
                            >
                              <MoreVertical className="w-3.5 h-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="text-xs">
                            <DropdownMenuItem
                              onClick={() => {
                                setEditingAsset(asset);
                                setEditAssetName(asset.name);
                              }}
                              className="gap-2 cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                              Rename Document
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                setDeleteTarget({
                                  type: 'asset',
                                  id: asset.id,
                                  name: asset.name,
                                });
                              }}
                              className="gap-2 text-rose-600 focus:text-rose-700 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Delete File
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. Folder Create / Edit Dialog */}
      <Dialog open={isFolderModalOpen} onOpenChange={setIsFolderModalOpen}>
        <DialogContent className="sm:max-w-xl max-h-[88vh] overflow-y-auto">
          <form onSubmit={handleSaveFolder} className="space-y-4">
            <DialogHeader>
              <DialogTitle className="text-base font-bold font-heading text-slate-900 flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-indigo-600" />
                <span>{editingFolder ? 'Edit Folder Settings' : 'Create Asset Folder'}</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Define the folder name, color accent, and granular employee visibility permissions.
              </DialogDescription>
            </DialogHeader>

            {/* Folder Name & Color */}
            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="folder-name" className="text-xs font-semibold text-slate-700">
                  Folder Name <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="folder-name"
                  placeholder="e.g. Employee Handbooks, NDA Templates, or Sales Guides"
                  value={folderForm.name}
                  onChange={(e) => setFolderForm({ ...folderForm, name: e.target.value })}
                  className="h-9 text-xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="folder-desc" className="text-xs font-semibold text-slate-700">
                  Description
                </Label>
                <Textarea
                  id="folder-desc"
                  placeholder="Briefly describe what resources belong in this folder..."
                  value={folderForm.description}
                  onChange={(e) => setFolderForm({ ...folderForm, description: e.target.value })}
                  rows={2}
                  className="text-xs resize-none"
                />
              </div>

              {/* Color Picker */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Folder Accent Color</Label>
                <div className="flex flex-wrap gap-2">
                  {FOLDER_COLORS.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setFolderForm({ ...folderForm, color: c.id })}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium cursor-pointer transition-all ${
                        folderForm.color === c.id
                          ? `${c.bg} ${c.border} ${c.text} ring-2 ring-indigo-500/20 font-bold`
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span className={`w-2.5 h-2.5 rounded-full ${c.dot}`} />
                      <span>{c.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Visibility Mode Switch */}
            <div className="pt-3 border-t border-slate-100 space-y-3">
              <Label className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                Visibility & Access Control
              </Label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div
                  onClick={() => setFolderForm({ ...folderForm, isPublic: true })}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    folderForm.isPublic
                      ? 'bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-500/20'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Globe className={`w-4 h-4 ${folderForm.isPublic ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <span className="text-xs font-bold text-slate-900">Public to All</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Every employee in the organization can view and download files in this folder.
                  </p>
                </div>

                <div
                  onClick={() => setFolderForm({ ...folderForm, isPublic: false })}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    !folderForm.isPublic
                      ? 'bg-indigo-50/80 border-indigo-300 ring-2 ring-indigo-500/20'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Lock className={`w-4 h-4 ${!folderForm.isPublic ? 'text-indigo-600' : 'text-slate-400'}`} />
                    <span className="text-xs font-bold text-slate-900">Attribute Restricted</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Restrict visibility by specific Employee Class, Employment Type, or Department.
                  </p>
                </div>
              </div>

              {/* Granular Attributes Configuration (shown when not public) */}
              {!folderForm.isPublic && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/90 space-y-4">
                  <div className="flex items-center gap-1.5 text-xs text-indigo-900 font-semibold">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Configure Targeting Dimensions (Leave unselected for no restriction)</span>
                  </div>

                  {/* 1. Employee Classes */}
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Users className="w-3 h-3 text-slate-500" />
                        Target Employee Classes
                      </span>
                      {folderForm.allowedClasses.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setFolderForm({ ...folderForm, allowedClasses: [] })}
                          className="text-[10px] text-indigo-600 hover:underline cursor-pointer"
                        >
                          Clear
                        </button>
                      )}
                    </Label>
                    <div className="flex flex-wrap gap-1.5">
                      {availableClasses.map((cls) => {
                        const isSelected = folderForm.allowedClasses.includes(cls);
                        return (
                          <button
                            key={cls}
                            type="button"
                            onClick={() => handleToggleClass(cls)}
                            className={`px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer transition-colors border ${
                              isSelected
                                ? 'bg-slate-900 border-slate-900 text-white shadow-2xs'
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 inline mr-1" />}
                            {cls}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2. Employment Types */}
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Briefcase className="w-3 h-3 text-slate-500" />
                        Target Employment Types
                      </span>
                      {folderForm.allowedEmploymentTypes.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setFolderForm({ ...folderForm, allowedEmploymentTypes: [] })}
                          className="text-[10px] text-indigo-600 hover:underline cursor-pointer"
                        >
                          Clear
                        </button>
                      )}
                    </Label>
                    <div className="flex flex-wrap gap-1.5">
                      {availableEmploymentTypes.map((type) => {
                        const isSelected = folderForm.allowedEmploymentTypes.includes(type);
                        return (
                          <button
                            key={type}
                            type="button"
                            onClick={() => handleToggleType(type)}
                            className={`px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer transition-colors border ${
                              isSelected
                                ? 'bg-slate-900 border-slate-900 text-white shadow-2xs'
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 inline mr-1" />}
                            {type}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 3. Department Targeting */}
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                      <Building className="w-3 h-3 text-slate-500" />
                      Target Department (Optional)
                    </Label>
                    <Select
                      value={folderForm.allowedDepartmentIds[0] || 'all'}
                      onValueChange={(val) => {
                        setFolderForm({
                          ...folderForm,
                          allowedDepartmentIds: val === 'all' ? [] : [val],
                        });
                      }}
                    >
                      <SelectTrigger className="h-8 text-xs bg-white">
                        <SelectValue placeholder="All Departments (No restriction)" />
                      </SelectTrigger>
                      <SelectContent className="text-xs">
                        <SelectItem value="all">All Departments (No restriction)</SelectItem>
                        {departments.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 4. Specific Employees / Users Targeting */}
                  <div className="space-y-2 pt-2 border-t border-slate-200/80">
                    <div className="flex items-center justify-between">
                      <Label className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                        <User className="w-3 h-3 text-slate-500" />
                        <span>Target Specific Employees ({folderForm.allowedUserIds?.length || 0} selected)</span>
                      </Label>
                      {folderForm.allowedUserIds?.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setFolderForm({ ...folderForm, allowedUserIds: [] })}
                          className="text-[10px] text-indigo-600 hover:underline cursor-pointer"
                        >
                          Clear All
                        </button>
                      )}
                    </div>

                    <Popover open={isUserPickerOpen} onOpenChange={setIsUserPickerOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full h-8.5 px-3 text-xs justify-between bg-white border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg cursor-pointer font-normal"
                        >
                          <span className="flex items-center gap-1.5 truncate">
                            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">
                              {folderForm.allowedUserIds?.length > 0
                                ? `${folderForm.allowedUserIds.length} employee${folderForm.allowedUserIds.length === 1 ? '' : 's'} selected`
                                : 'Search and select specific employees...'}
                            </span>
                          </span>
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        </Button>
                      </PopoverTrigger>

                      <PopoverContent align="start" className="w-80 sm:w-96 p-0 text-xs shadow-xl rounded-xl">
                        <div className="p-2.5 border-b border-slate-100 bg-slate-50/60">
                          <div className="relative">
                            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <Input
                              placeholder="Search employees by name, email, or role..."
                              value={userSearch}
                              onChange={(e) => setUserSearch(e.target.value)}
                              className="h-8 text-xs pl-8 bg-white border-slate-200"
                              autoFocus
                            />
                          </div>
                        </div>

                        <div className="max-h-56 overflow-y-auto p-1.5 divide-y divide-slate-50">
                          {employeeOptions.length === 0 ? (
                            <div className="p-4 text-center text-xs text-slate-400">
                              No employees found in organization.
                            </div>
                          ) : (
                            employeeOptions
                              .filter((emp) => {
                                if (!userSearch.trim()) return true;
                                const q = userSearch.toLowerCase();
                                return (
                                  emp.name?.toLowerCase().includes(q) ||
                                  emp.email?.toLowerCase().includes(q) ||
                                  emp.subtitle?.toLowerCase().includes(q)
                                );
                              })
                              .map((emp) => {
                                const isSelected = (folderForm.allowedUserIds || []).includes(emp.id) || (folderForm.allowedUserIds || []).includes(emp.employeeId);
                                return (
                                  <button
                                    key={emp.id}
                                    type="button"
                                    onClick={() => handleToggleUser(emp.id)}
                                    className={`w-full text-left p-2 rounded-lg flex items-center justify-between gap-2.5 cursor-pointer transition-colors ${
                                      isSelected
                                        ? 'bg-slate-100/90 text-slate-900 font-medium'
                                        : 'hover:bg-slate-50 text-slate-700'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 truncate">
                                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                        isSelected ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-600'
                                      }`}>
                                        {emp.name.charAt(0).toUpperCase()}
                                      </div>
                                      <div className="truncate">
                                        <div className="text-xs truncate font-medium text-slate-900">
                                          {emp.name}
                                        </div>
                                        <div className="text-[10px] text-slate-500 truncate flex items-center gap-1.5">
                                          {emp.email && <span>{emp.email}</span>}
                                          {emp.subtitle && <span>• {emp.subtitle}</span>}
                                        </div>
                                      </div>
                                    </div>

                                    <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border ${
                                      isSelected
                                        ? 'bg-slate-900 border-slate-900 text-white'
                                        : 'border-slate-300 bg-white'
                                    }`}>
                                      {isSelected && <Check className="w-3 h-3 text-white" />}
                                    </div>
                                  </button>
                                );
                              })
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>

                    {/* Selected Employee Badges */}
                    {folderForm.allowedUserIds?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {folderForm.allowedUserIds.map((userId) => {
                          const emp = employeeOptions.find((e) => e.id === userId || e.employeeId === userId);
                          const name = emp?.name || 'Selected User';
                          return (
                            <span
                              key={userId}
                              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-900 text-white text-[10px] font-medium shadow-2xs"
                            >
                              <User className="w-2.5 h-2.5 text-slate-300" />
                              <span className="truncate max-w-[120px]">{name}</span>
                              <button
                                type="button"
                                onClick={() => handleToggleUser(userId)}
                                className="hover:text-rose-300 cursor-pointer ml-0.5"
                                title="Remove employee"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsFolderModalOpen(false)}
                className="text-xs h-8"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={createFolderMutation.isPending || updateFolderMutation.isPending}
                className="text-xs h-8 bg-slate-900 hover:bg-slate-800 text-white font-semibold cursor-pointer"
              >
                {editingFolder ? 'Save Changes' : 'Create Folder'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 4. Asset Upload Dialog */}
      <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleUploadSubmit} className="space-y-4">
            <DialogHeader>
              <DialogTitle className="text-base font-bold font-heading text-slate-900 flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-indigo-600" />
                <span>Upload Document to {currentFolder?.name}</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Provide a clean display name and description for this document asset.
              </DialogDescription>
            </DialogHeader>

            {uploadFile && (
              <div className="p-3 bg-indigo-50/70 border border-indigo-200/70 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5 truncate">
                  <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                  <div className="truncate">
                    <span className="font-semibold text-slate-900 block truncate">{uploadFile.name}</span>
                    <span className="text-[10px] text-slate-500">{formatBytes(uploadFile.size)}</span>
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px] bg-white text-indigo-700 border-indigo-200 shrink-0">
                  {getFileExtension(uploadFile.name).toUpperCase()}
                </Badge>
              </div>
            )}

            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="asset-name" className="text-xs font-semibold text-slate-700">
                  Custom Display Name <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="asset-name"
                  placeholder="e.g. Standard Non-Disclosure Agreement (2026)"
                  value={assetName}
                  onChange={(e) => setAssetName(e.target.value)}
                  className="h-9 text-xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="asset-desc" className="text-xs font-semibold text-slate-700">
                  Instructions / Guidance (Optional)
                </Label>
                <Textarea
                  id="asset-desc"
                  placeholder="Optional notes or instructions for employees regarding this file..."
                  value={assetDescription}
                  onChange={(e) => setAssetDescription(e.target.value)}
                  rows={2}
                  className="text-xs resize-none"
                />
              </div>
            </div>

            <DialogFooter className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isUploading}
                onClick={() => setIsUploadModalOpen(false)}
                className="text-xs h-8"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isUploading || createAssetMutation.isPending}
                className="text-xs h-8 bg-slate-900 hover:bg-slate-800 text-white font-semibold cursor-pointer"
              >
                {isUploading ? 'Uploading to Cloud...' : 'Upload & Save'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 5. Rename Asset Dialog */}
      <Dialog open={Boolean(editingAsset)} onOpenChange={(open) => !open && setEditingAsset(null)}>
        <DialogContent className="sm:max-w-md">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!editAssetName.trim()) return;
              updateAssetMutation.mutate({
                id: editingAsset.id,
                data: { name: editAssetName.trim() },
              });
            }}
            className="space-y-4"
          >
            <DialogHeader>
              <DialogTitle className="text-base font-bold font-heading text-slate-900">
                Rename Document
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Update the display name shown to employees across the system.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-1">
              <Label htmlFor="rename-asset" className="text-xs font-semibold text-slate-700">
                Document Display Name
              </Label>
              <Input
                id="rename-asset"
                value={editAssetName}
                onChange={(e) => setEditAssetName(e.target.value)}
                className="h-9 text-xs"
                required
              />
            </div>

            <DialogFooter className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditingAsset(null)}
                className="text-xs h-8"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={updateAssetMutation.isPending}
                className="text-xs h-8 bg-slate-900 hover:bg-slate-800 text-white font-semibold cursor-pointer"
              >
                Save Name
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 6. Custom Confirmation / Delete Modal */}
      <ConfirmationDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={
          deleteTarget?.type === 'folder'
            ? `Delete Folder "${deleteTarget?.name}"?`
            : `Delete Document "${deleteTarget?.name}"?`
        }
        description={
          deleteTarget?.type === 'folder'
            ? `Are you sure you want to delete this folder? ${
                deleteTarget?.assetCount
                  ? `All ${deleteTarget.assetCount} contained document templates and files inside will be permanently removed.`
                  : 'All contained document templates and files inside will be permanently removed.'
              }`
            : `Are you sure you want to delete "${deleteTarget?.name}" from the company library? This file will no longer be accessible to employees.`
        }
        confirmText={deleteTarget?.type === 'folder' ? 'Delete Folder' : 'Delete Document'}
        cancelText="Cancel"
        variant="danger"
        isLoading={deleteFolderMutation.isPending || deleteAssetMutation.isPending}
        onConfirm={async () => {
          if (!deleteTarget) return;
          try {
            if (deleteTarget.type === 'folder') {
              await deleteFolderMutation.mutateAsync(deleteTarget.id);
            } else {
              await deleteAssetMutation.mutateAsync(deleteTarget.id);
            }
            setDeleteTarget(null);
          } catch {
            // Handled in mutation onError
          }
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
