import { InputHTMLAttributes, ReactNode } from 'react';

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  rightElement?: ReactNode;
  error?: string;
};

export function Input({ label, rightElement, error, className = '', ...rest }: Props) {
  return (
    <div className="space-y-1">
      <label className="label">{label}</label>
      <div className="relative">
        <input
          className={`input py-2.5 leading-6 ${rightElement ? 'pr-10' : ''} ${className} ${error ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
          {...rest}
        />
        {rightElement ? <div className="absolute inset-y-0 right-0 flex items-center pr-3">{rightElement}</div> : null}
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
