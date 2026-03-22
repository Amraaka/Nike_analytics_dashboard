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

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export function UtilizationChart() {
  const tellers = useDashboardStore((state) => state.tellers);

  const data = {
    labels: tellers.map((t) => t.id),
    datasets: [
      {
        label: 'Үзүүлэлт %',
        data: tellers.map((t) => t.utilization),
        backgroundColor: tellers.map((t) => {
          if (t.utilization >= 85) return 'rgba(16, 185, 129, 0.8)';
          if (t.utilization >= 70) return 'rgba(245, 158, 11, 0.8)';
          return 'rgba(239, 68, 68, 0.8)';
        }),
        borderRadius: 4,
      },
    ],
  };

  const options = {
    indexAxis: 'y' as const,
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
        callbacks: {
          label: function (context: any) {
            return `Үзүүлэлт: ${context.parsed.x}%`;
          },
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        max: 100,
        ticks: {
          callback: function (value: any) {
            return value + '%';
          },
        },
        title: {
          display: true,
          text: 'Ашиглалт (%)',
        },
      },
      y: {
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
        <CardTitle>Ажилтны үзүүлэлт</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <Bar data={data} options={options} />
        </div>
      </CardContent>
    </Card>
  );
}
