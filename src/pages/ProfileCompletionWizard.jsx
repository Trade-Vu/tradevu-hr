import React, { useState, useRef } from "react";
import countryList from 'country-list';
import { gqlClient } from "@/api/graphqlClient";
import { gql } from "graphql-request";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Clock, CheckCircle2, AlertCircle, FileSpreadsheet, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";
import { uploadToCloudinary } from "@/utils/cloudinary";
import { isFeatureEnabled } from "@/lib/featureFlags";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

const UPDATE_EMPLOYEE = gql`
  mutation UpdateEmployeeSelf($input: UpdateEmployeeInput!) {
    updateEmployeeSelf(input: $input) {
      id
    }
  }
`;

const GET_EMPLOYEE = gql`
  query GetEmployee($id: ID!) {
    employee(id: $id) {
      id
      phone
      workEmail
      privateEmail
      dateOfBirth
      gender
      maritalStatus
      nationality
      nationalId
      passportNumber
    }
  }
`;

const UPLOAD_DOCUMENT = gql`
  mutation UploadDocument($employeeId: ID!, $name: String!, $category: String!, $fileUrl: String!, $fileType: String!, $visibilityLevel: String!) {
    uploadDocument(employeeId: $employeeId, name: $name, category: $category, fileUrl: $fileUrl, fileType: $fileType, visibilityLevel: $visibilityLevel) {
      id
    }
  }
`;

const CLEAR_PROFILE_GATE = gql`
  mutation ClearProfileGate {
    clearProfileGate {
      id
      mustCompleteProfile
    }
  }
`;

const BULK_IMPORT_EMPLOYEES = gql`
  mutation BulkImportEmployees($employees: [BulkImportEmployeeInput!]!) {
    bulkImportEmployees(employees: $employees) {
      id
      fullName
      email
    }
  }
`;

/**
 * Expected CSV columns: fullName, email, jobTitle, departmentId, employmentType, hireDate, basicSalary
 * Returns array of parsed employee objects.
 */
function parseEmployeeCSV(csvText) {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) throw new Error('CSV must have a header row and at least one data row.');
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const required = ['fullName', 'email', 'jobTitle', 'hireDate'];
  const missing = required.filter(r => !headers.includes(r));
  if (missing.length) throw new Error(`CSV is missing required columns: ${missing.join(', ')}`);
  return lines.slice(1).filter(l => l.trim()).map(line => {
    const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
    const row = {};
    headers.forEach((h, i) => { row[h] = values[i] || ''; });
    if (!row.fullName || !row.email || !row.jobTitle || !row.hireDate) {
      throw new Error(`Row is missing required fields: ${JSON.stringify(row)}`);
    }
    return {
      fullName: row.fullName,
      email: row.email,
      jobTitle: row.jobTitle,
      departmentId: row.departmentId || undefined,
      employmentType: row.employmentType || 'FULL_TIME',
      hireDate: row.hireDate,
      basicSalary: row.basicSalary ? parseFloat(row.basicSalary) : undefined,
    };
  });
}

