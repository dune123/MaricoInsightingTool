/**
 * ========================================
 * CALENDAR UI COMPONENT
 * ========================================
 * 
 * Purpose: Date picker calendar with navigation and selection
 * 
 * Description:
 * This is a calendar component from shadcn/ui that provides a date picker
 * calendar interface with month navigation, date selection, and responsive
 * design. It's built on react-day-picker for robust calendar functionality,
 * supporting date selection, range selection, and proper accessibility
 * for date input interfaces.
 * 
 * Key Features:
 * - Month-based calendar display
 * - Date selection and navigation
 * - Range selection support
 * - Responsive design
 * - Accessibility features
 * - Customizable styling
 * 
 * Components:
 * - Calendar: Main calendar container
 * - DayPicker: Core calendar functionality
 * - Navigation buttons (previous/next)
 * - Month display
 * - Date grid
 * - Day cells
 * 
 * Calendar Features:
 * - react-day-picker integration for core functionality
 * - Month navigation
 * - Date selection
 * - Range selection support
 * - Outside days display
 * - Responsive layout
 * 
 * Navigation Features:
 * - Previous month navigation
 * - Next month navigation
 * - Month/year display
 * - Navigation button styling
 * - Icon-based navigation
 * - Smooth transitions
 * 
 * Visual Characteristics:
 * - Clean, organized layout
 * - Consistent with design system
 * - Proper spacing and alignment
 * - Responsive grid design
 * - Hover and focus states
 * - Selected state styling
 * 
 * Date Selection:
 * - Single date selection
 * - Range selection support
 * - Today highlighting
 * - Selected date styling
 * - Disabled date handling
 * - Outside day styling
 * 
 * Accessibility Features:
 * - ARIA attributes and roles
 * - Focus management
 * - Screen reader support
 * - Keyboard navigation
 * - Proper calendar semantics
 * - Date selection feedback
 * 
 * Usage Examples:
 * - Date input forms
 * - Appointment scheduling
 * - Event date selection
 * - Date range selection
 * - Booking interfaces
 * - Calendar applications
 * 
 * Used by:
 * - Date input interfaces
 * - Scheduling systems
 * - Booking applications
 * - Event management
 * - Calendar interfaces
 * - Date selection forms
 * 
 * Dependencies:
 * - react-day-picker for calendar functionality
 * - React for rendering
 * - Lucide React icons for navigation
 * - Button component for styling
 * - cn utility for conditional styling
 * - Tailwind CSS for styling
 * 
 * Last Updated: 2025-01-27
 * Author: BrandBloom Frontend Team (shadcn/ui)
 */

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell:
          "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside:
          "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ..._props }) => <ChevronLeft className="h-4 w-4" />,
        IconRight: ({ ..._props }) => <ChevronRight className="h-4 w-4" />,
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
