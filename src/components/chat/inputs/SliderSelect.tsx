"use client";
import { useState } from "react";
import { InputComponentProps } from "../factory";
import { createInputComponent, InputContainer, inputStyles } from "./base";

interface SliderOptions {
  min: number;
  max: number;
  step: number;
  leftLabel: string;
  rightLabel: string;
  defaultValue: number;
}

const SliderSelect = createInputComponent(({ step, onSubmit }: InputComponentProps) => {
  const options = step.options as SliderOptions;
  const [value, setValue] = useState(options?.defaultValue || 50);

  if (!options) {
    return (
      <InputContainer>
        <p className="text-red-500">スライダーオプションが定義されていません</p>
      </InputContainer>
    );
  }

  const handleSubmit = () => {
    onSubmit(value, `${value}%`);
  };

  return (
    <InputContainer>
      <div className="space-y-4">
        <div className="flex justify-between text-sm text-gray-600">
          <span>{options.leftLabel}</span>
          <span className="font-bold text-lg">{value}%</span>
          <span>{options.rightLabel}</span>
        </div>
        
        <input
          type="range"
          min={options.min}
          max={options.max}
          step={options.step}
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
        
        <div className="flex justify-center">
          <button
            onClick={handleSubmit}
            className={inputStyles.button}
          >
            決定
          </button>
        </div>
      </div>
    </InputContainer>
  );
}, {
  displayName: "SliderSelect",
  description: "スライダー選択コンポーネント"
});

export default SliderSelect;