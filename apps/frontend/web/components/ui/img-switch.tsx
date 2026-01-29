import React, { createContext, useContext, useEffect, useState } from "react";
import clsx from "clsx";
import { twMerge } from "tailwind-merge";

const SwitchContext = createContext<{
  value: string | null;
  setValue: (value: string | null) => void;
} | null>(null);

interface SwitchProps {
  children: React.ReactNode;
  name?: string;
  size?: "small" | "medium" | "large";
  style?: React.CSSProperties;
  value?: string | null;
  onChange?: (value: string | null) => void;
}

export const ImgSwitch = ({ children, name = "default", size = "medium", style, value: controlledValue, onChange }: SwitchProps) => {
  const [internalValue, setInternalValue] = useState<string | null>(null);
  
  // 判断是否为受控模式
  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : internalValue;
  
  const setValue = (newValue: string | null) => {
    if (isControlled) {
      onChange?.(newValue);
    } else {
      setInternalValue(newValue);
    }
  };

  return (
    <SwitchContext.Provider value={{ value, setValue }}>
      <div
        className={clsx(
          "flex bg-background-100 p-1 border border-gray-alpha-400",
          size === "small" && "h-8 rounded-md",
          size === "medium" && "h-10 rounded-md",
          size === "large" && "h-12 rounded-lg"
        )}
        style={style}>
        {React.Children.map(children, (child) =>
          React.cloneElement(child as React.ReactElement<SwitchControlProps>, { size, name }))}
      </div>
    </SwitchContext.Provider>
  );
};

interface SwitchControlProps {
  label?: string;
  value: string;
  defaultChecked?: boolean;
  disabled?: boolean;
  name?: string;
  size?: "small" | "medium" | "large";
  icon?: React.ReactNode;
}

const SwitchControl = ({
  label,
  value,
  defaultChecked,
  disabled = false,
  name,
  size = "medium",
  icon
}: SwitchControlProps) => {
  const context = useContext(SwitchContext);
  const checked = value === context?.value;

  useEffect(() => {
    if (defaultChecked) {
      context?.setValue(value);
    }
  }, []);

  return (
    <label
      className={clsx("flex flex-1 h-full", disabled && "cursor-not-allowed pointer-events-none")}
      onClick={() => context?.setValue(value)}
    >
      <input
        type="radio"
        name={name}
        value={value}
        disabled={disabled}
        checked={checked}
        onChange={() => {}} // onChange is handled by label onClick
        className="hidden"
      />
      <span
        className={twMerge(clsx(
          "flex items-center justify-center flex-1 cursor-pointer font-medium font-sans duration-150",
          checked ? "bg-gray-100 text-gray-1000 fill-gray-1000 rounded-sm" : "text-gray-900 hover:text-gray-1000 fill-gray-900 hover:fill-gray-1000",
          disabled && "text-gray-800 fill-gray-800",
          !icon && size === "small" && "text-sm px-3",
          !icon && size === "medium" && "text-sm px-3",
          !icon && size === "large" && "text-base px-4",
          icon && size === "small" && "py-1 px-2",
          icon && size === "medium" && "py-2 px-3",
          icon && size === "large" && "p-3"
        ))}
      >
        {icon ? <span className={clsx(size === "large" && "scale-125")}>{icon}</span> : label}
      </span>
    </label>
  );
};

ImgSwitch.Control = SwitchControl;
