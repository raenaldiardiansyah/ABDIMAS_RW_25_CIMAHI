'use client';

import { type InputHTMLAttributes } from 'react';

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export default function FormInput({ label, error, hint, className = '', ...props }: FormInputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-gray-700 dark:text-zinc-300">
        {label}
      </label>
      <input
        className={`
          w-full px-4 py-3 rounded-xl
          bg-gray-50 dark:bg-zinc-800
          border border-gray-200 dark:border-zinc-700
          text-sm text-gray-900 dark:text-white
          placeholder:text-gray-400 dark:placeholder:text-zinc-500
          focus:outline-none focus:ring-2 focus:ring-[#5c3a21]/40 focus:border-[#5c3a21]
          dark:focus:ring-[#c4a07a]/40 dark:focus:border-[#c4a07a]
          transition-all duration-200
          ${error ? 'border-red-400 focus:ring-red-400/40' : ''}
          ${className}
        `}
        {...props}
      />
      {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
      {hint && !error && <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">{hint}</p>}
    </div>
  );
}
