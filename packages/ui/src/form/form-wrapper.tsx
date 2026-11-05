'use client';

import type {
  DefaultValues,
  UseFormProps,
  UseFormReturn,
} from 'react-hook-form';
import { FormProvider, useForm } from 'react-hook-form';
import type { ReactElement } from 'react';
import type { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

type GenericOnSubmit = (
  data: Record<string, unknown>,
  event?: React.BaseSyntheticEvent,
) => void;

/**
 * @example:
 * const form = useCustomForm<LoginFormType>({
 *   defaultValues: {
 *     email: '',
 *     password: '',
 *   },
 *   schema: loginFormSchema,
 * });
 */
export const useCustomForm = <TFormData extends Record<string, unknown>>({
  schema,
  mode = 'onChange',
  reValidateMode = 'onChange',
  ...formOptions
}: {
  defaultValues?: DefaultValues<TFormData>;
  schema: z.ZodType<TFormData>;
} & UseFormProps<TFormData>): UseFormReturn<TFormData> => {
  return useForm<TFormData>({
    ...formOptions,
    resolver: zodResolver(schema),
    mode,
    reValidateMode,
  });
};

type FormWrapperProps<TFormData extends Record<string, unknown>> = {
  formInstance: UseFormReturn<TFormData>;
  onSubmit: (data: TFormData) => void;
  children: React.ReactNode;
  className?: string;
};

export function FormWrapper<TFormData extends Record<string, unknown>>({
  formInstance,
  onSubmit,
  children,
  className,
}: FormWrapperProps<TFormData>): ReactElement {
  const methods = formInstance;

  return (
    <FormProvider {...methods}>
      {/* noValidate: the Zod schema validates, and fields still expose
          required to assistive technology. */}
      <form
        noValidate
        className={className}
        onSubmit={methods.handleSubmit(onSubmit as GenericOnSubmit)}
      >
        {children}
      </form>
    </FormProvider>
  );
}
