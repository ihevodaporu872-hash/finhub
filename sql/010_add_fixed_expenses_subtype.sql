--- Добавление fixed_expenses в CHECK constraint для bdr_sub_entries

ALTER TABLE bdr_sub_entries
  DROP CONSTRAINT IF EXISTS bdr_sub_entries_sub_type_check;

ALTER TABLE bdr_sub_entries
  ADD CONSTRAINT bdr_sub_entries_sub_type_check
    CHECK (sub_type IN (
      'materials', 'labor', 'subcontract', 'design', 'rental',
      'fixed_expenses',
      'overhead_labor',
      'overhead_02', 'overhead_03', 'overhead_04', 'overhead_05',
      'overhead_06', 'overhead_07', 'overhead_08', 'overhead_09',
      'overhead_10', 'overhead_11', 'overhead_12', 'overhead_13',
      'overhead_14', 'overhead_15', 'overhead_16', 'overhead_17',
      'overhead_18', 'overhead_19', 'overhead_20', 'overhead_21',
      'overhead_22', 'overhead_23', 'overhead_24'
    ));
