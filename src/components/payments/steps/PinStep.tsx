"use client";

import {
  useEffect,
  useRef,
  useState,
  type ClipboardEvent,
  type KeyboardEvent,
} from "react";
import { Loader2 } from "lucide-react";
import { cardClassName } from "@/components/dashboard/DashboardPrimitives";
import { useSendPaymentStore } from "@/stores/sendPaymentStore";
import {
  createOffRampOrder,
  verifyTransactionPin,
} from "@/lib/payments/service";

const PIN_LENGTH = 4;
const MAX_ATTEMPTS = 5;

export default function PinStep() {
  const [digits, setDigits] = useState<string[]>(() => Array(PIN_LENGTH).fill(""));
  const [submitting, setSubmitting] = useState(false);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  const recipient = useSendPaymentStore((s) => s.recipient);
  const amount = useSendPaymentStore((s) => s.amount);
  const reference = useSendPaymentStore((s) => s.reference);
  const pinError = useSendPaymentStore((s) => s.pinError);
  const pinAttempts = useSendPaymentStore((s) => s.pinAttempts);
  const setPhase = useSendPaymentStore((s) => s.setPhase);
  const setPinError = useSendPaymentStore((s) => s.setPinError);
  const incrementPinAttempts = useSendPaymentStore((s) => s.incrementPinAttempts);
  const setPendingOrderId = useSendPaymentStore((s) => s.setPendingOrderId);
  const setError = useSendPaymentStore((s) => s.setError);

  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  const pin = digits.join("");
  const complete = pin.length === PIN_LENGTH && digits.every((d) => d !== "");
  const locked = pinAttempts >= MAX_ATTEMPTS;
  const disabled = !complete || submitting || locked;

  function clearPin() {
    setDigits(Array(PIN_LENGTH).fill(""));
    inputsRef.current[0]?.focus();
  }

  function handleChange(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    setPinError(null);
    setDigits((prev) => {
      const next = [...prev];
      next[index] = digit;
      return next;
    });
    if (digit && index < PIN_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace") {
      if (digits[index]) {
        setDigits((prev) => {
          const next = [...prev];
          next[index] = "";
          return next;
        });
      } else if (index > 0) {
        inputsRef.current[index - 1]?.focus();
      }
    } else if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      inputsRef.current[index - 1]?.focus();
    } else if (event.key === "ArrowRight" && index < PIN_LENGTH - 1) {
      event.preventDefault();
      inputsRef.current[index + 1]?.focus();
    }
  }

  function handlePaste(event: ClipboardEvent<HTMLInputElement>) {
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, PIN_LENGTH);
    if (!pasted) return;
    event.preventDefault();
    const next = Array(PIN_LENGTH).fill("");
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setDigits(next);
    const focusIndex = Math.min(pasted.length, PIN_LENGTH - 1);
    inputsRef.current[focusIndex]?.focus();
  }

  async function handleSubmit() {
    if (disabled || !recipient || !amount) return;
    setSubmitting(true);
    try {
      const verification = await verifyTransactionPin(pin);
      clearPin();
      if (!verification.ok) {
        incrementPinAttempts();
        setPinError(verification.message);
        setSubmitting(false);
        return;
      }

      const order = await createOffRampOrder({
        recipient,
        amount,
        reference: reference || undefined,
      });
      setPendingOrderId(order.orderId);
      setPhase("processing");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to confirm payment";
      setError({ code: "confirm_failed", message, retryable: true });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={cardClassName("space-y-6 p-6 sm:p-10")}>
      <div className="text-center">
        <h2 className="text-xl font-semibold text-[#171D32]">Enter Transaction PIN</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-[#7E8498]">
          Please enter your transaction PIN so we can confirm it&apos;s you and complete this
          transaction.
        </p>
      </div>

      <div
        className="flex justify-center gap-3"
        role="group"
        aria-label="Transaction PIN"
      >
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(el) => {
              inputsRef.current[index] = el;
            }}
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            type="password"
            autoComplete="one-time-code"
            aria-label={`PIN digit ${index + 1}`}
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            disabled={submitting || locked}
            className="h-14 w-14 rounded-xl border border-[#ECEEF4] bg-[#FAFBFE] text-center text-xl font-semibold text-[#1F2640] outline-none transition focus:border-primary-400 focus:bg-white"
          />
        ))}
      </div>

      {pinError ? (
        <p className="text-center text-xs font-medium text-[#E35D5B]">{pinError}</p>
      ) : null}
      {locked ? (
        <p className="text-center text-xs font-medium text-[#E35D5B]">
          Too many attempts. Please reset your transaction PIN to continue.
        </p>
      ) : null}

      <div className="text-center">
        <button
          type="button"
          onClick={() => {
            /* placeholder — wire to reset flow */
          }}
          className="text-sm font-semibold text-primary-600 transition hover:text-primary-700"
        >
          I have forgotten my transaction PIN
        </button>
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={disabled}
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary-500 text-sm font-semibold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-45"
      >
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Confirming...
          </>
        ) : (
          "Confirm payment"
        )}
      </button>
    </div>
  );
}
