import { Input } from '../forms/Fields';
import { parseNumeric } from '../../utils/formatting';

export function NumberInput({ value, onChange, min = 0, step = 'any', ...props }) {
  return (
    <Input
      type="number"
      min={min}
      step={step}
      value={value}
      onChange={(e) => onChange?.(parseNumeric(e.target.value), e)}
      {...props}
    />
  );
}

export function CurrencyInput({ value, onChange, ...props }) {
  return (
    <NumberInput
      min={0}
      value={value}
      onChange={onChange}
      {...props}
    />
  );
}
