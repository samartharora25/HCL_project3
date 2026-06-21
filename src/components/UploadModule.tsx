import React, { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { detectDataSheetName, parseSheetData, ParseResult } from '../lib/parsing';
import { Card, Button, Badge } from './ui';
import { UploadCloud, FileSpreadsheet, AlertCircle, CheckCircle2 } from 'lucide-react';

export function UploadModule({ onDataReady }: { onDataReady: (data: ParseResult) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [status, setStatus] = useState<'idle' | 'parsing' | 'sheet_selection' | 'validation' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    
    // Check extension
    if (!selected.name.match(/\.(xlsx|xls|csv)$/)) {
      setStatus('error');
      setErrorMessage('Invalid file type. Please upload a .xlsx, .xls, or .csv file.');
      return;
    }
    
    setFile(selected);
    setStatus('parsing');
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const wb = XLSX.read(data, { type: 'binary', cellDates: true });
        setWorkbook(wb);
        
        const detectedSheet = detectDataSheetName(wb);
        if (detectedSheet) {
          processSheet(wb, detectedSheet);
        } else {
          setStatus('sheet_selection');
        }
      } catch (err) {
        setStatus('error');
        setErrorMessage('Failed to parse file. It may be password-protected or corrupt.');
      }
    };
    reader.onerror = () => {
      setStatus('error');
      setErrorMessage('Failed to read file from disk.');
    };
    reader.readAsBinaryString(selected);
  };

  const processSheet = (wb: XLSX.WorkBook, sheetName: string) => {
    setStatus('parsing');
    // Allow UI to update before heavy parse
    setTimeout(() => {
      try {
        const result = parseSheetData(wb, sheetName);
        if (result.totalRows === 0) {
          setStatus('error');
          setErrorMessage('The selected sheet contains no data rows after the header.');
          return;
        }
        setParseResult(result);
        setStatus('validation');
      } catch (err) {
        setStatus('error');
        setErrorMessage('An error occurred while parsing the sheet data.');
      }
    }, 100);
  };

  const downloadErrorCsv = () => {
    if (!parseResult) return;
    const { errors } = parseResult.validationResult;
    let csvContent = "data:text/csv;charset=utf-8,Row Number,Errors\n";
    errors.forEach(err => {
      const escapedErrors = `"${err.reasons.join('; ')}"`;
      csvContent += `${err.row},${escapedErrors}\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "validation_errors.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (status === 'error') {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '32px' }}>
          <AlertCircle size={48} color="var(--hcl-error-text)" style={{ marginBottom: '16px' }} />
          <h2 style={{ marginBottom: '8px' }}>Upload Failed</h2>
          <p style={{ color: 'var(--hcl-neutral-400)', marginBottom: '24px' }}>{errorMessage}</p>
          <Button onClick={() => setStatus('idle')}>Try Again</Button>
        </div>
      </Card>
    );
  }

  if (status === 'sheet_selection' && workbook) {
    return (
      <Card>
        <div style={{ marginBottom: '24px' }}>
          <h2>Select Data Sheet</h2>
          <p style={{ color: 'var(--hcl-neutral-400)' }}>
            We couldn't automatically determine which sheet contains the fulfillment data. Please select it below.
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {workbook.SheetNames.map(name => {
            const range = XLSX.utils.decode_range(workbook.Sheets[name]['!ref'] || 'A1');
            const rows = range.e.r - range.s.r;
            const cols = range.e.c - range.s.c;
            return (
              <div key={name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', border: '1px solid var(--hcl-neutral-200)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <FileSpreadsheet size={20} color="var(--hcl-purple)" />
                  <div>
                    <div style={{ fontWeight: 600 }}>{name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--hcl-neutral-400)' }}>{rows} rows × {cols} columns</div>
                  </div>
                </div>
                <Button variant="secondary" onClick={() => processSheet(workbook, name)}>Use Sheet</Button>
              </div>
            );
          })}
        </div>
      </Card>
    );
  }

  if (status === 'validation' && parseResult) {
    const { validData, errors } = parseResult.validationResult;
    const hasErrors = errors.length > 0;
    
    return (
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              {hasErrors ? <AlertCircle size={24} color="var(--hcl-warning-text)" /> : <CheckCircle2 size={24} color="var(--hcl-success-text)" />}
              Validation Summary
            </h2>
            <p style={{ color: 'var(--hcl-neutral-400)', margin: '8px 0 0 0' }}>
              Processed {parseResult.totalRows} rows from '{parseResult.sheetName}'
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            {hasErrors && <Button variant="outline" onClick={downloadErrorCsv}>Download Error Report</Button>}
            <Button onClick={() => onDataReady(parseResult)}>Continue with {validData.length} valid rows</Button>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
          <div style={{ flex: 1, padding: '16px', backgroundColor: 'var(--hcl-success-bg)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--hcl-success-text)' }}>{validData.length}</div>
            <div style={{ color: 'var(--hcl-success-text)' }}>Valid Rows Ready</div>
          </div>
          <div style={{ flex: 1, padding: '16px', backgroundColor: hasErrors ? 'var(--hcl-error-bg)' : 'var(--hcl-neutral-100)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: hasErrors ? 'var(--hcl-error-text)' : 'var(--hcl-neutral-400)' }}>{errors.length}</div>
            <div style={{ color: hasErrors ? 'var(--hcl-error-text)' : 'var(--hcl-neutral-400)' }}>Rows with Errors</div>
          </div>
        </div>
        
        {hasErrors && (
          <div>
            <h3 style={{ fontSize: '16px', marginBottom: '16px' }}>Preview of Failing Rows</h3>
            <div style={{ overflowX: 'auto', border: '1px solid var(--hcl-neutral-200)', borderRadius: 'var(--radius-sm)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead style={{ backgroundColor: 'var(--hcl-neutral-100)' }}>
                  <tr>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid var(--hcl-neutral-200)' }}>Row Ref</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid var(--hcl-neutral-200)' }}>Errors Found</th>
                  </tr>
                </thead>
                <tbody>
                  {errors.slice(0, 10).map((err, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--hcl-neutral-100)' }}>
                      <td style={{ padding: '12px', color: 'var(--hcl-neutral-400)' }}>Row {err.row}</td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {err.reasons.map((reason, j) => (
                            <Badge key={j} variant="error">{reason}</Badge>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {errors.length > 10 && (
              <div style={{ textAlign: 'center', padding: '12px', color: 'var(--hcl-neutral-400)', fontSize: '14px' }}>
                Showing 10 of {errors.length} errors. Download the report for the full list.
              </div>
            )}
          </div>
        )}
      </Card>
    );
  }

  // Idle state
  return (
    <Card>
      <div style={{ textAlign: 'center', padding: '48px 24px' }}>
        <div style={{ 
          width: '64px', height: '64px', borderRadius: '50%', 
          backgroundColor: 'var(--hcl-purple-tint-10)', 
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px auto'
        }}>
          <UploadCloud size={32} color="var(--hcl-purple)" />
        </div>
        <h2 style={{ marginBottom: '8px' }}>Upload Fulfillment Data</h2>
        <p style={{ color: 'var(--hcl-neutral-400)', maxWidth: '400px', margin: '0 auto 24px auto', lineHeight: 1.5 }}>
          Upload your fulfillment tracking export. The system will automatically parse the data, validate requirements, and handle skill clustering.
        </p>
        <div>
          <input 
            type="file" 
            id="file-upload" 
            style={{ display: 'none' }} 
            accept=".xlsx,.xls,.csv"
            onChange={handleFileUpload}
          />
          <Button onClick={() => document.getElementById('file-upload')?.click()}>
            Browse Files (.xlsx, .csv)
          </Button>
        </div>
        {status === 'parsing' && (
          <div style={{ marginTop: '24px', color: 'var(--hcl-purple)', fontWeight: 500 }}>
            Parsing file and validating data...
          </div>
        )}
      </div>
    </Card>
  );
}
