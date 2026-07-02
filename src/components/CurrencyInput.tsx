import React, { useState, useEffect } from 'react';
import { formatCurrencyBR, parseCurrencyBR, cleanCurrencyInput } from '../lib/currency-utils';

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

// Re-export helpers for backward compatibility
export { formatCurrencyBR as formatNumberToCurrencyBR };
export { parseCurrencyBR as parseCurrencyInputBR };

export function onlyNumbers(value: any): string {
  return String(value || "").replace(/\D/g, "");
}

export function formatCurrencyInputBR(value: any): string {
  const numeric = onlyNumbers(value);
  if (!numeric) return "";
  const numberValue = Number(numeric) / 100;
  return formatCurrencyBR(numberValue);
}

export function normalizeCurrencyField(value: any) {
  const numericValue = parseCurrencyBR(value);
  const formattedValue = formatCurrencyBR(numericValue);
  return {
    numericValue,
    formattedValue
  };
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  label,
  value,
  onChange,
  placeholder = "0,00",
  required = false,
  disabled = false,
  name,
  error
}) => {
  const [valorDisplay, setValorDisplay] = useState<string>("");
  const [inputError, setInputError] = useState<string | null>(null);

  // Synchronize internal display state with parent value
  useEffect(() => {
    if (value !== undefined && value !== null && value !== "") {
      const numericVal = typeof value === "number" ? value : parseCurrencyBR(value);
      const parsedDisplay = parseCurrencyBR(valorDisplay);
      if (numericVal !== parsedDisplay) {
        // Format without R$ for the input field
        const formatted = formatCurrencyBR(numericVal).replace("R$", "").trim();
        setValorDisplay(numericVal > 0 ? formatted : "");
      }
    } else {
      setValorDisplay("");
    }
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    
    // Only allow digits, comma, dot, spaces
    const cleaned = cleanCurrencyInput(rawValue);
    setValorDisplay(cleaned);

    const numericValue = parseCurrencyBR(cleaned);
    
    // Do not show validation error while user is actively typing
    setInputError(null);

    const formattedValue = formatCurrencyBR(numericValue);
    onChange({ numericValue, formattedValue });
  };

  const handleBlur = () => {
    const numericValue = parseCurrencyBR(valorDisplay);
    
    if (required && (!numericValue || numericValue <= 0)) {
      setInputError("Informe um valor válido.");
    } else {
      setInputError(null);
    }

    if (!isNaN(numericValue) && numericValue > 0) {
      // Format without R$ for the input field
      const formatted = formatCurrencyBR(numericValue).replace("R$", "").trim();
      setValorDisplay(formatted);
    } else {
      setValorDisplay("");
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
          inputMode="decimal"
          id={name ? `id_${name}` : undefined}
          name={name}
          disabled={disabled}
          placeholder={placeholder}
          className={`w-full bg-white border ${activeError ? 'border-rose-500 focus:ring-1 focus:ring-rose-500' : 'border-[#EFEFEA] focus:ring-1 focus:ring-amber-500'} rounded-xl pl-9 pr-3 py-2.5 text-xs font-mono font-bold text-stone-900 outline-none transition-colors ${disabled ? 'bg-stone-50 cursor-not-allowed opacity-60' : ''}`}
          value={valorDisplay}
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
