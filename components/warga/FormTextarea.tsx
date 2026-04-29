'use client';

interface FormTextareaProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  error?: string;
}

export default function FormTextarea({ label, value, onChange, placeholder, maxLength = 500, error }: FormTextareaProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-gray-700 dark:text-zinc-300">
          {label}
        </label>
        <span className={`text-xs ${value.length >= maxLength ? 'text-red-500' : 'text-gray-400 dark:text-zinc-500'}`}>
          {value.length}/{maxLength}
        </span>
      </div>
      <textarea
        value={value}
        onChange={(e) => {
          if (e.target.value.length <= maxLength) {
            onChange(e.target.value);
          }
        }}
        placeholder={placeholder}
        rows={4}
        className={`
          w-full px-4 py-3 rounded-xl resize-none
          bg-gray-50 dark:bg-zinc-800
          border border-gray-200 dark:border-zinc-700
          text-sm text-gray-900 dark:text-white
          placeholder:text-gray-400 dark:placeholder:text-zinc-500
          focus:outline-none focus:ring-2 focus:ring-[#5c3a21]/40 focus:border-[#5c3a21]
          dark:focus:ring-[#c4a07a]/40 dark:focus:border-[#c4a07a]
          transition-all duration-200
          ${error ? 'border-red-400' : ''}
        `}
      />
      {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
    </div>
  );
}
