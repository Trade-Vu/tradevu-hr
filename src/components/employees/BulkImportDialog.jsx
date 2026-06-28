
import React, { useState } from "react";
import { gqlClient } from "@/api/graphqlClient";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, Download, CheckCircle, AlertCircle, Loader2, FileSpreadsheet } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function BulkImportDialog({ open, onClose, onImport, isImporting, templates, departments }) {
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [errors, setErrors] = useState([]);
  const [processing, setProcessing] = useState(false);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setParsedData(null);
      setErrors([]);
    }
  };

  const downloadTemplate = () => {
    const csvContent = `full_name,email,job_title,department_id,template_id,start_date,phone,status
John Doe,john@example.com,Software Engineer,dept_001,template_001,2024-01-15,+966501234567,not_started
Jane Smith,jane@example.com,HR Manager,dept_002,template_002,2024-02-01,+966501234568,not_started`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'eonhr_employee_import_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const validateEmployee = (employee, index) => {
    const rowErrors = [];
    
    if (!employee.full_name || employee.full_name.trim() === '') {
      rowErrors.push(`Row ${index + 1}: Full name is required`);
    }
    
    if (!employee.email || employee.email.trim() === '') {
      rowErrors.push(`Row ${index + 1}: Email is required`);
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(employee.email)) {
      rowErrors.push(`Row ${index + 1}: Invalid email format`);
    }
    
    if (!employee.job_title || employee.job_title.trim() === '') {
      rowErrors.push(`Row ${index + 1}: Job title is required`);
    }
    
    if (!employee.start_date || employee.start_date.trim() === '') {
      rowErrors.push(`Row ${index + 1}: Start date is required`);
    }
    
    return rowErrors;
  };

  const handleProcessFile = async () => {
    if (!file) return;

    setProcessing(true);
    setErrors([]);

    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim() !== '');
      if (lines.length < 2) {
        setErrors(['File appears to be empty or missing headers.']);
        setProcessing(false);
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim());
      const employees = [];
      const allErrors = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const emp = {};
        
        headers.forEach((header, index) => {
          emp[header] = values[index] || '';
        });

        const empErrors = validateEmployee(emp, i);
        if (empErrors.length > 0) {
          allErrors.push(...empErrors);
        } else {
          employees.push({
            ...emp,
            status: emp.status || 'not_started',
            progress_percentage: 0,
            welcome_sent: false,
          });
        }
      }

      if (allErrors.length > 0) {
        setErrors(allErrors);
      } else {
        setParsedData(employees);
      }

    } catch (error) {
      console.error("Error processing file:", error);
      setErrors([`Error processing file: ${error.message}`]);
    }

    setProcessing(false);
  };

  const handleImport = () => {
    if (parsedData && parsedData.length > 0) {
      onImport(parsedData);
    }
  };

  const handleClose = () => {
    setFile(null);
    setParsedData(null);
    setErrors([]);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-blue-600" />
            Bulk Import Employees
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Instructions */}
          <Alert>
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium">How to import employees:</p>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  <li>Download the CSV template below</li>
                  <li>Fill in employee information (required: full_name, email, job_title, start_date)</li>
                  <li>Upload the completed CSV file</li>
                  <li>Review the data and click Import</li>
                </ol>
              </div>
            </AlertDescription>
          </Alert>

          {/* Download Template Button */}
          <Button onClick={downloadTemplate} variant="outline" className="w-full">
            <Download className="w-4 h-4 mr-2" />
            Download CSV Template
          </Button>

          {/* File Upload */}
          <div className="space-y-4">
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-slate-400 transition-colors">
              <input
                type="file"
                id="csv-file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <label htmlFor="csv-file" className="cursor-pointer">
                <Upload className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                <p className="text-lg font-medium text-slate-700 mb-2">
                  {file ? file.name : 'Click to upload CSV file'}
                </p>
                <p className="text-sm text-slate-500">
                  or drag and drop your CSV file here
                </p>
              </label>
            </div>

            {file && !parsedData && (
              <Button 
                onClick={handleProcessFile} 
                disabled={processing}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Process File
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Errors */}
          {errors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>
                <p className="font-medium mb-2">Validation Errors:</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Preview Data */}
          {parsedData && parsedData.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">
                  Preview ({parsedData.length} employee{parsedData.length !== 1 ? 's' : ''})
                </h3>
                <Badge variant="outline" className="bg-green-50 text-green-700">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Ready to Import
                </Badge>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <div className="max-h-96 overflow-y-auto">
                  <Table>
                    <TableHeader className="bg-slate-50 sticky top-0">
                      <TableRow>
                        <TableHead>Full Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Job Title</TableHead>
                        <TableHead>Start Date</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedData.map((employee, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{employee.full_name}</TableCell>
                          <TableCell>{employee.email}</TableCell>
                          <TableCell>{employee.job_title}</TableCell>
                          <TableCell>{employee.start_date}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{employee.status}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <Alert>
                <AlertCircle className="w-4 h-4" />
                <AlertDescription className="text-sm">
                  <strong>Note:</strong> Welcome emails will be sent to all imported employees automatically.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <Button variant="outline" onClick={handleClose} isLoading={isImporting}>
              Cancel
            </Button>
            {parsedData && parsedData.length > 0 && (
              <Button 
                onClick={handleImport}
                isLoading={isImporting}
                className="bg-green-600 hover:bg-green-700"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Importing {parsedData.length} employee{parsedData.length !== 1 ? 's' : ''}...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Import {parsedData.length} Employee{parsedData.length !== 1 ? 's' : ''}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
