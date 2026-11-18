import * as React from "react"
import {
  flexRender,
  rowExpandingFeature,
  rowPaginationFeature,
  rowSortingFeature,
  useTable,
} from "@tanstack/react-table"
import type {
  ColumnDef,
  SortingState,
  PaginationState,
  ExpandedState,
  Row,
  RowData,
  OnChangeFn,
} from "@tanstack/react-table"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/components/ui/pagination"

interface DataTableProps<TData extends RowData> {
  columns: ColumnDef<typeof tableFeatures, TData>[]
  data: TData[]
  pageCount: number
  pagination: PaginationState
  onPaginationChange: (pagination: PaginationState) => void
  sorting: SortingState
  onSortingChange: (sorting: SortingState) => void
  expanded: ExpandedState
  onExpandedChange: OnChangeFn<ExpandedState>
  getRowCanExpand?: (row: Row<typeof tableFeatures, TData>) => boolean
  getRowId?: (row: TData) => string
  renderSubComponent?: (props: {
    row: Row<typeof tableFeatures, TData>
  }) => React.ReactNode
}

export const tableFeatures = {
  rowSortingFeature,
  rowPaginationFeature,
  rowExpandingFeature,
} as const

export function DataTable<TData extends RowData>({
  columns,
  data,
  pageCount,
  pagination,
  onPaginationChange,
  sorting,
  onSortingChange,
  expanded,
  onExpandedChange,
  getRowCanExpand,
  getRowId,
  renderSubComponent,
}: DataTableProps<TData>) {
  const table = useTable({
    features: tableFeatures,
    data,
    columns,
    pageCount,
    getRowId,
    state: {
      pagination,
      sorting,
      expanded,
    },
    onPaginationChange: (updater) => {
      const nextState =
        typeof updater === "function" ? updater(pagination) : updater
      onPaginationChange(nextState)
    },
    onSortingChange: (updater) => {
      const nextState =
        typeof updater === "function" ? updater(sorting) : updater
      onSortingChange(nextState)
    },
    onExpandedChange: onExpandedChange,
    getRowCanExpand,
    manualPagination: true,
    manualSorting: true,
  })

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-[10px] border border-rule bg-paper-2">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="h-10 px-4">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <React.Fragment key={row.id}>
                  <TableRow>
                    {row.getAllCells().map((cell) => (
                      <TableCell key={cell.id} className="px-4 py-3">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                  {row.getIsExpanded() && renderSubComponent && (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length}
                        className="bg-paper-3 p-4"
                      >
                        {renderSubComponent({ row })}
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      {pageCount > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <Button
                variant="ghost"
                size="sm"
                disabled={pagination.pageIndex === 0}
                onClick={() =>
                  onPaginationChange({
                    ...pagination,
                    pageIndex: pagination.pageIndex - 1,
                  })
                }
              >
                Previous
              </Button>
            </PaginationItem>
            {Array.from({ length: pageCount }).map((_, i) => (
              <PaginationItem key={i}>
                <Button
                  variant={pagination.pageIndex === i ? "outline" : "ghost"}
                  size="sm"
                  onClick={() =>
                    onPaginationChange({ ...pagination, pageIndex: i })
                  }
                >
                  {i + 1}
                </Button>
              </PaginationItem>
            ))}
            <PaginationItem>
              <Button
                variant="ghost"
                size="sm"
                disabled={pagination.pageIndex === pageCount - 1}
                onClick={() =>
                  onPaginationChange({
                    ...pagination,
                    pageIndex: pagination.pageIndex + 1,
                  })
                }
              >
                Next
              </Button>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  )
}
