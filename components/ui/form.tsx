"use client"

import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { Slot } from "@radix-ui/react-slot"
import {
  Controller,
  FormProvider,
  useFormContext,
  useFormState,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
} from "react-hook-form"

import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const Form = FormProvider

type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName
}

const FormFieldContext = React.createContext<FormFieldContextValue>(
  {} as FormFieldContextValue
)

const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
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
  const { getFieldState } = useFormContext()
  const formState = useFormState({ name: fieldContext.name })
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

function FormItem({ className, ...props }: React.ComponentProps<"div">) {
  const id = React.useId()

  return (
    <FormItemContext.Provider value={{ id }}>
      <div
        data-slot="form-item"
        className={cn("grid gap-2", className)}
        {...props}
      />
    </FormItemContext.Provider>
  )
}

function FormLabel({
  className,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root>) {
  const { error, formItemId } = useFormField()

  return (
    <Label
      data-slot="form-label"
      data-error={!!error}
      className={cn("data-[error=true]:text-destructive", className)}
      htmlFor={formItemId}
      {...props}
    />
  )
}

function FormControl({ ...props }: React.ComponentProps<typeof Slot>) {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField()
  const [isMounted, setIsMounted] = React.useState(false)
  // Initialize hasBlurred based on whether field has a value (handles pre-filled invalid values)
  const hasInitialValue = 'value' in props && Boolean(props.value)
  const [hasBlurred, setHasBlurred] = React.useState(hasInitialValue)
  const [isFocused, setIsFocused] = React.useState(false)

  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  const handleBlur = (e: React.FocusEvent<HTMLElement>) => {
    setHasBlurred(true)
    setIsFocused(false)
    // Chamar onBlur original se existir
    if (props.onBlur) {
      props.onBlur(e as React.FocusEvent<HTMLInputElement>)
    }
  }

  const handleFocus = (e: React.FocusEvent<HTMLElement>) => {
    setIsFocused(true)
    // Chamar onFocus original se existir
    if (props.onFocus) {
      props.onFocus(e as React.FocusEvent<HTMLInputElement>)
    }
  }

  const slotElement = (
    <Slot
      data-slot="form-control"
      id={formItemId}
      aria-describedby={
        !error
          ? `${formDescriptionId}`
          : `${formDescriptionId} ${formMessageId}`
      }
      aria-invalid={!!error}
      onBlur={handleBlur}
      onFocus={handleFocus}
      {...props}
    />
  )

  // Só renderiza tooltip no cliente após montagem para evitar erros de hidratação
  // E só mostra tooltip se o usuário já saiu do campo ou o campo não está focado
  if (error && isMounted && (hasBlurred || !isFocused)) {
    return (
      <>
        <Tooltip
          open={hasBlurred && !isFocused}
          onOpenChange={() => {
            // Não fazer nada - prevenir comportamento padrão
          }}
        >
          <TooltipTrigger asChild>
            {slotElement}
          </TooltipTrigger>
          <TooltipContent
            side="top"
            className="bg-destructive text-destructive-foreground"
          >
            <p>{error.message}</p>
          </TooltipContent>
        </Tooltip>
        {/* Visually hidden element for aria-describedby accessibility */}
        <p id={formMessageId} className="sr-only">
          {error.message}
        </p>
      </>
    )
  }

  return slotElement
}

function FormDescription({ className, ...props }: React.ComponentProps<"p">) {
  const { formDescriptionId } = useFormField()

  return (
    <p
      data-slot="form-description"
      id={formDescriptionId}
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

function FormMessage() {
  // Não renderiza nada - erros são mostrados via tooltip no FormControl
  return null
}

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