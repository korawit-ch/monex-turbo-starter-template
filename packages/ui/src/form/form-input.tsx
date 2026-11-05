'use client';

import { forwardRef } from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { Input, type InputProps } from '../input';
import { mergeRefs } from './merge-refs';

type FormInputProps = Omit<InputProps, 'error'> & {
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
 * FormInput - An Input component that integrates with React Hook Form
 *
 * Automatically handles form state, validation errors, and field registration.
 *
 * @example
 * ```tsx
 * <FormWrapper formInstance={form} onSubmit={handleSubmit}>
 *   <FormInput
 *     name="email"
 *     label="Email"
 *     required
 *     placeholder="Enter your email"
 *   />
 * </FormWrapper>
 * ```
 */
export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ name, error: customError, ...inputProps }, ref) => {
    const formContext = useFormContext();

    // Outside a FormProvider, behave as a plain Input.
    if (!formContext) {
      return <Input ref={ref} error={customError} {...inputProps} />;
    }

    // React Hook Form's field bindings are applied last so caller props cannot
    // replace them; caller handlers and refs are composed instead. fieldState
    // resolves nested names such as "address.street".
    return (
      <Controller
        name={name}
        control={formContext.control}
        render={({ field, fieldState }) => (
          <Input
            {...inputProps}
            name={field.name}
            value={field.value ?? ''}
            disabled={field.disabled ?? inputProps.disabled}
            ref={mergeRefs(field.ref, ref)}
            onChange={(event) => {
              inputProps.onChange?.(event);
              field.onChange(event);
            }}
            onBlur={(event) => {
              inputProps.onBlur?.(event);
              field.onBlur();
            }}
            error={customError || fieldState.error?.message}
          />
        )}
      />
    );
  },
);

FormInput.displayName = 'FormInput';
