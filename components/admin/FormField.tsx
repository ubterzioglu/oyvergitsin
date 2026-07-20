'use client'

import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'

interface FieldWrapperProps {
  label: string
  htmlFor: string
  error?: string
  children: ReactNode
}

function FieldWrapper({ label, htmlFor, error, children }: FieldWrapperProps) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1 block text-sm font-medium text-ink-secondary">
        {label}
      </label>
      {children}
      {error ? <p className="mt-1 text-sm text-red-600">{error}</p> : null}
    </div>
  )
}

const INPUT_CLASSES =
  'w-full rounded-lg border border-border px-4 py-2 text-ink-primary focus:border-brand-accent focus:outline-none'

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
}

export function TextField({ label, error, id, className = '', ...props }: TextFieldProps) {
  return (
    <FieldWrapper label={label} htmlFor={id as string} error={error}>
      <input id={id} className={`${INPUT_CLASSES} ${className}`} {...props} />
    </FieldWrapper>
  )
}

interface TextAreaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  error?: string
}

export function TextAreaField({ label, error, id, className = '', ...props }: TextAreaFieldProps) {
  return (
    <FieldWrapper label={label} htmlFor={id as string} error={error}>
      <textarea id={id} className={`${INPUT_CLASSES} ${className}`} {...props} />
    </FieldWrapper>
  )
}

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  error?: string
  children: ReactNode
}

export function SelectField({ label, error, id, className = '', children, ...props }: SelectFieldProps) {
  return (
    <FieldWrapper label={label} htmlFor={id as string} error={error}>
      <select id={id} className={`${INPUT_CLASSES} ${className}`} {...props}>
        {children}
      </select>
    </FieldWrapper>
  )
}

interface CheckboxFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
}

export function CheckboxField({ label, id, className = '', ...props }: CheckboxFieldProps) {
  return (
    <label htmlFor={id} className="flex items-center gap-2 text-sm font-medium text-ink-secondary">
      <input id={id} type="checkbox" className={`h-4 w-4 rounded border-border ${className}`} {...props} />
      {label}
    </label>
  )
}
