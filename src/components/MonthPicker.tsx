import React from 'react';

interface Props {
  year: number;
  month: number;
  onChange: (year: number, month: number) => void;
}

export const MonthPicker: React.FC<Props> = ({ year, month, onChange }) => {
  const go = (dir: number) => {
    let m = month + dir;
    let y = year;
    if (m < 1) { m = 12; y--; }
    if (m > 12) { m = 1; y++; }
    onChange(y, m);
  };

  return (
    <div className="month-picker">
      <button onClick={() => go(-1)}>◀</button>
      <span className="month-label">{year}年{month}月</span>
      <button onClick={() => go(1)}>▶</button>
    </div>
  );
};
