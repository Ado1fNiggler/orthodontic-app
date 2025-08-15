import { useState, useMemo } from 'react'
import { clsx } from 'clsx'
import { 
  ChevronUpIcon, 
  ChevronDownIcon,
  ChevronUpDownIcon,
  FunnelIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline'
import Button from './Button'
import Input from './Input'
import LoadingSpinner from './LoadingSpinner'

export interface Column<T = any> {
  key: string
  title: string
  dataIndex?: keyof T
  render?: (value: any, record: T, index: number) => React.ReactNode
  sortable?: boolean
  filterable?: boolean
  width?: string | number
  align?: 'left' | 'center' | 'right'
  className?: string
  headerClassName?: string
}

interface TableProps<T = any> {
  columns: Column<T>[]
  data: T[]
  loading?: boolean
  pagination?: {
    current: number
    pageSize: number
    total: number
    onChange: (page: number, pageSize: number) => void
    showSizeChanger?: boolean
    pageSizeOptions?: number[]
  }
  rowKey?: keyof T | ((record: T) => string)
  onRow?: (record: T, index: number) => {
    onClick?: () => void
    onDoubleClick?: () => void
    className?: string
  }
  selectedRowKeys?: string[]
  onSelectionChange?: (selectedKeys: string[], selectedRows: T[]) => void
  searchable?: boolean
  onSearch?: (value: string) => void
  className?: string
  size?: 'sm' | 'md' | 'lg'
  striped?: boolean
  hoverable?: boolean
  bordered?: boolean
  emptyText?: string
  expandable?: {
    expandedRowRender: (record: T) => React.ReactNode
    rowExpandable?: (record: T) => boolean
  }
}

const Table = <T,>({
  columns,
  data,
  loading = false,
  pagination,
  rowKey = 'id',
  onRow,
  selectedRowKeys = [],
  onSelectionChange,
  searchable = false,
  onSearch,
  className,
  size = 'md',
  striped = false,
  hoverable = true,
  bordered = false,
  emptyText = 'Δεν βρέθηκαν δεδομένα',
  expandable
}: TableProps<T>) => {
  const [sortConfig, setSortConfig] = useState<{
    key: string
    direction: 'asc' | 'desc'
  } | null>(null)
  const [searchValue, setSearchValue] = useState('')
  const [expandedRows, setExpandedRows] = useState<string[]>([])

  // Get row key
  const getRowKey = (record: T, index: number): string => {
    if (typeof rowKey === 'function') {
      return rowKey(record)
    }
    return String((record as any)[rowKey] || index)
  }

  // Sorting logic
  const sortedData = useMemo(() => {
    if (!sortConfig) return data

    return [...data].sort((a, b) => {
      const column = columns.find(col => col.key === sortConfig.key)
      if (!column || !column.dataIndex) return 0

      const aVal = (a as any)[column.dataIndex]
      const bVal = (b as any)[column.dataIndex]

      if (aVal === bVal) return 0

      const result = aVal < bVal ? -1 : 1
      return sortConfig.direction === 'asc' ? result : -result
    })
  }, [data, sortConfig, columns])

  // Handle sorting
  const handleSort = (columnKey: string) => {
    const column = columns.find(col => col.key === columnKey)
    if (!column?.sortable) return

    setSortConfig(current => {
      if (current?.key === columnKey) {
        if (current.direction === 'asc') {
          return { key: columnKey, direction: 'desc' }
        } else {
          return null // Remove sorting
        }
      }
      return { key: columnKey, direction: 'asc' }
    })
  }

  // Handle row selection
  const handleSelectAll = (checked: boolean) => {
    if (!onSelectionChange) return

    if (checked) {
      const allKeys = sortedData.map((record, index) => getRowKey(record, index))
      onSelectionChange(allKeys, sortedData)
    } else {
      onSelectionChange([], [])
    }
  }

  const handleSelectRow = (record: T, index: number, checked: boolean) => {
    if (!onSelectionChange) return

    const key = getRowKey(record, index)
    if (checked) {
      const newSelectedKeys = [...selectedRowKeys, key]
      const newSelectedRows = sortedData.filter((r, i) => 
        newSelectedKeys.includes(getRowKey(r, i))
      )
      onSelectionChange(newSelectedKeys, newSelectedRows)
    } else {
      const newSelectedKeys = selectedRowKeys.filter(k => k !== key)
      const newSelectedRows = sortedData.filter((r, i) => 
        newSelectedKeys.includes(getRowKey(r, i))
      )
      onSelectionChange(newSelectedKeys, newSelectedRows)
    }
  }

  // Handle row expansion
  const handleExpandRow = (record: T, index: number) => {
    const key = getRowKey(record, index)
    setExpandedRows(current => 
      current.includes(key)
        ? current.filter(k => k !== key)
        : [...current, key]
    )
  }

  // Size classes
  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  }

  const cellPaddingClasses = {
    sm: 'px-3 py-2',
    md: 'px-4 py-3',
    lg: 'px-6 py-4'
  }

  const isAllSelected = selectedRowKeys.length > 0 && selectedRowKeys.length === sortedData.length
  const isIndeterminate = selectedRowKeys.length > 0 && selectedRowKeys.length < sortedData.length

  return (
    <div className={clsx('w-full', className)}>
      {/* Search Bar */}
      {searchable && (
        <div className="mb-4">
          <Input
            leftIcon={<MagnifyingGlassIcon />}
            placeholder="Αναζήτηση..."
            value={searchValue}
            onChange={(e) => {
              setSearchValue(e.target.value)
              onSearch?.(e.target.value)
            }}
            className="max-w-sm"
          />
        </div>
      )}

      {/* Table Container */}
      <div className="overflow-hidden shadow-sm ring-1 ring-black ring-opacity-5 rounded-lg">
        <div className="overflow-x-auto">
          <table className={clsx([
            'min-w-full divide-y divide-gray-200',
            sizeClasses[size],
            bordered && 'border border-gray-200'
          ])}>
            {/* Header */}
            <thead className="bg-gray-50">
              <tr>
                {/* Selection Header */}
                {onSelectionChange && (
                  <th className={clsx('relative', cellPaddingClasses[size])}>
                    <input
                      type="checkbox"
                      className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      checked={isAllSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = isIndeterminate
                      }}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                    />
                  </th>
                )}

                {/* Expandable Header */}
                {expandable && (
                  <th className={cellPaddingClasses[size]} />
                )}

                {/* Column Headers */}
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={clsx([
                      cellPaddingClasses[size],
                      'font-medium text-gray-900 tracking-wider uppercase',
                      column.align === 'center' && 'text-center',
                      column.align === 'right' && 'text-right',
                      column.sortable && 'cursor-pointer hover:bg-gray-100',
                      column.headerClassName
                    ])}
                    style={column.width ? { width: column.width } : undefined}
                    onClick={() => column.sortable && handleSort(column.key)}
                  >
                    <div className="flex items-center space-x-1">
                      <span>{column.title}</span>
                      {column.sortable && (
                        <span className="ml-2">
                          {sortConfig?.key === column.key ? (
                            sortConfig.direction === 'asc' ? (
                              <ChevronUpIcon className="h-4 w-4" />
                            ) : (
                              <ChevronDownIcon className="h-4 w-4" />
                            )
                          ) : (
                            <ChevronUpDownIcon className="h-4 w-4 text-gray-400" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            {/* Body */}
            <tbody className={clsx([
              'bg-white divide-y divide-gray-200',
              striped && 'divide-y-0'
            ])}>
              {loading ? (
                <tr>
                  <td
                    colSpan={columns.length + (onSelectionChange ? 1 : 0) + (expandable ? 1 : 0)}
                    className="text-center py-12"
                  >
                    <LoadingSpinner size="lg" />
                    <p className="mt-2 text-gray-500">Φορτώνει...</p>
                  </td>
                </tr>
              ) : sortedData.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + (onSelectionChange ? 1 : 0) + (expandable ? 1 : 0)}
                    className="text-center py-12 text-gray-500"
                  >
                    {emptyText}
                  </td>
                </tr>
              ) : (
                sortedData.map((record, index) => {
                  const key = getRowKey(record, index)
                  const isSelected = selectedRowKeys.includes(key)
                  const isExpanded = expandedRows.includes(key)
                  const rowProps = onRow?.(record, index) || {}

                  return (
                    <>
                      <tr
                        key={key}
                        className={clsx([
                          striped && index % 2 === 1 && 'bg-gray-50',
                          hoverable && 'hover:bg-gray-50',
                          isSelected && 'bg-primary-50',
                          rowProps.className,
                          'transition-colors duration-150'
                        ])}
                        onClick={rowProps.onClick}
                        onDoubleClick={rowProps.onDoubleClick}
                      >
                        {/* Selection Cell */}
                        {onSelectionChange && (
                          <td className={clsx('relative', cellPaddingClasses[size])}>
                            <input
                              type="checkbox"
                              className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                              checked={isSelected}
                              onChange={(e) => handleSelectRow(record, index, e.target.checked)}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </td>
                        )}

                        {/* Expandable Cell */}
                        {expandable && (
                          <td className={cellPaddingClasses[size]}>
                            {expandable.rowExpandable?.(record) !== false && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleExpandRow(record, index)
                                }}
                              >
                                <ChevronDownIcon className={clsx([
                                  'h-4 w-4 transition-transform',
                                  isExpanded && 'rotate-180'
                                ])} />
                              </Button>
                            )}
                          </td>
                        )}

                        {/* Data Cells */}
                        {columns.map((column) => {
                          const value = column.dataIndex ? (record as any)[column.dataIndex] : undefined
                          
                          return (
                            <td
                              key={column.key}
                              className={clsx([
                                cellPaddingClasses[size],
                                'text-gray-900',
                                column.align === 'center' && 'text-center',
                                column.align === 'right' && 'text-right',
                                column.className
                              ])}
                            >
                              {column.render ? column.render(value, record, index) : value}
                            </td>
                          )
                        })}
                      </tr>

                      {/* Expanded Row */}
                      {expandable && isExpanded && (
                        <tr>
                          <td
                            colSpan={columns.length + (onSelectionChange ? 1 : 0) + 1}
                            className="px-0 py-0"
                          >
                            <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
                              {expandable.expandedRowRender(record)}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Εμφάνιση {((pagination.current - 1) * pagination.pageSize) + 1} έως{' '}
            {Math.min(pagination.current * pagination.pageSize, pagination.total)} από{' '}
            {pagination.total} συνολικά
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.current <= 1}
              onClick={() => pagination.onChange(pagination.current - 1, pagination.pageSize)}
            >
              Προηγούμενη
            </Button>
            
            <span className="text-sm text-gray-700">
              Σελίδα {pagination.current} από {Math.ceil(pagination.total / pagination.pageSize)}
            </span>
            
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.current >= Math.ceil(pagination.total / pagination.pageSize)}
              onClick={() => pagination.onChange(pagination.current + 1, pagination.pageSize)}
            >
              Επόμενη
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Table