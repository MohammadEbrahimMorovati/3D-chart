import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

function detectChartType(data) {
  for (const row of data) {
    if (!Array.isArray(row) || row.length < 2) continue;
    const val = row[1];
    if (Array.isArray(val)) return 'multi';
    if (typeof val === 'number' || val === null) return 'single';
  }
  return 'unknown';
}

export default function Chart({ data }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!Array.isArray(data) || data.length === 0) return;

    const container = ref.current;
    const type = detectChartType(data);

    // clear previous render
    d3.select(container).selectAll('*').remove();

    // sort by timestamp for safety
    const sorted = [...data].sort((a, b) => (a?.[0] ?? 0) - (b?.[0] ?? 0));

    const width = 720;
    const height = 320;
    const margin = { top: 8, right: 16, bottom: 36, left: 48 };
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    const svg = d3
      .select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // X domain (timestamp)
    const xs = sorted
      .map(d => Array.isArray(d) ? d[0] : null)
      .filter(d => typeof d === 'number');

    if (xs.length === 0) {
      g.append('text').text('داده‌ی معتبر برای X وجود ندارد.').attr('x', 0).attr('y', 14);
      return;
    }

    const x = d3.scaleLinear()
      .domain(d3.extent(xs))
      .range([0, innerW]);

    // Y domain
    let allY = [];
    if (type === 'single') {
      allY = sorted.map(d => d[1]).filter(v => typeof v === 'number');
    } else if (type === 'multi') {
      for (const d of sorted) {
        const vals = d[1];
        if (Array.isArray(vals)) {
          for (const v of vals) if (typeof v === 'number') allY.push(v);
        }
      }
    } else {
      g.append('text').text('ساختار داده نامعتبر است.').attr('x', 0).attr('y', 14);
      return;
    }

    if (allY.length === 0) {
      g.append('text').text('هیچ مقدار Y معتبری برای رسم وجود ندارد.').attr('x', 0).attr('y', 14);
      return;
    }

    const y = d3.scaleLinear()
      .domain(d3.extent(allY))
      .nice()
      .range([innerH, 0]);

    const grid = d3.axisLeft(y).tickSize(-innerW).tickFormat('');
    g.append('g').attr('class', 'grid').call(grid);

    const xAxis = d3.axisBottom(x).ticks(6);
    const yAxis = d3.axisLeft(y).ticks(6);

    g.append('g')
      .attr('class', 'axis')
      .attr('transform', `translate(0,${innerH})`)
      .call(xAxis);

    g.append('g')
      .attr('class', 'axis')
      .call(yAxis);

    if (type === 'single') {
      const series = sorted.map(d => ({ x: d[0], y: d[1] }));
      const line = d3.line()
        .defined(d => d.y !== null && typeof d.y === 'number')
        .x(d => x(d.x))
        .y(d => y(d.y));

      g.append('path')
        .datum(series)
        .attr('fill', 'none')
        .attr('stroke', 'steelblue')
        .attr('stroke-width', 2)
        .attr('d', line);
    }

    if (type === 'multi') {
      const colors = ['blue', 'green', 'red'];

      const mkSeries = (i) =>
        sorted.map(d => {
          const vals = d[1];
          const yi = (Array.isArray(vals) ? vals[i] : null);
          return { x: d[0], y: (typeof yi === 'number' ? yi : (yi === null ? null : null)) };
        });

      const seriesList = [0, 1, 2].map(i => mkSeries(i));

      const line = d3.line()
        .defined(d => d.y !== null && typeof d.y === 'number')
        .x(d => x(d.x))
        .y(d => y(d.y));

      seriesList.forEach((series, i) => {
        g.append('path')
          .datum(series)
          .attr('fill', 'none')
          .attr('stroke', colors[i])
          .attr('stroke-width', 2)
          .attr('d', line);
      });

      // simple legend
      const legend = d3.select(container)
        .append('div')
        .attr('class', 'legend');

      const items = [
        { label: 'Series 1', color: 'blue' },
        { label: 'Series 2', color: 'green' },
        { label: 'Series 3', color: 'red' }
      ];

      items.forEach(it => {
        const span = legend.append('span');
        span.append('i').attr('class', 'legend-swatch').style('background', it.color);
        span.append('span').text(it.label);
      });
    }

    return () => {
      d3.select(container).selectAll('*').remove();
    };
  }, [data]);

  return <div ref={ref} />;
}
