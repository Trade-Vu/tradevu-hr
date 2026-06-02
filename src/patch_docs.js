const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'EmployeeDetail.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add uploadToCloudinary import
if (!content.includes('uploadToCloudinary')) {
  content = content.replace(
    'import { format } from "date-fns";',
    'import { format } from "date-fns";\nimport { uploadToCloudinary } from "@/utils/cloudinary";'
  );
}

// 2. Add states
const statesToInject = `  const [docForm, setDocForm] = useState({ document_name: '', file_url: '', file_name: '', file_type: 'PDF', file_size: 0, category: 'Employment Contract', visibility_level: 'hr_only' });
  const [showReplaceDialog, setShowReplaceDialog] = useState(false);
  const [docToReplace, setDocToReplace] = useState(null);
  const [replaceForm, setReplaceForm] = useState({ file_url: '', file_name: '', file_type: 'PDF', file_size: 0 });
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [selectedDocHistory, setSelectedDocHistory] = useState(null);
  const [docCategoryFilter, setDocCategoryFilter] = useState('All');
  const [docSearchQuery, setDocSearchQuery] = useState('');`;

content = content.replace(
  `const [docForm, setDocForm] = useState({ document_name: '', file_url: '', file_name: '' });`,
  statesToInject
);

// 3. Update DOC_QUERY
const oldDocQuery = `const DOC_QUERY = gql\`
        query GetDocs($empId: ID!) { documents(employeeId: $empId) { id name category fileUrl fileType visibilityLevel status } }
      \`;`;
const newDocQuery = `const DOC_QUERY = gql\`
        query GetDocs($empId: ID!) { documents(employeeId: $empId) { id name category fileUrl fileType fileSize visibilityLevel status currentVersion createdAt } }
      \`;`;
content = content.replace(oldDocQuery, newDocQuery);

// 4. Add documentHistory and replaceDocumentVersionMutation
const mutationsToAdd = `const { data: documentHistory = [] } = useQuery({
    queryKey: ['document-history', selectedDocHistory?.id],
    queryFn: async () => {
      const HIST_QUERY = gql\`
        query GetHistory($docId: ID!) { documentHistory(documentId: $docId) { id version fileUrl fileType fileSize uploadedBy createdAt } }
      \`;
      const data = await gqlClient.request(HIST_QUERY, { docId: selectedDocHistory.id });
      return data.documentHistory || [];
    },
    enabled: !!selectedDocHistory,
    initialData: [],
  });
  
  const replaceDocumentVersionMutation = useMutation({
    mutationFn: async ({ id, fileUrl, fileType, fileSize }) => {
      const REPLACE_DOC = gql\`
        mutation ReplaceDoc($id: ID!, $url: String!, $type: String!, $size: Int) {
          replaceDocumentVersion(id: $id, fileUrl: $url, fileType: $type, fileSize: $size) { id currentVersion }
        }
      \`;
      return gqlClient.request(REPLACE_DOC, { id, url: fileUrl, type: fileType, size: fileSize });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-documents', employeeId] });
      setShowReplaceDialog(false);
      setDocToReplace(null);
      setReplaceForm({ file_url: '', file_name: '', file_type: 'PDF', file_size: 0 });
    }
  });`;

