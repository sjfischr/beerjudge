'use client';

import type { MouseEvent } from 'react';

import { useFormStatus } from 'react-dom';

type ConfirmSubmitButtonProps = {
  idleText: string;
  pendingText: string;
  confirmMessage: string;
  className?: string;
};

export function ConfirmSubmitButton({
  idleText,
  pendingText,
  confirmMessage,
  className,
}: ConfirmSubmitButtonProps) {
  const { pending } = useFormStatus();

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    if (!window.confirm(confirmMessage)) {
      event.preventDefault();
    }
  }

  return (
    <button type="submit" disabled={pending} className={className} onClick={handleClick}>
      {pending ? pendingText : idleText}
    </button>
  );
}