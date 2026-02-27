import { useRef } from 'react';
import { Button, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';
import type { BdrSubEntryFormData, BdrSubType } from '../../../types/bdr';

interface IProps {
  subType: BdrSubType;
  projectId: string | null;
  onImport: (data: BdrSubEntryFormData[]) => Promise<void>;
}

export const BdrSubExcelImport = ({ subType, projectId, onImport }: IProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

      const entries: BdrSubEntryFormData[] = [];

      for (const row of jsonData) {
        const company = String(row['Фирма'] || row['Company'] || '');
        const description = String(row['Содержание'] || row['Description'] || '');
        const amount = Number(row['Сумма'] || row['Amount'] || 0);

        let entryDate = '';
        const rawDate = row['Дата'] || row['Date'];
        if (rawDate instanceof Date) {
          entryDate = rawDate.toISOString().split('T')[0];
        } else if (typeof rawDate === 'number') {
          const d = XLSX.SSF.parse_date_code(rawDate);
          entryDate = `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`;
        } else if (typeof rawDate === 'string') {
          const parts = rawDate.split('.');
          if (parts.length === 3) {
            entryDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
          } else {
            entryDate = rawDate;
          }
        }

        if (!entryDate || !amount) continue;

        entries.push({
          sub_type: subType,
          project_id: projectId,
          entry_date: entryDate,
          company,
          description,
          amount,
        });
      }

      if (entries.length === 0) {
        message.warning('Не найдено записей для импорта');
        return;
      }

      await onImport(entries);
      message.success(`Импортировано ${entries.length} записей`);
    } catch {
      message.error('Ошибка импорта файла');
    }

    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls"
        className="hidden-input"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      <Button
        icon={<UploadOutlined />}
        onClick={() => inputRef.current?.click()}
      >
        Импорт Excel
      </Button>
    </>
  );
};