content = content.replace(
  /const createDocumentMutation = useMutation\(\{/,
  `${mutationsToAdd}\n\n  const createDocumentMutation = useMutation({`
);

// 5. Update createDocumentMutation
content = content.replace(
  `uploadDocument(employeeId: $empId, name: $name, category: $cat, fileUrl: $url, fileType: $type, visibilityLevel: $vis) { id }`,
  `uploadDocument(employeeId: $empId, name: $name, category: $cat, fileUrl: $url, fileType: $type, fileSize: $size, visibilityLevel: $vis) { id }`
);
content = content.replace(
  `mutation UploadDoc($empId: ID!, $name: String!, $cat: String!, $url: String!, $type: String!, $vis: String!) {`,
  `mutation UploadDoc($empId: ID!, $name: String!, $cat: String!, $url: String!, $type: String!, $size: Int, $vis: String!) {`
);
content = content.replace(
  `vis: data.visibility_level || 'Employee'`,
  `vis: data.visibility_level || 'Employee',\n        size: data.file_size || 0`
);

// 6. Replace handleDocUpload and add handleReplaceDocUpload
const oldHandleUpload = `const handleDocUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    try {
      // Mocked file upload since there is no GraphQL mutation for it yet
      setDocForm(prev => ({ 
        ...prev, 
        file_url: 'https://example.com/mock-doc.pdf', 
        file_name: file.name 
      }));
    } catch (error) {
      console.error("Error uploading:", error);
    }
    setUploadingFile(false);
  };`;
  
const newUploadHandlers = `const handleDocUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    try {
      const result = await uploadToCloudinary(file);
      setDocForm(prev => ({ 
        ...prev, 
        file_url: result.secure_url, 
        file_name: file.name,
        file_type: result.format || 'PDF',
        file_size: result.bytes || 0
      }));
    } catch (error) {
      console.error("Error uploading to Cloudinary:", error);
      alert("Failed to upload file");
    }
    setUploadingFile(false);
  };
  
  const handleReplaceDocUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    try {
      const result = await uploadToCloudinary(file);
      setReplaceForm(prev => ({ 
        ...prev, 
        file_url: result.secure_url, 
        file_name: file.name,
        file_type: result.format || 'PDF',
        file_size: result.bytes || 0
      }));
    } catch (error) {
      console.error("Error uploading to Cloudinary:", error);
      alert("Failed to upload file");
    }
    setUploadingFile(false);
  };`;
content = content.replace(oldHandleUpload, newUploadHandlers);


// 7. Update Documents Tab UI
const oldDocUI = `      case 'documents':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-slate-900">Documents</h3>
              <Dialog open={showDocDialog} onOpenChange={setShowDocDialog}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Document
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Upload Document</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    createDocumentMutation.mutate({
                      employee_id: employeeId,
                      ...docForm,
                      status: 'uploaded',
                    });
                  }} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="document_name">Document Name</Label>
                      <Input id="document_name" value={docForm.document_name} onChange={(e) => setDocForm(prev => ({ ...prev, document_name: e.target.value }))} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="doc-upload">File</Label>
                      <input type="file" onChange={handleDocUpload} className="hidden" id="doc-upload" />
                      <Button type="button" variant="outline" className="w-full" onClick={() => document.getElementById('doc-upload').click()} disabled={uploadingFile}>
                        <Upload className="w-4 h-4 mr-2" />
                        {uploadingFile ? 'Uploading...' : docForm.file_url ? 'Change File' : 'Upload File'}
                      </Button>
                      {docForm.file_name && <p className="text-sm text-slate-500">Selected file: {docForm.file_name}</p>}
                    </div>
                    <div className="flex justify-end gap-3">
                      <Button type="button" variant="outline" onClick={() => setShowDocDialog(false)}>Cancel</Button>
                      <Button type="submit" disabled={createDocumentMutation.isPending || !docForm.file_url || !docForm.document_name}>
                        {createDocumentMutation.isPending ? 'Adding...' : 'Add Document'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
            
            {documents.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                <p className="text-slate-500">No documents</p>
              </div>
            ) : (
              <div className="space-y-3">
                {documents.map(doc => (
                  <div key={doc.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{doc.document_name}</p>
                        <p className="text-sm text-slate-500">{doc.file_name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge>{doc.status}</Badge>
                      {doc.file_url && (
                        <Button size="sm" variant="ghost" asChild>
                          <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                            <Download className="w-4 h-4" />
                          </a>
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => deleteDocumentMutation.mutate(doc.id)} disabled={deleteDocumentMutation.isPending}>
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );`;

const newDocUI = \`      case 'documents':
        const filteredDocs = documents.filter(doc => {
          const matchesSearch = doc.document_name.toLowerCase().includes(docSearchQuery.toLowerCase());
          const matchesCategory = docCategoryFilter === 'All' || doc.category === docCategoryFilter;
          return matchesSearch && matchesCategory;
        });
        
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-slate-900">Documents</h3>
              <Dialog open={showDocDialog} onOpenChange={setShowDocDialog}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Document
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Upload Document</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    createDocumentMutation.mutate({
                      ...docForm,
                    });
                  }} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="document_name">Document Name</Label>
                      <Input id="document_name" value={docForm.document_name} onChange={(e) => setDocForm(prev => ({ ...prev, document_name: e.target.value }))} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <select id="category" value={docForm.category} onChange={(e) => setDocForm(prev => ({ ...prev, category: e.target.value }))} className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm">
                        <option value="Employment Contract">Employment Contract</option>
                        <option value="Offer Letter">Offer Letter</option>
                        <option value="Government ID">Government ID</option>
                        <option value="Passport Photograph">Passport Photograph</option>
                        <option value="Certificates & Qualifications">Certificates & Qualifications</option>
                        <option value="Compliance Forms">Compliance Forms</option>
                        <option value="Guarantor Documents">Guarantor Documents</option>
                        <option value="Promotion Letters">Promotion Letters</option>
                        <option value="Payroll Support Documents">Payroll Support Documents</option>
                        <option value="Exit Documents">Exit Documents</option>
                        <option value="Miscellaneous HR Documents">Miscellaneous HR Documents</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="visibility_level">Visibility Level</Label>
                      <select id="visibility_level" value={docForm.visibility_level} onChange={(e) => setDocForm(prev => ({ ...prev, visibility_level: e.target.value }))} className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm">
                        <option value="hr_only">HR Admin / Super Admin (Private)</option>
                        <option value="employee">Employee & HR</option>
                        <option value="manager">Manager, Employee & HR</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="doc-upload">File</Label>
                      <input type="file" onChange={handleDocUpload} className="hidden" id="doc-upload" />
                      <Button type="button" variant="outline" className="w-full" onClick={() => document.getElementById('doc-upload').click()} disabled={uploadingFile}>
                        <Upload className="w-4 h-4 mr-2" />
                        {uploadingFile ? 'Uploading...' : docForm.file_url ? 'Change File' : 'Upload File'}
                      </Button>
                      {docForm.file_name && <p className="text-sm text-slate-500">Selected file: {docForm.file_name}</p>}
                    </div>
                    <div className="flex justify-end gap-3">
                      <Button type="button" variant="outline" onClick={() => setShowDocDialog(false)}>Cancel</Button>
                      <Button type="submit" disabled={createDocumentMutation.isPending || !docForm.file_url || !docForm.document_name}>
                        {createDocumentMutation.isPending ? 'Adding...' : 'Add Document'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
            
            <div className="flex gap-4 mb-6">
              <Input placeholder="Search documents..." value={docSearchQuery} onChange={(e) => setDocSearchQuery(e.target.value)} className="max-w-xs" />
              <select value={docCategoryFilter} onChange={(e) => setDocCategoryFilter(e.target.value)} className="flex h-10 items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm w-48">
                <option value="All">All Categories</option>
                <option value="Employment Contract">Employment Contract</option>
                <option value="Offer Letter">Offer Letter</option>
                <option value="Government ID">Government ID</option>
                <option value="Passport Photograph">Passport Photograph</option>
                <option value="Certificates & Qualifications">Certificates & Qualifications</option>
                <option value="Compliance Forms">Compliance Forms</option>
                <option value="Guarantor Documents">Guarantor Documents</option>
                <option value="Promotion Letters">Promotion Letters</option>
                <option value="Payroll Support Documents">Payroll Support Documents</option>
                <option value="Exit Documents">Exit Documents</option>
                <option value="Miscellaneous HR Documents">Miscellaneous HR Documents</option>
              </select>
            </div>
            
            {filteredDocs.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                <p className="text-slate-500">No documents match your search.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredDocs.map(doc => (
                  <div key={doc.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{doc.document_name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline">{doc.category}</Badge>
                          <Badge variant="secondary" className="bg-slate-200 text-slate-700">{doc.visibilityLevel === 'hr_only' ? 'HR Only' : doc.visibilityLevel === 'manager' ? 'Manager+' : 'Employee+'}</Badge>
                          <Badge variant="secondary" className="bg-blue-100 text-blue-700">v{doc.currentVersion || 1}</Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="ghost" onClick={() => { setSelectedDocHistory(doc); setShowHistoryDialog(true); }}>
                        History
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => { setDocToReplace(doc); setShowReplaceDialog(true); }}>
                        Replace
                      </Button>
                      {doc.file_url && (
                        <Button size="sm" variant="ghost" asChild>
                          <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                            <Download className="w-4 h-4" />
                          </a>
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => deleteDocumentMutation.mutate(doc.id)} disabled={deleteDocumentMutation.isPending}>
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Replace Document Dialog */}
            <Dialog open={showReplaceDialog} onOpenChange={setShowReplaceDialog}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Replace Document Version</DialogTitle>
                </DialogHeader>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  if (docToReplace) {
                    replaceDocumentVersionMutation.mutate({
                      id: docToReplace.id,
                      fileUrl: replaceForm.file_url,
                      fileType: replaceForm.file_type,
                      fileSize: replaceForm.file_size
                    });
                  }
                }} className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-sm text-slate-600 mb-2">Replacing: <strong>{docToReplace?.document_name}</strong> (Current v{docToReplace?.currentVersion || 1})</p>
                    <Label htmlFor="replace-upload">New File</Label>
                    <input type="file" onChange={handleReplaceDocUpload} className="hidden" id="replace-upload" />
                    <Button type="button" variant="outline" className="w-full" onClick={() => document.getElementById('replace-upload').click()} disabled={uploadingFile}>
                      <Upload className="w-4 h-4 mr-2" />
                      {uploadingFile ? 'Uploading...' : replaceForm.file_url ? 'Change File' : 'Upload New Version'}
                    </Button>
                    {replaceForm.file_name && <p className="text-sm text-slate-500">Selected file: {replaceForm.file_name}</p>}
                  </div>
                  <div className="flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={() => { setShowReplaceDialog(false); setReplaceForm({ file_url: '', file_name: '', file_type: 'PDF', file_size: 0 }); }}>Cancel</Button>
                    <Button type="submit" disabled={replaceDocumentVersionMutation.isPending || !replaceForm.file_url}>
                      {replaceDocumentVersionMutation.isPending ? 'Replacing...' : 'Upload New Version'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            {/* Document History Dialog */}
            <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Version History: {selectedDocHistory?.document_name}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                  {documentHistory.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-4">No previous versions.</p>
                  ) : (
                    <div className="space-y-3">
                      {documentHistory.map(hist => (
                        <div key={hist.id} className="flex justify-between items-center p-3 border border-slate-200 rounded-lg">
                          <div>
                            <p className="font-medium">Version {hist.version}</p>
                            <p className="text-xs text-slate-500">Uploaded {format(new Date(parseInt(hist.createdAt)), 'PPpp')}</p>
                          </div>
                          <Button size="sm" variant="outline" asChild>
                            <a href={hist.fileUrl} target="_blank" rel="noopener noreferrer">View</a>
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        );\`;

content = content.replace(oldDocUI, newDocUI);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully patched EmployeeDetail.jsx');
