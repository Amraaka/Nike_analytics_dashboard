import { Card, CardContent, CardHeader} from '@/components/ui/card';
import { useDashboardStore } from '@/store/dashboardStore';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { format } from 'date-fns';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export function CustomerFlowChart() {
  const { customerFlow, timeFilter } = useDashboardStore();

  const formatLabel = (date: Date) => {
    switch (timeFilter) {
      case '1h':
        return format(date, 'HH:mm');
      case '1d':
        return format(date, 'HH:mm');
      case '1w':
        return format(date, 'MMM dd');
      default:
        return format(date, 'MMM dd');
    }
  };

  const data = {
    labels: customerFlow.map((cf) => formatLabel(cf.timestamp)),
    datasets: [
      {
        label: 'Харилцагчид',
        data: customerFlow.map((cf) => cf.count),
        borderColor: 'rgba(59, 130, 246, 1)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointHoverRadius: 5,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Харилцагчийн тоо',
        },
      },
      x: {
        title: {
          display: true,
          text: 'Цаг',
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45,
        },
      },
    },
  };

  return (
    <Card>
      <CardHeader>
        {/* <CardTitle>Customer Flow Timeline</CardTitle> */}
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <Line data={data} options={options} />
        </div>
      </CardContent>
    </Card>
  );
}
