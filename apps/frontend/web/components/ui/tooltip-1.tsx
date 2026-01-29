import React, { useMemo } from "react";
import { PlacesType, Tooltip as ReactTooltip } from "react-tooltip";
import clsx from "clsx";

const types = {
  success: "!bg-success !text-white",
  warning: "!bg-warning !text-black",
  error: "!bg-error !text-white",
  violet: "!bg-violet !text-white",
  default: "!bg-geist-foreground !text-background-100"
};

interface TooltipProps {
  children: React.ReactNode;
  text: React.ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  delay?: boolean;
  boxAlign?: "left" | "right" | "center";
  type?: keyof typeof types;
  tip?: boolean;
  center?: boolean;
  className?: string;
}

export const Tooltip = ({
  children,
  text,
  position = "top",
  delay = true,
  boxAlign = "center",
  type = "default",
  tip = true,
  center = true,
  className
}: TooltipProps) => {
  const id = useMemo(() => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  }, []);

  return (
    <div>
      <div id={id} className={clsx("font-sans", className)}>
        {children}
      </div>
      <ReactTooltip
        anchorSelect={`#${id}`}
        place={`${position}${{ left: "-start", right: "-end", center: "" }[boxAlign]}` as PlacesType}
        delayShow={delay ? 500 : 0}
        opacity={1}
        noArrow={!tip}
        className={clsx(
          "!font-sans !text-[13px] !max-w-52 !rounded-lg",
          types[type],
          center ? " text-center" : " text-start"
        )}
      >
        {text}
      </ReactTooltip>
    </div>
  );
};