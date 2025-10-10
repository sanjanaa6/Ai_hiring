import React from "react";

const Button = ({
  children,
  variant = "default",
  size = "default",
  className = "",
  ...props
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case "ghost":
        return "bg-transparent hover:bg-zinc-700 text-white";
      case "lightGhost":
        return "bg-transparent hover:bg-gray-200 text-black";
      case "primary":
        return "bg-cyan-600 hover:bg-cyan-700 text-white";
      default:
        return "bg-zinc-800 hover:bg-zinc-700 text-white";
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case "icon":
        return "h-8 w-8 p-0 rounded-md";
      case "sm":
        return "h-8 px-3 rounded-md text-sm";
      case "lg":
        return "h-11 px-5 rounded-md text-base";
      default:
        return "h-10 px-4 rounded-md";
    }
  };

  return (
    <button
      className={`${getVariantClasses()} ${getSizeClasses()} inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 disabled:pointer-events-none disabled:opacity-50 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export { Button }; 