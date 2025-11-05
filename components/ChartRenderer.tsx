import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, PieChart, Pie, Cell as RechartsCell, ScatterChart, Scatter, ZAxis } from 'recharts';
import { ChartData } from '../types';

interface ChartRendererProps {
  chartData: ChartData;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const ChartRenderer: React.FC<ChartRendererProps> = ({ chartData }) => {
  const { chartType, data, dataKey, xAxisKey, angleKey, nameKey } = chartData;

  const renderChart = () => {
    switch (chartType) {
      case 'bar':
        return (
          <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
            <XAxis dataKey={xAxisKey} stroke="#A0AEC0" />
            <YAxis stroke="#A0AEC0" />
            <Tooltip contentStyle={{ backgroundColor: '#2D3748', border: '1px solid #4A5568' }} />
            <Legend />
            {Array.isArray(dataKey) ? 
              dataKey.map((key, index) => <Bar key={key} dataKey={key} fill={COLORS[index % COLORS.length]} />) :
              <Bar dataKey={dataKey} fill={COLORS[0]} />
            }
          </BarChart>
        );
      case 'line':
        return (
          <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
            <XAxis dataKey={xAxisKey} stroke="#A0AEC0" />
            <YAxis stroke="#A0AEC0" />
            <Tooltip contentStyle={{ backgroundColor: '#2D3748', border: '1px solid #4A5568' }} />
            <Legend />
            {Array.isArray(dataKey) ? 
              dataKey.map((key, index) => <Line key={key} type="monotone" dataKey={key} stroke={COLORS[index % COLORS.length]} />) :
              <Line type="monotone" dataKey={dataKey} stroke={COLORS[0]} />
            }
          </LineChart>
        );
      case 'pie':
        return (
          <PieChart>
            <Pie data={data} dataKey={angleKey} nameKey={nameKey} cx="50%" cy="50%" outerRadius={100} fill="#8884d8" label>
              {data.map((entry, index) => (
                <RechartsCell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ backgroundColor: '#2D3748', border: '1px solid #4A5568' }} />
            <Legend />
          </PieChart>
        );
      case 'scatter':
        return (
           <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid stroke="#4A5568" />
            <XAxis type="number" dataKey={xAxisKey} name={xAxisKey} stroke="#A0AEC0" />
            <YAxis type="number" dataKey={Array.isArray(dataKey) ? dataKey[0] : dataKey} name={Array.isArray(dataKey) ? dataKey[0] : dataKey} stroke="#A0AEC0" />
            {/* Fix: The `range` prop for ZAxis requires an array of two numbers, e.g. [min, max]. To set a fixed size, both numbers can be the same. */}
            <ZAxis range={[100, 100]} />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: '#2D3748', border: '1px solid #4A5568' }} />
            <Legend />
            <Scatter name="A school" data={data} fill={COLORS[0]} />
          </ScatterChart>
        );
      default:
        return <div className="text-red-500">Unsupported chart type: {chartType}</div>;
    }
  };

  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        {renderChart()}
      </ResponsiveContainer>
    </div>
  );
};

export default ChartRenderer;