export function DataTable({ columns, rows, selectedId, hintIds, sort, onSort, onSelect }) {
  const hints = hintIds instanceof Set ? hintIds : new Set(hintIds ?? []);

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} className={column.numeric ? "num" : ""}>
                <button type="button" onClick={() => onSort(column.key)}>
                  {column.label}
                  {sort.key === column.key ? (sort.dir === "asc" ? " ↑" : " ↓") : ""}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const classes = [
              row.id === selectedId ? "is-selected" : "",
              hints.has(row.id) ? "is-hint" : "",
            ]
              .filter(Boolean)
              .join(" ");

            return (
              <tr
                key={row.id}
                className={classes || undefined}
                onClick={() => onSelect(row.id)}
              >
                {columns.map((column) => (
                  <td key={column.key} className={column.numeric ? "num" : ""}>
                    {column.key === "amount" ? row.amount : row[column.key]}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
