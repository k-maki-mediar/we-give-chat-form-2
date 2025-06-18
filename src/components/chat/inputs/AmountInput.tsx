"use client";
import { useState } from "react";
import { InputComponentProps } from "../factory";
import { createInputComponent, inputStyles, ValidationError, validators, runValidation } from "./base";

const AmountInput = createInputComponent(({ step, onSubmit }: InputComponentProps) => {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string>();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseInt(value, 10);
    
    // バリデーション
    const validationRules = [];
    validationRules.push(validators.required);
    
    if (step.min !== undefined) {
      validationRules.push(validators.min(step.min));
    }
    
    if (step.max !== undefined) {
      validationRules.push(validators.max(step.max));
    }
    
    const validationError = runValidation(value, validationRules);
    if (validationError) {
      setError(validationError);
      return;
    }
    
    if (!isNaN(amount) && amount > 0) {
      onSubmit(amount, `${amount}円`);
      setValue("");
      setError(undefined);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t">
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <input
            type="number"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setError(undefined);
            }}
            min={step.min || 1}
            max={step.max}
            placeholder={step.placeholder || "金額を入力"}
            className={inputStyles.input}
          />
          <span className="self-center text-gray-700">円</span>
          <button
            type="submit"
            disabled={!value || parseInt(value, 10) <= 0}
            className={`${inputStyles.button} disabled:bg-gray-400`}
          >
            確定
          </button>
        </div>
        <ValidationError message={error} />
      </div>
    </form>
  );
}, {
  displayName: "AmountInput",
  description: "金額入力コンポーネント"
});

export default AmountInput;