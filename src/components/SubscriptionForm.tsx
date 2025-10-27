
'use client';

import { useActionState, useEffect, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { subscribe, type SubscribeState } from '@/app/actions/subscribe';
import { Mail, Send, Loader2 } from 'lucide-react';

function SubmitButton({ buttonText }: { buttonText: string }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          <span className="hidden sm:inline">{buttonText}</span>
          <Send className="h-4 w-4 sm:hidden" />
        </>
      )}
    </Button>
  );
}

type SubscriptionFormProps = {
    title?: string;
    description?: string;
    buttonText?: string;
    onSuccess?: () => void;
}

export function SubscriptionForm({
    title = 'Subscribe to our Newsletter',
    description = 'Get the latest news and updates delivered to your inbox.',
    buttonText = 'Subscribe',
    onSuccess
}: SubscriptionFormProps) {
  const initialState: SubscribeState = {};
  const [state, formAction] = useActionState(subscribe, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.isSuccess) {
      formRef.current?.reset();
      if(onSuccess) {
        onSuccess();
      }
    }
  }, [state, onSuccess]);

  return (
    <div className="grid gap-2">
      <h3 className="font-bold text-lg">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
      <form ref={formRef} action={formAction} className="flex w-full items-center space-x-2 mt-2">
        <div className="relative flex-1">
          <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="email"
            name="email"
            placeholder="Enter your email"
            required
            className="pl-8"
          />
        </div>
        <SubmitButton buttonText={buttonText} />
      </form>
      {state?.message && (
        <p className={`text-sm ${state?.isSuccess ? 'text-green-600' : 'text-destructive'}`}>
          {state.message}
        </p>
      )}
       {state?.errors?.email && (
        <p className="text-sm text-destructive">{state.errors.email[0]}</p>
       )}
    </div>
  );
}
