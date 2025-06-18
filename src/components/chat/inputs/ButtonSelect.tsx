"use client";

import { InputComponentProps } from "../factory";
import { createInputComponent, InputContainer, inputStyles } from "./base";

interface Option {
  label: string;
  value: any;
}

const ButtonSelect = createInputComponent(({ step, onSubmit }: InputComponentProps) => {
  const options = step.options as Option[] | undefined;
  
  if (!options || options.length === 0) return null;

  return (
    <InputContainer>
      <div className="flex flex-wrap gap-2 justify-center">
        {options.map((option, index) => (
          <button
            key={index}
            onClick={() => onSubmit(option.value, option.label)}
            className={inputStyles.button}
          >
            {option.label}
          </button>
        ))}
      </div>
    </InputContainer>
  );
}, {
  displayName: "ButtonSelect",
  description: "ボタン選択コンポーネント"
});

export default ButtonSelect;