export default function ProfileCompletionWizard() {
  const { user, checkAppState } = useAuth();
  const employeeId = user?.employeeId;
  const isHRAdmin = user?.role === 'HR_ADMIN';
  // HR admins get an extra Step 3 for CSV import (if feature is enabled)
  const hasCSVStep = isHRAdmin && isFeatureEnabled('CSV_IMPORT');
  const totalSteps = hasCSVStep ? 3 : 2;
  const [step, setStep] = useState(1);

  // CSV Import state (HR Step 3)
  const [csvFile, setCsvFile] = useState(null);
  const [csvPreview, setCsvPreview] = useState([]);
  const [csvError, setCsvError] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importResults, setImportResults] = useState(null);
  const csvInputRef = useRef(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [identityType, setIdentityType] = useState("nationalId");
  const [nationalityOpen, setNationalityOpen] = useState(false);
  const [identityNumber, setIdentityNumber] = useState('');
  
  const [formData, setFormData] = useState({
    phone: '',
    privateEmail: '',
    dateOfBirth: '',
    gender: '',
    maritalStatus: '',
    nationality: '',
    nationalId: '',
    passportNumber: ''
  });

  const { data: employeeDataObj } = useQuery({
    queryKey: ['employee', employeeId],
    queryFn: () => gqlClient.request(GET_EMPLOYEE, { id: employeeId }),
    enabled: !!employeeId
  });

  React.useEffect(() => {
    if (employeeDataObj?.employee) {
      const emp = employeeDataObj.employee;
      let formattedDob = '';
      if (emp.dateOfBirth) {
        try {
          // Attempt to format dateOfBirth into YYYY-MM-DD
          const d = new Date(Number(emp.dateOfBirth) || emp.dateOfBirth);
          if (!isNaN(d.getTime())) {
            formattedDob = d.toISOString().split('T')[0];
          }
        } catch (e) {
          // Ignore date parse errors
        }
      }

      setFormData(prev => ({
        ...prev,
        phone: emp.phone || prev.phone,
        privateEmail: emp.privateEmail || prev.privateEmail,
        dateOfBirth: formattedDob || prev.dateOfBirth,
        gender: emp.gender || prev.gender,
        maritalStatus: emp.maritalStatus || prev.maritalStatus,
        nationality: emp.nationality || prev.nationality,
        nationalId: emp.nationalId || prev.nationalId,
        passportNumber: emp.passportNumber || prev.passportNumber,
      }));
    }
  }, [employeeDataObj]);

  const [documentData, setDocumentData] = useState({
    name: 'ID Document',
    category: 'Identity',
    file: null
  });

  const handleNext = () => {
    // Validate step 1: personal info
    if (step === 1) {
      if (!formData.phone || !formData.privateEmail || !formData.dateOfBirth || !formData.gender || !formData.maritalStatus || !formData.nationality) {
        toast.error("Please fill in all personal information fields");
        return;
      }
      setStep(2);
    }
    // Step 2 -> Step 3 (HR CSV) is handled by handleSubmit advancing to step 3
  };

  const handleBack = () => {
    setStep(prev => prev - 1);
  };

  const handleCSVFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCsvFile(file);
    setCsvError('');
    setImportResults(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = parseEmployeeCSV(event.target.result);
        setCsvPreview(parsed.slice(0, 5)); // Show first 5 rows as preview
      } catch (err) {
        setCsvError(err.message);
        setCsvPreview([]);
        setCsvFile(null);
      }
    };
    reader.readAsText(file);
  };

  const handleCSVImport = async () => {
    if (!csvFile) { toast.error("Please select a CSV file first"); return; }
    try {
      setIsImporting(true);
      const text = await csvFile.text();
      const employees = parseEmployeeCSV(text);
      const result = await gqlClient.request(BULK_IMPORT_EMPLOYEES, { employees });
      setImportResults(result.bulkImportEmployees);
      toast.success(`Successfully imported ${result.bulkImportEmployees.length} employees!`);
    } catch (err) {
      console.error('CSV import error:', err);
      toast.error(err.message || 'Failed to import employees. Please check your CSV format.');
    } finally {
      setIsImporting(false);
    }
  };

  const handleSubmit = async () => {
    if (!identityNumber) {
      toast.error("Please enter your identity document number");
      return;
    }
    if (!documentData.file) {
      toast.error("Please select a document to upload");
      return;
    }

    try {
      setIsSubmitting(true);
      
      const finalFormData = { 
        ...formData, 
        nationalId: identityType === 'nationalId' ? identityNumber : '', 
        passportNumber: identityType === 'passport' ? identityNumber : '' 
      };

      // 1. Update Employee Profile
      await gqlClient.request(UPDATE_EMPLOYEE, { input: finalFormData });
      
      // 2. Upload Document to Cloudinary
      const uploadResult = await uploadToCloudinary(documentData.file);
      if (!uploadResult || !uploadResult.secure_url) {
        console.error("Cloudinary uploadResult:", uploadResult);
        throw new Error("Failed to upload document to cloud storage: missing secure_url");
      }
      
      // 3. Save Document Record
      await gqlClient.request(UPLOAD_DOCUMENT, {
        employeeId,
        name: documentData.name,
        category: documentData.category,
        fileUrl: uploadResult.secure_url,
        fileType: documentData.file.name.split('.').pop() || 'pdf',
        visibilityLevel: 'employee'
      });
      
      // 4. Clear the gate — or if HR with CSV step, advance to step 3 instead
      if (hasCSVStep) {
        toast.success("Identity verified! Now let's import your employees.");
        setStep(3);
      } else {
        await gqlClient.request(CLEAR_PROFILE_GATE);
        toast.success("Profile completed successfully!");
        // Re-fetch user data so App.jsx redirects to Dashboard
        await checkAppState();
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to complete profile. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // After CSV import, clear the profile gate and go to dashboard
  const handleFinishAfterCSV = async () => {
    try {
      setIsSubmitting(true);
      await gqlClient.request(CLEAR_PROFILE_GATE);
      toast.success("Setup complete! Taking you to your dashboard...");
      await checkAppState();
    } catch (error) {
      console.error(error);
      toast.error("Failed to finalize setup. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Welcome to Tradevu!</h1>
          <p className="text-slate-600 mt-2">Please complete your employee profile to get started.</p>
        </div>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-slate-500">Step {step} of {totalSteps}</span>
              <div className="flex gap-1">
                {Array.from({ length: totalSteps }, (_, i) => i + 1).map(i => (
                  <div key={i} className={`h-2 w-16 rounded-full ${i <= step ? 'bg-indigo-600' : 'bg-slate-200'}`} />
                ))}
              </div>
            </div>
            <CardTitle>
              {step === 1 ? 'Personal Information' : step === 2 ? 'Identity Verification' : 'Import Employees'}
            </CardTitle>
            <CardDescription>
              {step === 1 && 'Please provide your basic contact and demographic details.'}
              {step === 2 && 'Please select an identity document type, provide its number, and upload a clear copy.'}
              {step === 3 && 'Upload a CSV file to bulk-import your existing employees into the system.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {step === 1 && (
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Private Email <span className="text-red-500">*</span></Label>
                  <Input 
                    type="email" 
                    value={formData.privateEmail} 
                    onChange={e => setFormData(p => ({...p, privateEmail: e.target.value}))} 
                    placeholder="you@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone Number <span className="text-red-500">*</span></Label>
                  <Input 
                    value={formData.phone} 
                    onChange={e => setFormData(p => ({...p, phone: e.target.value}))} 
                    placeholder="+1234567890"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date of Birth <span className="text-red-500">*</span></Label>
                  <Input 
                    type="date" 
                    value={formData.dateOfBirth} 
                    onChange={e => setFormData(p => ({...p, dateOfBirth: e.target.value}))} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Gender <span className="text-red-500">*</span></Label>
                  <Select value={formData.gender} onValueChange={val => setFormData(p => ({...p, gender: val}))}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select Gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Marital Status <span className="text-red-500">*</span></Label>
                  <Select value={formData.maritalStatus} onValueChange={val => setFormData(p => ({...p, maritalStatus: val}))}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Single">Single</SelectItem>
                      <SelectItem value="Married">Married</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Nationality <span className="text-red-500">*</span></Label>
                  <Popover open={nationalityOpen} onOpenChange={setNationalityOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={nationalityOpen}
                        className="w-full justify-between font-normal"
                      >
                        {formData.nationality || "Select Nationality"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search nationality..." />
                        <CommandList>
                          <CommandEmpty>No nationality found.</CommandEmpty>
                          <CommandGroup>
                            {countryList.getNames().sort((a, b) => a.localeCompare(b)).map((country) => (
                              <CommandItem
                                key={country}
                                value={country}
                                onSelect={(currentValue) => {
                                  setFormData(p => ({...p, nationality: currentValue}));
                                  setNationalityOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    formData.nationality === country ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {country}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Document Type <span className="text-red-500">*</span></Label>
                    <Select value={identityType} onValueChange={setIdentityType}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Document Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="nationalId">National ID (NIN)</SelectItem>
                        <SelectItem value="passport">Passport</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Document Number <span className="text-red-500">*</span></Label>
                    <Input 
                      value={identityNumber} 
                      onChange={e => setIdentityNumber(e.target.value)} 
                      placeholder={identityType === 'nationalId' ? 'Enter NIN' : 'Enter Passport Number'}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Upload Document <span className="text-red-500">*</span></Label>
                  <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:bg-slate-50 transition-colors">
                    <input
                      type="file"
                      id="document-upload"
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          setDocumentData(p => ({ ...p, file }));
                        }
                      }}
                    />
                    <Label htmlFor="document-upload" className="cursor-pointer flex flex-col items-center">
                      <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-3">
                        <Upload className="w-6 h-6" />
                      </div>
                      <span className="text-sm font-medium text-slate-700">
                        {documentData.file ? documentData.file.name : "Click to select a file"}
                      </span>
                      <span className="text-xs text-slate-500 mt-1">PDF, JPG, or PNG up to 10MB</span>
                    </Label>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3 — HR Admin CSV Import (feature-flagged) */}
            {step === 3 && hasCSVStep && (
              <div className="space-y-6">
                {importResults ? (
                  <div className="text-center py-6 space-y-4">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="font-semibold text-slate-900">Import successful!</h3>
                    <p className="text-slate-600 text-sm">{importResults.length} employees imported into the system.</p>
                  </div>
                ) : (
                  <>
                    <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 text-sm text-indigo-800">
                      <p className="font-semibold mb-1">Required CSV columns:</p>
                      <code className="text-xs bg-white/60 px-2 py-0.5 rounded">fullName, email, jobTitle, hireDate</code>
                      <p className="mt-1 text-xs opacity-75">Optional: departmentId, employmentType, basicSalary</p>
                    </div>

                    <div
                      className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:bg-slate-50 transition-colors cursor-pointer"
                      onClick={() => csvInputRef.current?.click()}
                    >
                      <input
                        ref={csvInputRef}
                        type="file"
                        className="hidden"
                        accept=".csv"
                        onChange={handleCSVFileChange}
                        data-testid="csv-file-input"
                      />
                      <FileSpreadsheet className="w-10 h-10 text-indigo-400 mx-auto mb-3" />
                      <p className="text-sm font-medium text-slate-700">
                        {csvFile ? csvFile.name : 'Click to select a CSV file'}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">CSV format only</p>
                    </div>

                    {csvError && (
                      <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-lg text-red-700 text-sm">
                        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                        {csvError}
                      </div>
                    )}

                    {csvPreview.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-slate-700">Preview (first {csvPreview.length} rows):</p>
                        <div className="overflow-x-auto rounded-lg border border-slate-200">
                          <table className="w-full text-xs">
                            <thead className="bg-slate-50">
                              <tr>
                                {Object.keys(csvPreview[0]).map(col => (
                                  <th key={col} className="px-3 py-2 text-left font-medium text-slate-600">{col}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {csvPreview.map((row, i) => (
                                <tr key={i} className="border-t border-slate-100">
                                  {Object.values(row).map((val, j) => (
                                    <td key={j} className="px-3 py-2 text-slate-700 truncate max-w-[120px]">{val}</td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            <div className="flex justify-between pt-6 border-t border-slate-100">
              {step > 1 && !importResults ? (
                <Button variant="outline" onClick={handleBack} disabled={isSubmitting || isImporting}>
                  Back
                </Button>
              ) : <div></div>}
              
              {step < 2 && (
                <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={handleNext}>
                  Continue
                </Button>
              )}
              {step === 2 && (
                <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? "Submitting..." : hasCSVStep ? "Continue to Import" : "Complete Profile"}
                </Button>
              )}
              {step === 3 && !importResults && (
                <div className="flex gap-3">
                  <Button variant="outline" onClick={handleFinishAfterCSV} disabled={isSubmitting || isImporting}>
                    Skip &amp; Finish
                  </Button>
                  <Button
                    className="bg-indigo-600 hover:bg-indigo-700"
                    onClick={handleCSVImport}
                    disabled={!csvFile || isImporting || !!csvError}
                    data-testid="csv-import-btn"
                  >
                    {isImporting ? "Importing..." : "Import Employees"}
                  </Button>
                </div>
              )}
              {step === 3 && importResults && (
                <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={handleFinishAfterCSV} disabled={isSubmitting}>
                  {isSubmitting ? "Finishing..." : "Go to Dashboard"}
                </Button>
              )}
            </div>
            
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
