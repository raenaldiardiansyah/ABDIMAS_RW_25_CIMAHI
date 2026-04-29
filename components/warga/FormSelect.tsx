'use client';

interface FormSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  error?: string;
}

export default function FormSelect({ label, value, onChange, options, placeholder = 'Pilih...', error }: FormSelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-gray-700 dark:text-zinc-300">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`
          w-full px-4 py-3 rounded-xl appearance-none
          bg-gray-50 dark:bg-zinc-800
          border border-gray-200 dark:border-zinc-700
          text-sm text-gray-900 dark:text-white
          focus:outline-none focus:ring-2 focus:ring-[#5c3a21]/40 focus:border-[#5c3a21]
          dark:focus:ring-[#c4a07a]/40 dark:focus:border-[#c4a07a]
          transition-all duration-200
          bg-[url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")]
          bg-no-repeat bg-[center_right_1rem]
          ${error ? 'border-red-400' : ''}
        `}
      >
        <option value="" disabled className="text-gray-400">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
    </div>
  );
}
