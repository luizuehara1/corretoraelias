import React, { useState } from 'react';

interface CurrencyInputProps {
  label: string;
  value: string | number | undefined;
  onChange: (data: { numericValue: number; formattedValue: string }) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  name?: string;
  error?: string;
}

// Helper Functions
export function onlyNumbers(value: any): string {
  return String(value || "").replace(/\D/g, "");
}

export function formatCurrencyInputBR(value: any): string {
  const numeric = onlyNumbers(value);
  if (!numeric) return "";
  const numberValue = Number(numeric);
  return numberValue.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2
  });
}

export function parseCurrencyInputBR(value: any): number {
  if (typeof value === "number") return value;
  const clean = String(value || "")
    .replace(/[R$\s.]/g, "")
    .replace(",", ".");
  const numberValue = Number(clean);
  if (Number.isNaN(numberValue)) return 0;
  return numberValue;
}

export function formatNumberToCurrencyBR(value: any): string {
  const numberValue = Number(value || 0);
  return numberValue.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

export function normalizeCurrencyField(value: any) {
  const numericValue = parseCurrencyInputBR(value);
  const formattedValue = numericValue
    ? formatNumberToCurrencyBR(numericValue)
    : "";
  return {
    numericValue,
    formattedValue
  };
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  label,
  value,
  onChange,
  placeholder = "R$ 0,00",
  required = false,
  disabled = false,
  name,
  error
}) => {
  // Determine clean numeric representation first
  const numericVal = typeof value === "number" ? value : parseCurrencyInputBR(value);
  
  // Format to standard pt-BR currency
  const displayValue = numericVal > 0 ? formatNumberToCurrencyBR(numericVal) : "";

  const [inputError, setInputError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    let digits = rawValue.replace(/\D/g, "");
    
    // Check if the input contains formatting characters (e.g., loaded or typed from a format)
    const isFormatted = rawValue.includes(",") || rawValue.includes(".");
    
    if (isFormatted && digits.length >= 3) {
      digits = digits.slice(0, -2);
    }
    
    if (!digits) {
      if (required) {
        setInputError("Informe um valor válido.");
      } else {
        setInputError(null);
      }
      onChange({ numericValue: 0, formattedValue: "" });
      return;
    }
    
    const numericValue = Number(digits);
    
    if (required && numericValue === 0) {
      setInputError("Informe um valor válido.");
    } else {
      setInputError(null);
    }

    const formattedValue = formatCurrencyInputBR(digits);
    onChange({ numericValue, formattedValue });
  };

  const handleBlur = () => {
    if (required && (!numericVal || numericVal === 0)) {
      setInputError("Informe um valor válido.");
    } else {
      setInputError(null);
    }
  };

  const activeError = error || inputError;

  return (
    <div className="space-y-1 w-full text-left">
      <label className="text-[9px] font-black uppercase text-stone-600 tracking-wider">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      <div className="relative rounded-xl overflow-hidden shadow-sm transition-all duration-200">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-mono text-xs font-black">
          R$
        </div>
        <input
          type="text"
          id={name ? `id_${name}` : undefined}
          name={name}
          disabled={disabled}
          placeholder={placeholder}
          className={`w-full bg-white border ${activeError ? 'border-rose-500 focus:ring-1 focus:ring-rose-500' : 'border-[#EFEFEA] focus:ring-1 focus:ring-amber-500'} rounded-xl pl-9 pr-3 py-2.5 text-xs font-mono font-bold text-stone-900 outline-none transition-colors ${disabled ? 'bg-stone-50 cursor-not-allowed opacity-60' : ''}`}
          value={displayValue ? displayValue.replace("R$", "").trim() : ""}
          onChange={handleInputChange}
          onBlur={handleBlur}
        />
      </div>
      {activeError && (
        <p className="text-[10px] font-semibold text-rose-500 select-none mt-0.5 pl-1 animate-fade-in">
          {activeError}
        </p>
      )}
    </div>
  );
};
