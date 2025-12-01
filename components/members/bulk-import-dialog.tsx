'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Upload, Download, CheckCircle2, AlertCircle, FileSpreadsheet } from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

interface BulkImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unionId: number;
  onSuccess: () => void;
}

interface ParsedMember {
  email: string;
  name: string;
  role?: string;
  status?: string;
  row: number;
}

interface ValidationResult {
  valid: ParsedMember[];
  invalid: { row: number; reason: string; data: any }[];
  duplicates: { email: string; rows: number[] }[];
}

export function BulkImportDialog({
  open,
  onOpenChange,
  unionId,
  onSuccess,
}: BulkImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState('');
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setError('');
    setValidationResult(null);

    // Parse and validate the file
    setParsing(true);
    try {
      const result = await parseFile(selectedFile);
      setValidationResult(result);
    } catch (err: any) {
      setError(err.message || 'Failed to parse file');
    } finally {
      setParsing(false);
    }
  };

  const parseFile = async (file: File): Promise<ValidationResult> => {
    const fileExt = file.name.split('.').pop()?.toLowerCase();

    if (fileExt === 'csv') {
      return parseCSV(file);
    } else if (fileExt === 'xlsx' || fileExt === 'xls') {
      return parseExcel(file);
    } else {
      throw new Error('Unsupported file type. Please upload a CSV or Excel file.');
    }
  };

  const parseCSV = (file: File): Promise<ValidationResult> => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          try {
            const validated = validateMembers(results.data);
            resolve(validated);
          } catch (err) {
            reject(err);
          }
        },
        error: (err) => {
          reject(new Error(`CSV parse error: ${err.message}`));
        },
      });
    });
  };

  const parseExcel = async (file: File): Promise<ValidationResult> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          const validated = validateMembers(jsonData);
          resolve(validated);
        } catch (err: any) {
          reject(new Error(`Excel parse error: ${err.message}`));
        }
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsBinaryString(file);
    });
  };

  const validateMembers = (data: any[]): ValidationResult => {
    const valid: ParsedMember[] = [];
    const invalid: { row: number; reason: string; data: any }[] = [];
    const emailMap = new Map<string, number[]>();

    data.forEach((row, index) => {
      const rowNum = index + 2; // +2 because row 1 is header and arrays are 0-indexed

      // Normalize column names (case-insensitive, trim whitespace)
      const normalizedRow: any = {};
      Object.keys(row).forEach((key) => {
        normalizedRow[key.toLowerCase().trim()] = row[key];
      });

      // Extract email and name
      const email = normalizedRow.email?.toString().trim().toLowerCase();
      const name = normalizedRow.name?.toString().trim();
      const role = normalizedRow.role?.toString().trim() || 'member';
      const status = normalizedRow.status?.toString().trim() || 'pending';

      // Validate email
      if (!email) {
        invalid.push({ row: rowNum, reason: 'Missing email', data: row });
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        invalid.push({ row: rowNum, reason: 'Invalid email format', data: row });
        return;
      }

      // Validate name
      if (!name) {
        invalid.push({ row: rowNum, reason: 'Missing name', data: row });
        return;
      }

      // Track duplicates
      if (!emailMap.has(email)) {
        emailMap.set(email, []);
      }
      emailMap.get(email)!.push(rowNum);

      // Add to valid list
      valid.push({ email, name, role, status, row: rowNum });
    });

    // Find duplicates
    const duplicates: { email: string; rows: number[] }[] = [];
    emailMap.forEach((rows, email) => {
      if (rows.length > 1) {
        duplicates.push({ email, rows });
      }
    });

    return { valid, invalid, duplicates };
  };

  const handleImport = async () => {
    if (!validationResult || validationResult.valid.length === 0) {
      setError('No valid members to import');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Remove duplicates (keep only the first occurrence)
      const uniqueMembers = validationResult.valid.filter((member, index, self) =>
        index === self.findIndex((m) => m.email === member.email)
      );

      const response = await fetch(`/api/union/${unionId}/members/bulk-import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ members: uniqueMembers }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to import members');
      }

      const data = await response.json();
      onSuccess();
      onOpenChange(false);
      setFile(null);
      setValidationResult(null);
    } catch (err: any) {
      setError(err.message || 'Failed to import members');
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const template = 'email,name,role,status\n' +
      'john.doe@example.com,John Doe,member,pending\n' +
      'jane.smith@example.com,Jane Smith,owner,approved\n';

    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'member-import-template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Import Members</DialogTitle>
          <DialogDescription>
            Import multiple members from a CSV or Excel file
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Template Download */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <FileSpreadsheet className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-blue-900 mb-1">Need a template?</p>
                <p className="text-sm text-blue-700 mb-2">
                  Download our template to see the required format
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadTemplate}
                  className="border-blue-300 text-blue-700 hover:bg-blue-100"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download Template
                </Button>
              </div>
            </div>
          </div>

          {/* File Upload */}
          <div>
            <Label htmlFor="file">Upload File</Label>
            <Input
              id="file"
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              disabled={loading || parsing}
            />
            <p className="text-xs text-gray-500 mt-1">
              Required columns: email, name. Optional: role, status
            </p>
          </div>

          {/* Parsing Status */}
          {parsing && (
            <div className="flex items-center gap-2 text-blue-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Parsing file...</span>
            </div>
          )}

          {/* Validation Results */}
          {validationResult && !parsing && (
            <div className="space-y-3">
              {/* Valid Members */}
              {validationResult.valid.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-900">
                      {validationResult.valid.length} valid member{validationResult.valid.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  {validationResult.duplicates.length > 0 && (
                    <p className="text-sm text-green-700">
                      Note: {validationResult.duplicates.length} duplicate email{validationResult.duplicates.length !== 1 ? 's' : ''} found. Only first occurrence will be imported.
                    </p>
                  )}
                </div>
              )}

              {/* Invalid Members */}
              {validationResult.invalid.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <span className="font-medium text-red-900">
                      {validationResult.invalid.length} invalid row{validationResult.invalid.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="max-h-40 overflow-y-auto">
                    <ul className="text-sm text-red-700 space-y-1">
                      {validationResult.invalid.slice(0, 10).map((item, idx) => (
                        <li key={idx}>
                          Row {item.row}: {item.reason}
                        </li>
                      ))}
                      {validationResult.invalid.length > 10 && (
                        <li>... and {validationResult.invalid.length - 10} more</li>
                      )}
                    </ul>
                  </div>
                </div>
              )}

              {/* Duplicates Warning */}
              {validationResult.duplicates.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                    <span className="font-medium text-yellow-900">
                      Duplicate emails found
                    </span>
                  </div>
                  <div className="max-h-40 overflow-y-auto">
                    <ul className="text-sm text-yellow-700 space-y-1">
                      {validationResult.duplicates.slice(0, 5).map((item, idx) => (
                        <li key={idx}>
                          {item.email} (rows: {item.rows.join(', ')})
                        </li>
                      ))}
                      {validationResult.duplicates.length > 5 && (
                        <li>... and {validationResult.duplicates.length - 5} more</li>
                      )}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              setFile(null);
              setValidationResult(null);
              setError('');
            }}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={loading || parsing || !validationResult || validationResult.valid.length === 0}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Import {validationResult?.valid.length || 0} Members
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
