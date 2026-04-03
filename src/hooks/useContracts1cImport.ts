import { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import type { IContract1cImportRow, IContract1cImportResult } from '../types/contracts1c';
import { EXCEL_COLUMN_MAP } from '../types/contracts1c';
import * as contracts1cService from '../services/contracts1cService';

interface IUseContracts1cImportResult {
  importing: boolean;
  lastResult: IContract1cImportResult | null;
  error: string | null;
  importFile: (file: File) => Promise<void>;
}

/** Парсинг даты из Excel */
const parseDate = (val: unknown): string | null => {
  if (!val) return null;
  if (val instanceof Date) return val.toISOString().split('T')[0];
  if (typeof val === 'number') {
    // Excel serial number
    const d = new Date((val - 25569) * 86400 * 1000);
    return d.toISOString().split('T')[0];
  }
  const s = String(val).trim();
  // DD.MM.YYYY
  const m = s.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  // ISO
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.substring(0, 10);
  return null;
};

/** Парсинг суммы */
const parseAmount = (val: unknown): number => {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  const s = String(val).replace(/\s/g, '').replace(',', '.');
  return parseFloat(s) || 0;
};

/** Определение типа договора */
const parseContractType = (val: unknown): string => {
  const s = String(val || '').toLowerCase();
  if (s.includes('покупател')) return 'buyer';
  return 'supplier';
};

export function useContracts1cImport(
  contractTypeFilter: 'supplier' | 'buyer' | 'all' = 'supplier'
): IUseContracts1cImportResult {
  const [importing, setImporting] = useState(false);
  const [lastResult, setLastResult] = useState<IContract1cImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const importFile = useCallback(async (file: File) => {
    try {
      setImporting(true);
      setError(null);
      setLastResult(null);

      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

      if (rawRows.length === 0) {
        throw new Error('Файл пуст или не содержит данных');
      }

      // Маппинг колонок
      const firstRow = rawRows[0];
      const headers = Object.keys(firstRow);
      const columnMapping: Record<string, keyof IContract1cImportRow> = {};

      for (const header of headers) {
        const trimmed = header.trim();
        if (EXCEL_COLUMN_MAP[trimmed]) {
          columnMapping[header] = EXCEL_COLUMN_MAP[trimmed];
        }
      }

      // Проверка обязательной колонки GUID_1C
      const hasGuid = Object.values(columnMapping).includes('guid_1c');
      if (!hasGuid) {
        throw new Error('В файле отсутствует обязательная колонка GUID_1C');
      }

      // Парсинг строк
      const rows: IContract1cImportRow[] = [];
      for (const raw of rawRows) {
        const row: Partial<IContract1cImportRow> = {};

        for (const [excelCol, fieldName] of Object.entries(columnMapping)) {
          const val = raw[excelCol];
          switch (fieldName) {
            case 'contract_date':
              row.contract_date = parseDate(val);
              break;
            case 'amount':
              row.amount = parseAmount(val);
              break;
            case 'contract_type':
              row.contract_type = parseContractType(val);
              break;
            default:
              (row as Record<string, unknown>)[fieldName] = val ? String(val).trim() : '';
          }
        }

        // Пропуск строк без GUID
        if (!row.guid_1c) continue;

        // Фильтр по виду договора
        if (contractTypeFilter !== 'all' && row.contract_type !== contractTypeFilter) continue;

        rows.push(row as IContract1cImportRow);
      }

      if (rows.length === 0) {
        throw new Error('Нет строк для импорта после фильтрации');
      }

      // UPSERT через RPC
      const batchId = crypto.randomUUID();
      const result = await contracts1cService.upsertBatch(rows, batchId);
      setLastResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка импорта');
    } finally {
      setImporting(false);
    }
  }, [contractTypeFilter]);

  return { importing, lastResult, error, importFile };
}
