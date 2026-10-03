import { formatCurrency } from '../utils/formatCurrency';

interface Props {
  amount: number;
  sign?: 'positive' | 'negative' | 'none';
  className?: string;
}

export function CurrencyAmount({ amount, sign = 'none', className = '' }: Props) {
  const prefix = sign === 'positive' ? '+' : sign === 'negative' ? '−' : '';
  return <span className={`tabular-nums whitespace-nowrap ${className}`}>{prefix}{formatCurrency(Math.abs(amount))}</span>;
}
