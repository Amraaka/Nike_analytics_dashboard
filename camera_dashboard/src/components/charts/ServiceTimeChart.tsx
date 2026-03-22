import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDashboardStore } from '@/store/dashboardStore';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { formatTimeShort } from '@/lib/utils';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export function ServiceTimeChart() {
  const tellers = useDashboardStore((state) => state.tellers);

  const data = {
    labels: tellers.map((t) => t.id),
    datasets: [
      {
        label: 'Дундаж',
        data: tellers.map((t) => t.averageServiceTime),
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderRadius: 4,
      },
      {
        label: 'Хамгийн бага',
        data: tellers.map((t) => t.minServiceTime),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderRadius: 4,
      },
      {
        label: 'Хамгийн их',
        data: tellers.map((t) => t.maxServiceTime),
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
        borderRadius: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            return `${context.dataset.label}: ${formatTimeShort(context.parsed.y)}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function (value: any) {
            return formatTimeShort(value);
          },
        },
        title: {
          display: true,
          text: 'Цаг',
        },
      },
      x: {
        title: {
          display: true,
          text: 'Ажилтны ID',
        },
      },
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Үйлчлүүлсэн цагийн тархалт</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <Bar data={data} options={options} />
        </div>
      </CardContent>
    </Card>
  );
}
