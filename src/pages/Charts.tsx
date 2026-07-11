import React, { useState, useMemo } from 'react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  LineChart, Line, ResponsiveContainer, Legend,
} from 'recharts';
import { getTransactions, getCategories, getCategoryStats, formatMoney } from '../lib/storage';
import { MonthPicker } from '../components/MonthPicker';
import { CategoryStat } from '../types';

const COLORS = [
  '#10B981', '#6366F1', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#14B8A6',
  '#3B82F6', '#E11D48', '#A855F7',
];

export const Charts: React.FC = () => {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [chartTab, setChartTab] = useState<'pie' | 'bar' | 'line' | 'heatmap'>('pie');

  // Pie data - category breakdown for selected month
  const pieData = useMemo(() => {
    return getCategoryStats(year, month).map(s => ({
      name: `${s.categoryIcon} ${s.categoryName}`,
      value: s.amount,
      categoryName: s.categoryName,
    }));
  }, [year, month]);

  // Bar data - last 6 months income vs expense
  const barData = useMemo(() => {
    const allTxs = getTransactions();
    const months: { name: string; 支出: number; 收入: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      let m = month - i;
      let y = year;
      while (m < 1) { m += 12; y--; }
      const prefix = `${y}-${String(m).padStart(2, '0')}`;
      const monthTxs = allTxs.filter(t => t.date.startsWith(prefix));
      months.push({
        name: `${m}月`,
        支出: monthTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
        收入: monthTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
      });
    }
    return months;
  }, [year, month]);

  // Line data - daily spending trend for selected month
  const lineData = useMemo(() => {
    const allTxs = getTransactions();
    const prefix = `${year}-${String(month).padStart(2, '0')}`;
    const daysInMonth = new Date(year, month, 0).getDate();
    const days: { name: string; 支出: number; 收入: number }[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${prefix}-${String(d).padStart(2, '0')}`;
      const dayTxs = allTxs.filter(t => t.date === dateStr);
      days.push({
        name: `${d}日`,
        支出: dayTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
        收入: dayTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
      });
    }
    return days;
  }, [year, month]);

  // Heatmap data - daily spending for the year
  const heatmapData = useMemo(() => {
    const allTxs = getTransactions();
    const map = new Map<string, number>();
    for (const tx of allTxs) {
      map.set(tx.date, (map.get(tx.date) || 0) + tx.amount);
    }
    return Array.from(map.entries()).map(([date, amount]) => ({ date, amount }));
  }, []);

  // Color for heatmap cell based on amount
  const getHeatColor = (amount: number): string => {
    if (amount === 0) return '#ebedf0';
    if (amount < 50) return '#c6e48b';
    if (amount < 150) return '#7bc96f';
    if (amount < 300) return '#239a3b';
    return '#196127';
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background: '#fff', padding: '8px 12px', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,.12)', fontSize: 13 }}>
        {payload.map((p: any, i: number) => (
          <div key={i} style={{ color: p.color }}>{p.name}: {formatMoney(p.value)}</div>
        ))}
      </div>
    );
  };

  return (
    <div className="fade-in">
      <MonthPicker year={year} month={month} onChange={(y, m) => { setYear(y); setMonth(m); }} />

      {/* Chart type tabs */}
      <div className="filter-row" style={{ justifyContent: 'center', marginTop: 8 }}>
        {([
          { key: 'pie', label: '饼图' },
          { key: 'bar', label: '月度对比' },
          { key: 'line', label: '趋势' },
          { key: 'heatmap', label: '热力' },
        ] as const).map(t => (
          <button
            key={t.key}
            className={`filter-chip${chartTab === t.key ? ' active' : ''}`}
            onClick={() => setChartTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Pie Chart */}
      {chartTab === 'pie' && (
        <div className="chart-section mt-16">
          <div className="chart-title">📊 {month}月支出分类占比</div>
          <div className="chart-wrap">
            {pieData.length === 0 ? (
              <div className="empty-state"><div className="empty-text">暂无数据</div></div>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={110}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            )}
            {/* Legend */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px', padding: '8px 12px', justifyContent: 'center' }}>
              {pieData.map((d, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                  <span>{d.categoryName}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bar Chart - Monthly comparison */}
      {chartTab === 'bar' && (
        <div className="chart-section mt-16">
          <div className="chart-title">📈 近6月收支对比</div>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="支出" fill="#EF4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="收入" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Line Chart - Daily trend */}
      {chartTab === 'line' && (
        <div className="chart-section mt-16">
          <div className="chart-title">📉 {month}月每日消费趋势</div>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10 }}
                  interval={Math.max(0, Math.floor(lineData.length / 10) - 1)}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line type="monotone" dataKey="支出" stroke="#EF4444" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="收入" stroke="#10B981" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Calendar Heatmap */}
      {chartTab === 'heatmap' && (
        <div className="chart-section mt-16">
          <div className="chart-title">🗓️ 全年消费热力图</div>
          <div className="chart-wrap">
            <HeatmapGrid year={year} data={heatmapData} getColor={getHeatColor} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end', marginTop: 12, fontSize: 11, color: 'var(--c-text-muted)' }}>
              <span>少</span>
              {[0, 50, 150, 300].map((threshold, i) => (
                <span key={i} style={{ width: 12, height: 12, background: getHeatColor(threshold + 1), borderRadius: 2 }} />
              ))}
              <span>多</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Simple heatmap grid component
const HeatmapGrid: React.FC<{
  year: number;
  data: { date: string; amount: number }[];
  getColor: (amount: number) => string;
}> = ({ year, data, getColor }) => {
  const amountMap = new Map(data.map(d => [d.date, d.amount]));

  // Build grid: 7 rows (Mon-Sun) x ~53 columns
  const weeks: { date: string; amount: number }[][] = [];
  const startDate = new Date(year, 0, 1);
  // Go back to Monday
  const firstDay = new Date(startDate);
  firstDay.setDate(firstDay.getDate() - ((firstDay.getDay() + 6) % 7));

  let current = new Date(firstDay);
  for (let w = 0; w < 53; w++) {
    const week: { date: string; amount: number }[] = [];
    for (let d = 0; d < 7; d++) {
      const ds = formatDate(current);
      week.push({ date: ds, amount: amountMap.get(ds) || 0 });
      current.setDate(current.getDate() + 1);
    }
    weeks.push(week);
  }

  // Keep only weeks that touch the target year
  const filtered = weeks.filter(w => w.some(d => d.date.startsWith(String(year))));

  const monthLabels: { label: string; col: number }[] = [];
  let lastMonth = -1;
  filtered.forEach((week, wi) => {
    const m = parseInt(week[0].date.split('-')[1], 10);
    if (m !== lastMonth) {
      monthLabels.push({ label: `${m}月`, col: wi });
      lastMonth = m;
    }
  });

  const dayLabels = ['一', '三', '五', '日'];

  return (
    <div className="heatmap-wrap" style={{ overflowX: 'auto' }}>
      {/* Month labels */}
      <div style={{ display: 'flex', marginLeft: 28, marginBottom: 4 }}>
        {monthLabels.map((ml, i) => (
          <div
            key={i}
            style={{
              position: 'relative',
              left: i === 0 ? ml.col * 14 : (ml.col - monthLabels[i - 1].col) * 14,
              fontSize: 10,
              color: 'var(--c-text-muted)',
            }}
          >
            {ml.label}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex' }}>
        {/* Day labels */}
        <div style={{ display: 'flex', flexDirection: 'column', marginRight: 4, gap: 2 }}>
          {[0, 1, 2, 3, 4, 5, 6].map(d => {
            const labels = ['一', '', '三', '', '五', '', '日'];
            return (
              <div key={d} style={{ width: 24, height: 12, fontSize: 9, color: 'var(--c-text-muted)', lineHeight: '12px', textAlign: 'right' }}>
                {labels[d]}
              </div>
            );
          })}
        </div>
        {/* Cells */}
        <div style={{ display: 'flex', gap: 2 }}>
          {filtered.map((week, wi) => (
            <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {week.map((day, di) => (
                <div
                  key={di}
                  title={`${day.date}: ${formatMoney(day.amount)}`}
                  style={{
                    width: 12,
                    height: 12,
                    background: getColor(day.amount),
                    borderRadius: 2,
                    cursor: 'pointer',
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
