export const jsonToCsv = (
  keys: string[],
  csvKeysMap: string[],
  data: object[],
) => {
  const rows = [csvKeysMap.join(',')];
  for (const obj of data) {
    const row = keys.map(k => (obj as any)[k as any]).join(',');
    rows.push(row);
  }
  return rows;
};
