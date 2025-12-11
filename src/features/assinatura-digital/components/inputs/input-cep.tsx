import * as React from 'react';
import { IMaskInput } from 'react-imask';
import { cn } from '@/lib/utils';
import { buscarEnderecoPorCep } from '@/lib/utils/viacep';
import { Loader2 } from 'lucide-react';

/**
 * Adapter type for address data returned by InputCEP's onAddressFound callback.
 * Maps from EnderecoViaCep (cidade → localidade, estado → uf) to match common
 * form field naming conventions.
 */
export type InputCepAddress = {
  logradouro: string;
  bairro: string;
  localidade: string;
  uf: string;
};

/**
 * Alias for InputCepAddress for backward compatibility.
 */
export type AddressData = InputCepAddress;

export interface InputCEPProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange' | 'onBlur'> {
  label?: string;
  error?: string;
  onAddressFound?: (address: InputCepAddress) => void;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
}

const InputCEP = React.forwardRef<HTMLInputElement, InputCEPProps>(
  ({ label, error, className, disabled, onAddressFound, onChange, onBlur, value, ...props }, ref) => {
    const [isSearching, setIsSearching] = React.useState(false);
    const lastSearchedCepRef = React.useRef<string>('');

    const searchCEP = async (cep: string) => {
      if (isSearching || cep === lastSearchedCepRef.current) return;
      lastSearchedCepRef.current = cep;
      setIsSearching(true);

      try {
        const result = await buscarEnderecoPorCep(cep);
        if (result && onAddressFound) {
          // Adapter: EnderecoViaCep → AddressData format
          onAddressFound({
            logradouro: result.logradouro,
            bairro: result.bairro,
            localidade: result.cidade,  // cidade → localidade
            uf: result.estado,          // estado → uf
          });
        }
      } catch {
        // Silently fail - allow manual entry
      } finally {
        setIsSearching(false);
      }
    };

    return (
      <div className="space-y-2">
        {label && (
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            {label}
          </label>
        )}
        <div className="relative">
          <IMaskInput
            mask="00000-000"
            unmask={false}
            value={value as string}
            disabled={disabled || isSearching}
            inputRef={ref}
            onAccept={(maskedValue) => {
              // Extract digits for CEP search
              const cep = maskedValue.replace(/\D/g, '');

              // Disparar busca ao completar 8 dígitos
              if (cep.length === 8) {
                searchCEP(cep);
              }

              // Call original onChange if provided
              if (onChange) {
                const syntheticEvent = {
                  target: { value: maskedValue },
                  currentTarget: { value: maskedValue }
                } as React.ChangeEvent<HTMLInputElement>;
                onChange(syntheticEvent);
              }
            }}
            onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
              const cep = e.target.value.replace(/\D/g, '');

              // Fallback: buscar no blur se ainda não buscou
              if (cep.length === 8) {
                searchCEP(cep);
              }

              // Call original onBlur if provided
              if (onBlur) {
                onBlur(e);
              }
            }}
            {...props}
            className={cn(
              "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
              "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
              "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
              className
            )}
            aria-invalid={!!error}
          />
          {isSearching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </div>
    );
  }
);

InputCEP.displayName = 'InputCEP';

export default InputCEP;