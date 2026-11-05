'use client';

import { forwardRef } from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { Textarea, type TextareaProps } from '../textarea';
import { mergeRefs } from './merge-refs';

type FormTextareaProps = Omit<TextareaProps, 'error'> & {
  /**
   * Field name for react-hook-form
   */
  name: string;
  /**
   * Custom error message override
   */
  error?: string;
};

/**
 * FormTextarea - A Textarea component that integrates with React Hook Form
 *
 * Automatically handles form state, validation errors, and field registration.
 *
 * @example
 * ```tsx
 * <FormWrapper formInstance={form} onSubmit={handleSubmit}>
 *   <FormTextarea
 *     name="note"
 *     label="Note"
 *     required
 *     placeholder="Enter your note"
 *   />
 * </FormWrapper>
 * ```
 */
export const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  ({ name, error: customError, ...textareaProps }, ref) => {
    const formContext = useFormContext();

    // Outside a FormProvider, behave as a plain Textarea.
    if (!formContext) {
      return <Textarea ref={ref} error={customError} {...textareaProps} />;
    }

    // React Hook Form's field bindings are applied last so caller props cannot
    // replace them; caller handlers and refs are composed instead. fieldState
    // resolves nested names such as "address.street".
    return (
      <Controller
        name={name}
        control={formContext.control}
        render={({ field, fieldState }) => (
          <Textarea
            {...textareaProps}
            name={field.name}
            value={field.value ?? ''}
            disabled={field.disabled ?? textareaProps.disabled}
            ref={mergeRefs(field.ref, ref)}
            onChange={(event) => {
              textareaProps.onChange?.(event);
              field.onChange(event);
            }}
            onBlur={(event) => {
              textareaProps.onBlur?.(event);
              field.onBlur();
            }}
            error={customError || fieldState.error?.message}
          />
        )}
      />
    );
  },
);

FormTextarea.displayName = 'FormTextarea';
