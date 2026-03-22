import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
// import { Badge } from '@/components/ui/badge';
import { useDashboardStore } from '@/store/dashboardStore';
import { formatTime } from '@/lib/utils';
import { ArrowUpDown, Download } from 'lucide-react';

type SortField = 'id' | 'customersServed' | 'averageServiceTime' | 'utilization';
type SortOrder = 'asc' | 'desc';

export function TellerMetricsTable() {
  const tellers = useDashboardStore((state) => state.tellers);
  const [sortField, setSortField] = useState<SortField>('id');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const sortedTellers = useMemo(() => {
    const sorted = [...tellers].sort((a, b) => {
      let aValue: string | number = a[sortField];
      let bValue: string | number = b[sortField];

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    return sorted;
  }, [tellers, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const exportToCSV = () => {
    const headers = [
      'Teller ID',
      'Name',
      'Status',
      'Customers Served',
      'Avg Service Time (s)',
      'Min Time (s)',
      'Max Time (s)',
      'Utilization (%)',
    ];
    
    const rows = tellers.map((t) => [
      t.id,
      t.name,
      t.currentCustomer ? 'Serving' : 'Idle',
      t.customersServed,
      t.averageServiceTime,
      t.minServiceTime,
      t.maxServiceTime,
      t.utilization,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `teller-metrics-${new Date().toISOString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // const getUtilizationBadge = (utilization: number) => {
  //   if (utilization >= 85) return <Badge variant="success">{formatPercentage(utilization)}</Badge>;
  //   if (utilization >= 70) return <Badge variant="warning">{formatPercentage(utilization)}</Badge>;
  //   return <Badge variant="error">{formatPercentage(utilization)}</Badge>;
  // };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Detailed Teller Metrics</CardTitle>
          <Button onClick={exportToCSV} variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('id')}
                  className="h-8 px-2"
                >
                  Ажилтан ID
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>Нэр</TableHead>
              <TableHead>Төлөв</TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('customersServed')}
                  className="h-8 px-2"
                >
                  Харилцагч
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('averageServiceTime')}
                  className="h-8 px-2"
                >
                  Дундаж хугацаа
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>Min Time</TableHead>
              <TableHead>Max Time</TableHead>
              {/* <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('utilization')}
                  className="h-8 px-2"
                >
                  Utilization
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead> */}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedTellers.map((teller) => (
              <TableRow key={teller.id}>
                <TableCell className="font-medium">{teller.id}</TableCell>
                <TableCell>{teller.name}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div
                      className={`h-2 w-2 rounded-full ${
                        teller.currentCustomer ? 'bg-emerald-500' : 'bg-slate-400'
                      }`}
                    ></div>
                    {teller.currentCustomer ? 'Serving' : 'Idle'}
                  </div>
                </TableCell>
                <TableCell>{teller.customersServed}</TableCell>
                <TableCell>{formatTime(teller.averageServiceTime)}</TableCell>
                <TableCell className="text-slate-600 dark:text-slate-400">
                  {formatTime(teller.minServiceTime)}
                </TableCell>
                <TableCell className="text-slate-600 dark:text-slate-400">
                  {formatTime(teller.maxServiceTime)}
                </TableCell>
                {/* <TableCell>{getUtilizationBadge(teller.utilization)}</TableCell> */}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
