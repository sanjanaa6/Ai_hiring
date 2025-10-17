import * as React from "react";

const Input = React.forwardRef(
  ({ className = "", type = "text", isDarkMode, ...props }, ref) => {
    // Determine text color based on dark mode
    const textColor = isDarkMode ? "text-white" : "text-black";
    const borderColor = isDarkMode ? "border-zinc-600" : "border-gray-300";
    const bgColor = isDarkMode ? "bg-zinc-800" : "bg-white";
    
    return (
      <input
        type={type}
        className={`flex h-9 w-full rounded-md border ${borderColor} ${bgColor} ${textColor} px-3 py-1 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${className}`}
        ref={ref}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";

export { Input }; 