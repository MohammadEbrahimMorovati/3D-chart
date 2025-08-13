import React, { useEffect, useState } from 'react';
import Chart from './components/Chart.jsx';

export default function App() {
  const [charts, setCharts] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        setError('');
        const res = await fetch('/data.json', { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();

        if (!Array.isArray(json)) throw new Error('data.json باید آرایه‌ای از آبجکت‌ها باشد.');

        json.forEach((c, i) => {
          if (typeof c.title !== 'string') throw new Error(`title در آیتم ${i} نامعتبر است.`);
          if (!Array.isArray(c.data)) throw new Error(`data در آیتم ${i} باید آرایه باشد.`);
        });

        setCharts(json);
      } catch (e) {
        setError(e.message || 'خطا در خواندن data.json');
      }
    })();
  }, []);

  return (
    <div>
      <h1>React + D3 Charts</h1>
      {error && <div className="err">خطا: {error}</div>}
      {charts.map((cfg, idx) => (
        <div className="card" key={idx}>
          <h2>{cfg.title}</h2>
          <div className="chart-wrap">
            <Chart data={cfg.data} />
          </div>
        </div>
      ))}
      {!error && charts.length === 0 && <div>در حال بارگذاری داده‌ها…</div>}
    </div>
  );
}
