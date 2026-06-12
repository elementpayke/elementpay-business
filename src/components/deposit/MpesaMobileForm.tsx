"use client";

type MpesaMobileFormProps = {
  phoneNumber: string;
  onPhoneChange: (val: string) => void;
  /** Non-blocking validity warning for the phone, or null. */
  phoneWarning?: string | null;
  accountName: string;
  onAccountNameChange: (val: string) => void;
  /** Chosen provider name, used to personalise the phone label/hint. */
  providerName?: string;
};

export default function MpesaMobileForm({
  phoneNumber,
  onPhoneChange,
  phoneWarning,
  accountName,
  onAccountNameChange,
  providerName,
}: MpesaMobileFormProps) {
  const phoneLabel = providerName
    ? `Your ${providerName} number`
    : "Mobile money phone number";

  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1.5 block text-xs font-medium text-[#4D556D]">
          {phoneLabel}
        </label>
        <input
          type="tel"
          inputMode="tel"
          placeholder="+254711111111"
          value={phoneNumber}
          onChange={(e) => onPhoneChange(e.target.value.replace(/[^\d+]/g, "").slice(0, 16))}
          className={`h-11 w-full rounded-lg border bg-[#FAFBFE] px-3.5 text-sm text-[#1F2640] outline-none transition focus:bg-white ${
            phoneWarning
              ? "border-[#E7A23D] focus:border-[#E7A23D]"
              : "border-[#ECEEF4] focus:border-primary-300"
          }`}
        />
        {phoneWarning ? (
          <p className="mt-1 text-[11px] text-[#B7791F]">
            {phoneWarning} You can still continue, but double-check the number.
          </p>
        ) : (
          <p className="mt-1 text-[11px] text-[#8E93A7]">
            The number you&apos;ll pay from. Use the international format starting with +.
          </p>
        )}
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-[#4D556D]">
          Account name
        </label>
        <input
          type="text"
          autoComplete="name"
          placeholder="Name registered with the mobile money account"
          value={accountName}
          onChange={(e) => onAccountNameChange(e.target.value)}
          className="h-11 w-full rounded-lg border border-[#ECEEF4] bg-[#FAFBFE] px-3.5 text-sm text-[#1F2640] outline-none transition focus:border-primary-300 focus:bg-white"
        />
      </div>
    </div>
  );
}
