import { ReactNode } from "react";

type Column<T> = {
  header: string;
  accessorKey?: keyof T;
  cell?: (item: T) => ReactNode;
  className?: string;
};

type AdminTableProps<T> = {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  emptyMessage?: string;
};

export function AdminTable<T>({
  columns,
  data,
  keyExtractor,
  emptyMessage = "Aucun enregistrement trouvé.",
}: AdminTableProps<T>) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-neutral-800 bg-neutral-950 shadow-xl">
      <table className="w-full text-left text-sm text-neutral-300">
        <thead className="bg-neutral-900 text-xs uppercase text-neutral-400">
          <tr>
            {columns.map((col, idx) => (
              <th key={idx} scope="col" className={`px-6 py-4 font-semibold ${col.className ?? ""}`}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-900">
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-8 text-center text-xs text-neutral-500">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item) => (
              <tr key={keyExtractor(item)} className="hover:bg-neutral-900/50 transition-colors">
                {columns.map((col, idx) => (
                  <td key={idx} className={`px-6 py-4 ${col.className ?? ""}`}>
                    {col.cell
                      ? col.cell(item)
                      : col.accessorKey
                      ? (item[col.accessorKey] as ReactNode)
                      : null}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
