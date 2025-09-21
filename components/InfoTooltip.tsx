"use client";

import { useState } from "react";
import { Info } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface InfoTooltipProps {
  content: string;
  className?: string;
  iconClassName?: string;
  side?: 'top' | 'bottom' | 'left' | 'right';
}

export default function InfoTooltip({ 
  content, 
  className = "",
  iconClassName = "",
  side = 'top'
}: InfoTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  const getTooltipPosition = () => {
    switch (side) {
      case 'top':
        return 'bottom-full mb-2 left-1/2 transform -translate-x-1/2';
      case 'bottom':
        return 'top-full mt-2 left-1/2 transform -translate-x-1/2';
      case 'left':
        return 'right-full mr-2 top-1/2 transform -translate-y-1/2';
      case 'right':
        return 'left-full ml-2 top-1/2 transform -translate-y-1/2';
      default:
        return 'bottom-full mb-2 left-1/2 transform -translate-x-1/2';
    }
  };

  const getArrowPosition = () => {
    switch (side) {
      case 'top':
        return 'top-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-gray-800 dark:border-t-gray-200';
      case 'bottom':
        return 'bottom-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-gray-800 dark:border-b-gray-200';
      case 'left':
        return 'left-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-gray-800 dark:border-l-gray-200';
      case 'right':
        return 'right-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-gray-800 dark:border-r-gray-200';
      default:
        return 'top-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-gray-800 dark:border-t-gray-200';
    }
  };

  return (
    <div 
      className={`relative inline-flex ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      <button
        type="button"
        className={`
          inline-flex items-center justify-center w-4 h-4 rounded-full
          text-muted-foreground hover:text-foreground
          focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
          transition-colors duration-200
          ${iconClassName}
        `}
        aria-label="More information"
        tabIndex={0}
      >
        <Info className="w-3 h-3" />
      </button>

      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            className={`
              absolute z-50 px-3 py-2 text-xs font-medium text-white bg-gray-800 
              dark:bg-gray-200 dark:text-gray-800 rounded-md shadow-lg
              max-w-xs whitespace-normal
              ${getTooltipPosition()}
            `}
            role="tooltip"
          >
            {content}
            
            {/* Arrow */}
            <div 
              className={`absolute w-0 h-0 border-4 ${getArrowPosition()}`}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}