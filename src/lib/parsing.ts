import * as XLSX from 'xlsx';
import { autoMapColumns } from './mapping';
import { FulfillmentRecord, ValidationResult } from './types';
import { validateData } from './validation';
import { clusterSkill } from './clustering';
import { calculateLeadTime, validateLeadTime } from './leadTime';
import { v4 as uuidv4 } from 'uuid';

export interface ParseResult {
  sheetName: string;
  totalRows: number;
  mappedColumns: Record<string, string | null>;
  validationResult: ValidationResult;
}

/**
 * Heuristic to score a sheet to determine if it's the main flat data sheet.
 */
function scoreSheet(sheet: XLSX.WorkSheet, sheetName: string): number {
  const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
  const numRows = range.e.r - range.s.r;
  const numCols = range.e.c - range.s.c;
  
  if (numRows < 2 || numCols < 3) return 0;
  
  // Extract headers
  const headers = getSheetHeaders(sheet);
  const headerStr = headers.join(' ').toLowerCase();
  
  const keywords = ['date', 'skill', 'hiring', 'source', 'requisition', 'id', 'department'];
  const keywordMatches = keywords.filter(k => headerStr.includes(k)).length;
  
  // Scoring formula: heavily weight keyword presence, then row count.
  return (keywordMatches * 1000) + numRows;
}

export function getSheetHeaders(sheet: XLSX.WorkSheet): string[] {
  const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
  const headers: string[] = [];
  for (let C = range.s.c; C <= range.e.c; ++C) {
    const cell = sheet[XLSX.utils.encode_cell({ c: C, r: range.s.r })];
    if (cell && cell.v !== undefined) {
      headers.push(String(cell.v));
    }
  }
  return headers;
}

/**
 * Finds the most likely data sheet or returns null if ambiguous.
 */
export function detectDataSheetName(workbook: XLSX.WorkBook): string | null {
  const sheetNames = workbook.SheetNames;
  if (sheetNames.length === 1) return sheetNames[0];
  
  const scores = sheetNames.map(name => ({
    name,
    score: scoreSheet(workbook.Sheets[name], name)
  }));
  
  scores.sort((a, b) => b.score - a.score);
  
  if (scores[0].score === 0) return null;
  
  // If the top two scores are very close, it's ambiguous
  if (scores.length > 1 && scores[0].score > 0 && scores[1].score > 0) {
    if (scores[0].score / scores[1].score < 1.2) {
      return null; // Ambiguous
    }
  }
  
  return scores[0].name;
}

function parseDate(value: any): Date | null {
  if (value == null || value === '') return null;
  if (value instanceof Date) return value;
  
  // Handle Excel serial dates
  if (typeof value === 'number') {
    // Excel dates are days since 1900. SheetJS can parse them natively if cell.t is 'd', but here we get values.
    // Assuming standard 1900 date system
    const date = new Date(Math.round((value - 25569) * 86400 * 1000));
    // Check if it's a valid date
    if (isNaN(date.getTime())) return null;
    return date;
  }
  
  const date = new Date(value);
  if (!isNaN(date.getTime())) return date;
  
  return null;
}

export function parseSheetData(
  workbook: XLSX.WorkBook,
  sheetName: string,
  userMapping?: Record<string, string | null>
): ParseResult {
  const sheet = workbook.Sheets[sheetName];
  const rawData = XLSX.utils.sheet_to_json<any>(sheet, { defval: null });
  const headers = getSheetHeaders(sheet);
  
  const mapping = userMapping || autoMapColumns(headers);
  const parsedRows: Partial<FulfillmentRecord>[] = [];
  
  // Track trailing blanks
  let lastDataRowIndex = -1;
  
  for (let i = 0; i < rawData.length; i++) {
    const row = rawData[i];
    // Check if row is completely empty
    const isEmpty = Object.values(row).every(v => v === null || String(v).trim() === '');
    if (!isEmpty) {
      lastDataRowIndex = i;
    }
  }
  
  for (let i = 0; i <= lastDataRowIndex; i++) {
    const row = rawData[i];
    const parsedRow: any = { sourceRowRef: i + 2 }; // +1 for 0-index, +1 for header row
    
    let providedLeadTime: number | null = null;
    let existingClusterLabel: string | undefined = undefined;
    
    for (const [rawHeader, targetField] of Object.entries(mapping)) {
      if (!targetField) continue;
      
      const value = row[rawHeader];
      
      switch (targetField) {
        case 'id':
          parsedRow.id = value != null ? String(value) : undefined;
          break;
        case 'raisedDate':
          parsedRow.raisedDate = parseDate(value);
          break;
        case 'fulfilledDate':
          parsedRow.fulfilledDate = parseDate(value);
          break;
        case 'hiringType':
          parsedRow.hiringType = value != null ? String(value).trim() : undefined;
          break;
        case 'skillRaw':
          parsedRow.skillRaw = value != null ? String(value).trim() : undefined;
          break;
        case 'skillCluster':
          existingClusterLabel = value != null ? String(value).trim() : undefined;
          break;
        case 'department':
          parsedRow.department = value != null ? String(value).trim() : null;
          break;
        case 'location':
          parsedRow.location = value != null ? String(value).trim() : null;
          break;
        case 'band':
          parsedRow.band = value != null ? String(value).trim() : null;
          break;
        case 'leadTimeDays':
          providedLeadTime = value != null ? Number(value) : null;
          break;
        case 'period':
          parsedRow.period = value != null ? String(value).trim() : null;
          break;
      }
    }
    
    // Derived values
    parsedRow.skillCluster = clusterSkill(parsedRow.skillRaw, existingClusterLabel);
    
    const computedLeadTime = calculateLeadTime(parsedRow.raisedDate, parsedRow.fulfilledDate);
    
    // Use computed lead time as source of truth. If provided exists but disagrees, we trust computed.
    // You could also add a validation error here for mismatched lead time if desired.
    parsedRow.leadTimeDays = computedLeadTime;
    
    parsedRows.push(parsedRow);
  }
  
  const validationResult = validateData(parsedRows);
  
  return {
    sheetName,
    totalRows: parsedRows.length,
    mappedColumns: mapping,
    validationResult
  };
}
