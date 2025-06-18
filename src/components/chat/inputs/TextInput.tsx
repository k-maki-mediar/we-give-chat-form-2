"use client";
import { useState } from "react";
import { InputComponentProps } from "../factory";
import { createInputComponent, inputStyles, ValidationError, validators, runValidation } from "./base";

const TextInput = createInputComponent(({ step, onSubmit }: InputComponentProps) => {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string>();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // バリデーション
    const validationRules = [];
    if (step.validation?.required) {
      validationRules.push(validators.required);
    }
    
    const validationError = runValidation(value, validationRules);
    if (validationError) {
      setError(validationError);
      return;
    }
    
    if (value.trim()) {
      onSubmit(value.trim(), value.trim());
      setValue("");
      setError(undefined);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t">
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <input
            type="text"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setError(undefined);
            }}
            placeholder={step.placeholder || "入力してください"}
            className={inputStyles.input}
          />
          <button
            type="submit"
            disabled={!value.trim()}
            className={`${inputStyles.button} disabled:bg-gray-400`}
          >
            送信
          </button>
        </div>
        <ValidationError message={error} />
      </div>
    </form>
  );
}, {
  displayName: "TextInput",
  description: "テキスト入力コンポーネント"
});

export default TextInput;