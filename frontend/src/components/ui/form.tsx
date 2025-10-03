/**
 * ========================================
 * FORM UI COMPONENT
 * ========================================
 * 
 * Purpose: Form management system with validation and accessibility
 * 
 * Description:
 * This is a form component from shadcn/ui that provides a comprehensive
 * form management system with validation, accessibility, and proper form
 * state handling. It's built on React Hook Form for robust form functionality,
 * supporting form validation, error handling, and proper form semantics
 * with accessibility features.
 * 
 * Key Features:
 * - Form state management
 * - Form validation support
 * - Error handling and display
 * - Accessibility features
 * - Form field context
 * - Form item management
 * 
 * Components:
 * - Form: Main form provider
 * - FormField: Form field wrapper
 * - FormItem: Form item container
 * - FormLabel: Form label with error handling
 * - FormControl: Form control wrapper
 * - FormDescription: Form field description
 * - FormMessage: Form error/success message
 * - useFormField: Form field hook
 * 
 * Form Features:
 * - React Hook Form integration
 * - Form validation support
 * - Error state management
 * - Form field context
 * - Form item organization
 * - Accessibility support
 * 
 * Validation Features:
 * - Built-in validation support
 * - Error state handling
 * - Form state management
 * - Validation rules
 * - Error display
 * - Success states
 * 
 * Accessibility Features:
 * - Proper form semantics
 * - ARIA attributes and roles
 * - Label associations
 * - Error announcements
 * - Screen reader support
 * - Keyboard navigation
 * 
 * Form Management:
 * - Form state persistence
 * - Field value tracking
 * - Form submission handling
 * - Form reset functionality
 * - Form validation
 * - Error handling
 * 
 * Visual Characteristics:
 * - Clean, organized layout
 * - Consistent with design system
 * - Proper spacing and alignment
 * - Error state styling
 * - Success state styling
 * - Responsive design
 * 
 * Usage Examples:
 * - User registration forms
 * - Data input forms
 * - Configuration forms
 * - Search forms
 * - Contact forms
 * - Settings forms
 * 
 * Used by:
 * - User interface forms
 * - Data input interfaces
 * - Configuration panels
 * - Search interfaces
 * - Contact forms
 * - Settings interfaces
 * 
 * Dependencies:
 * - React Hook Form for form management
 * - Radix UI Label primitive
 * - Radix UI Slot primitive
 * - React context for state management
 * - Label component for form labels
 * - cn utility for conditional styling
 * - Tailwind CSS for styling
 * 
 * Last Updated: 2025-01-27
 * Author: BrandBloom Frontend Team (shadcn/ui)
 */

import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { Slot } from "@radix-ui/react-slot"
import {
  Controller,
  ControllerProps,
  FieldPath,
  FieldValues,
  FormProvider,
  useFormContext,
} from "react-hook-form"

import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"

const Form = FormProvider

type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> = {
  name: TName
}

const FormFieldContext = React.createContext<FormFieldContextValue>(
  {} as FormFieldContextValue
)

const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  ...props
}: ControllerProps<TFieldValues, TName>) => {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  )
}

const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext)
  const itemContext = React.useContext(FormItemContext)
  const { getFieldState, formState } = useFormContext()

  const fieldState = getFieldState(fieldContext.name, formState)

  if (!fieldContext) {
    throw new Error("useFormField should be used within <FormField>")
  }

  const { id } = itemContext

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  }
}

type FormItemContextValue = {
  id: string
}

const FormItemContext = React.createContext<FormItemContextValue>(
  {} as FormItemContextValue
)

const FormItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const id = React.useId()

  return (
    <FormItemContext.Provider value={{ id }}>
      <div ref={ref} className={cn("space-y-2", className)} {...props} />
    </FormItemContext.Provider>
  )
})
FormItem.displayName = "FormItem"

const FormLabel = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => {
  const { error, formItemId } = useFormField()

  return (
    <Label
      ref={ref}
      className={cn(error && "text-destructive", className)}
      htmlFor={formItemId}
      {...props}
    />
  )
})
FormLabel.displayName = "FormLabel"

const FormControl = React.forwardRef<
  React.ElementRef<typeof Slot>,
  React.ComponentPropsWithoutRef<typeof Slot>
>(({ ...props }, ref) => {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField()

  return (
    <Slot
      ref={ref}
      id={formItemId}
      aria-describedby={
        !error
          ? `${formDescriptionId}`
          : `${formDescriptionId} ${formMessageId}`
      }
      aria-invalid={!!error}
      {...props}
    />
  )
})
FormControl.displayName = "FormControl"

const FormDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  const { formDescriptionId } = useFormField()

  return (
    <p
      ref={ref}
      id={formDescriptionId}
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
})
FormDescription.displayName = "FormDescription"

const FormMessage = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => {
  const { error, formMessageId } = useFormField()
  const body = error ? String(error?.message) : children

  if (!body) {
    return null
  }

  return (
    <p
      ref={ref}
      id={formMessageId}
      className={cn("text-sm font-medium text-destructive", className)}
      {...props}
    >
      {body}
    </p>
  )
})
FormMessage.displayName = "FormMessage"

export {
  useFormField,
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
}
