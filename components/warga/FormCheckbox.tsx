'use client';

interface CheckboxOption {
  value: string;
  label: string;
}

interface FormCheckboxProps {
  label: string;
  options: CheckboxOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  error?: string;
  singleSelect?: boolean;
}

export default function FormCheckbox({ label, options, selected, onChange, error, singleSelect }: FormCheckboxProps) {
  const toggle = (value: string) => {
    if (singleSelect) {
      if (selected.includes(value)) {
        onChange([]);
      } else {
        onChange([value]);
      }
    } else {
      if (selected.includes(value)) {
        onChange(selected.filter((v) => v !== value));
      } else {
        onChange([...selected, value]);
      }
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-semibold text-gray-700 dark:text-zinc-300">
        {label}
      </label>
      <div className="flex flex-col gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => toggle(opt.value)}
            className={`
              flex items-center gap-3 px-4 py-3 rounded-xl border text-sm transition-all duration-200 text-left
              ${selected.includes(opt.value)
                ? 'bg-[#5c3a21]/10 border-[#5c3a21] text-[#5c3a21] dark:bg-[#c4a07a]/10 dark:border-[#c4a07a] dark:text-[#c4a07a]'
                : 'bg-gray-50 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-300'
              }
            `}
          >
            <div className={`
              ${singleSelect ? 'w-5 h-5 rounded-full' : 'w-5 h-5 rounded-md'} border-2 flex items-center justify-center shrink-0 transition-all
              ${selected.includes(opt.value)
                ? 'bg-[#5c3a21] border-[#5c3a21] dark:bg-[#c4a07a] dark:border-[#c4a07a]'
                : 'border-gray-300 dark:border-zinc-600'
              }
            `}>
              {selected.includes(opt.value) && (
                singleSelect ? (
                  <div className="w-2 h-2 rounded-full bg-white dark:bg-zinc-900" />
                ) : (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )
              )}
            </div>
            <span className="font-medium">{opt.label}</span>
          </button>
        ))}
      </div>
      {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
    </div>
  );
}
