'use client';

import { useFormStatus } from 'react-dom';

type FormSubmitButtonProps = {
  idleText: string;
  pendingText: string;
  className?: string;
};

export function FormSubmitButton({ idleText, pendingText, className }: FormSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? pendingText : idleText}
    </button>
  );
}