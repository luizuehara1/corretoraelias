import React from 'react';

interface PercentInputProps {
  label: string;
  value: string | number | undefined;
  onChange: (data: { numericValue: number; formattedValue: string }) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  name?: string;
}

export function formatPercentBR(value: any): string {
  if (value === undefined || value === null || value === "") return "";
  const num = Number(value);
  if (Number.isNaN(num)) return "";
  return num.toLocaleString("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }) + "%";
}

export const PercentInput: React.FC<PercentInputProps> = ({
  label,
  value,
  onChange,
  placeholder = "Ex: 6%",
  required = false,
  disabled = false,
  name
}) => {
  const displayValue = value !== undefined && value !== null && value !== "" && value !== 0
    ? String(value).replace(".", ",") + "%"
    : "";

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    
    // Allow numbers, period, and comma (convert comma to period)
    const cleanStr = rawValue
      .replace(/%/g, "")
      .replace(",", ".")
      .replace(/[^\d.]/g, "");
    
    if (!cleanStr) {
      onChange({ numericValue: 0, formattedValue: "" });
      return;
    }
    
    // Ensure only one period
    const parts = cleanStr.split(".");
    let normalized = parts[0];
    if (parts.length > 1) {
      normalized += "." + parts.slice(1).join("");
    }
    
    const numericValue = Number(normalized);
    if (Number.isNaN(numericValue)) return;
    
    const formattedValue = normalized.replace(".", ",") + "%";
    
    onChange({ numericValue, formattedValue });
  };

  return (
    <div className="space-y-1 w-full text-left">
      <label className="text-[9px] font-black uppercase text-stone-600 tracking-wider">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      <div className="relative rounded-xl overflow-hidden shadow-sm transition-all duration-200">
        <input
          type="text"
          id={name ? `id_${name}` : undefined}
          name={name}
          disabled={disabled}
          placeholder={placeholder}
          className={`w-full bg-white border border-[#EFEFEA] focus:ring-1 focus:ring-amber-500 rounded-xl px-4 py-2.5 text-xs font-mono font-bold text-stone-900 outline-none transition-colors ${disabled ? 'bg-stone-50 cursor-not-allowed opacity-60' : ''}`}
          value={displayValue}
          onChange={handleInputChange}
        />
      </div>
    </div>
  );
};
