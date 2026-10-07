"use client";

import { useId, useState } from "react";
import { Button } from "@/ui/primitives/button";
import { Checkbox } from "@/ui/primitives/checkbox";
import { Input } from "@/ui/primitives/input";
import { Label } from "@/ui/primitives/label";

export function LeadForm({
  actionUrl,
  consentHref,
  thanksUrl,
  nameLabel,
  phoneLabel,
  consentLabel,
  consentLinkLabel,
  submitLabel,
  sendingLabel,
  requiredMessage,
  retryMessage,
  transportDisabledMessage,
  pageKey,
}: {
  actionUrl: string;
  consentHref: string;
  thanksUrl: string;
  nameLabel: string;
  phoneLabel: string;
  consentLabel: string;
  consentLinkLabel: string;
  submitLabel: string;
  sendingLabel: string;
  requiredMessage: string;
  retryMessage: string;
  transportDisabledMessage: string;
  pageKey: string;
}) {
  const formId = useId();
  const errorId = `${formId}-error`;
  const [error, setError] = useState<
    "required" | "transport" | "retry" | null
  >(null);
  const [consent, setConsent] = useState(false);
  const [invalid, setInvalid] = useState({
    name: false,
    phone: false,
    consent: false,
  });
  const [sending, setSending] = useState(false);
  const errorMessage =
    error === "required"
      ? requiredMessage
      : error === "transport"
        ? transportDisabledMessage
        : error === "retry"
          ? retryMessage
          : undefined;
  return (
    <form
      aria-busy={sending}
      aria-describedby={errorMessage ? errorId : undefined}
      className="flex max-w-xl flex-col gap-md border border-border bg-surface p-md"
      noValidate
      onSubmit={async (event) => {
        event.preventDefault();
        if (sending) {
          return;
        }
        const form = event.currentTarget;
        const data = new FormData(form);
        const name = String(data.get("name") ?? "").trim();
        const phone = String(data.get("phone") ?? "").trim();
        const nextInvalid = {
          name: name.length === 0,
          phone: phone.length === 0,
          consent: !consent,
        };
        setInvalid(nextInvalid);
        if (nextInvalid.name || nextInvalid.phone || nextInvalid.consent) {
          setError("required");
          return;
        }
        setError(null);
        setSending(true);
        try {
          const response = await fetch(actionUrl, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              name,
              phone,
              consent,
              website: String(data.get("website") ?? ""),
              pageKey,
            }),
          });
          if (response.status === 503) {
            const payload = (await response.json().catch(() => null)) as {
              code?: string;
            } | null;
            if (payload?.code === "lead_transport_disabled") {
              setError("transport");
              return;
            }
          }
          if (!response.ok) {
            setError("retry");
            return;
          }
          window.location.assign(thanksUrl);
        } catch {
          setError("retry");
        } finally {
          setSending(false);
        }
      }}
    >
      <Label
        className="flex flex-col gap-sm text-fg"
        htmlFor={`${formId}-name`}
      >
        {nameLabel}
        <Input
          aria-invalid={invalid.name}
          autoComplete="name"
          id={`${formId}-name`}
          name="name"
          required
          type="text"
        />
      </Label>
      <Label
        className="flex flex-col gap-sm text-fg"
        htmlFor={`${formId}-phone`}
      >
        {phoneLabel}
        <Input
          aria-invalid={invalid.phone}
          autoComplete="tel"
          id={`${formId}-phone`}
          inputMode="tel"
          name="phone"
          required
          type="tel"
        />
      </Label>
      <Input
        aria-hidden="true"
        autoComplete="off"
        className="absolute -left-[9999px] h-px w-px overflow-hidden"
        name="website"
        tabIndex={-1}
      />
      <Label
        className="flex items-center gap-sm text-muted"
        htmlFor={`${formId}-consent`}
      >
        <Checkbox
          aria-invalid={invalid.consent}
          checked={consent}
          id={`${formId}-consent`}
          onCheckedChange={(value) => setConsent(value === true)}
          required
        />
        <span>
          {consentLabel}{" "}
          <a className="text-fg underline" href={consentHref}>
            {consentLinkLabel}
          </a>
        </span>
      </Label>
      {errorMessage ? (
        <p className="text-muted" id={errorId} role="alert">
          {errorMessage}
        </p>
      ) : null}
      <Button disabled={sending} type="submit">
        {sending ? sendingLabel : submitLabel}
      </Button>
    </form>
  );
}
