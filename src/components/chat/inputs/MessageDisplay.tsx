"use client";
import { useEffect } from "react";
import { InputComponentProps } from "../factory";

const MessageDisplay = ({ step, onSubmit }: InputComponentProps) => {
  useEffect(() => {
    // メッセージタイプは表示のみで、自動的に次のステップに進む
    if (step.nextStep) {
      // 少し遅延を入れて自動遷移
      const timer = setTimeout(() => {
        onSubmit(null, "auto_advance");
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [step.nextStep, onSubmit]);

  return null; // メッセージは ChatWindow で表示されるので、ここでは何も表示しない
};

export default MessageDisplay;