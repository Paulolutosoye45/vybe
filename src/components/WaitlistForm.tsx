"use client";

import { useState, FormEvent } from "react";
import { motion } from "framer-motion";

const STATES = [
  "Lagos", "Abuja (FCT)", "Rivers", "Oyo", "Kano", "Enugu", "Delta", "Kaduna",
  "Ogun", "Anambra", "Cross River", "Edo", "Outside Nigeria (Diaspora)", "Other",
];

export default function WaitlistForm({
  referredByCode,
  onSuccess,
}: {
  referredByCode: string | null;
  onSuccess: (playerId: string, queuePosition: number, referralCode: string) => void;
}) {
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", state: "", consentMarketing: false });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [serverError, setServerError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrors({});
    setServerError(null);

    const newErrors: Record<string, string> = {};
    if (!form.firstName.trim()) newErrors.firstName = "First name is required.";
    if (!form.lastName.trim()) newErrors.lastName = "Last name is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = "Enter a valid email address.";
    if (form.phone.replace(/\D/g, "").length < 10) newErrors.phone = "Enter a valid phone number.";
    if (!form.state) newErrors.state = "Select your state.";
    if (Object.keys(newErrors).length) { setErrors(newErrors); return; }

    setStatus("submitting");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, referredByCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setServerError(data.error || "Something went wrong.");
        if (data.field) setErrors({ [data.field]: data.error });
        return;
      }
      onSuccess(data.playerId, data.queuePosition, data.referralCode);
    } catch {
      setStatus("error");
      setServerError("Network error — please try again.");
    }
  }

  const field = (name: keyof typeof form, label: string, type = "text") => (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-medium text-inkdim">{label}</label>
      <input
        type={type}
        value={form[name] as string}
        onChange={(e) => setForm((f) => ({ ...f, [name]: e.target.value }))}
        className={`glass rounded-lg px-4 py-3.5 text-sm outline-none transition-colors focus:border-brand-cyan/60 ${errors[name] ? "!border-brand-red" : ""}`}
      />
      <span className="text-brand-red text-xs min-h-[1em]">{errors[name]}</span>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {field("firstName", "First name")}
        {field("lastName", "Last name")}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {field("email", "Email", "email")}
        {field("phone", "Phone number", "tel")}
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium text-inkdim">State</label>
        <select
          value={form.state}
          onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
          className={`glass rounded-lg px-4 py-3.5 text-sm outline-none transition-colors focus:border-brand-cyan/60 ${errors.state ? "!border-brand-red" : ""}`}
        >
          <option value="" className="bg-night">Select your state</option>
          {STATES.map((s) => <option key={s} className="bg-night">{s}</option>)}
        </select>
        <span className="text-brand-red text-xs min-h-[1em]">{errors.state}</span>
      </div>

      <div className="flex gap-3.5 items-start glass rounded-xl p-4">
        <input
          type="checkbox"
          checked={form.consentMarketing}
          onChange={(e) => setForm((f) => ({ ...f, consentMarketing: e.target.checked }))}
          className="mt-1 w-4 h-4 accent-brand-cyan shrink-0"
        />
        <label className="text-sm text-inkdim leading-relaxed">
          Yes, send me marketing about Vybe Hub by email, SMS and WhatsApp. You can withdraw this at
          any time — leaving it unticked still holds your place on the list.
        </label>
      </div>

      <p className="text-xs text-inkdim leading-relaxed">
        By joining, you agree to the{" "}
        <span className="underline decoration-dashed underline-offset-2">Terms &amp; Conditions</span>{" "}
        {/* <span className="text-brand-orange text-[0.62rem] border border-dashed border-brand-orange/60 rounded px-1.5 py-0.5 ml-0.5">pending</span> */}
        {" "}and the{" "}
        <span className="underline decoration-dashed underline-offset-2">Data Privacy Notice</span>{" "}
        {/* <span className="text-brand-orange text-[0.62rem] border border-dashed border-brand-orange/60 rounded px-1.5 py-0.5 ml-0.5">pending</span>. */}
      </p>

      {serverError && <p className="text-brand-red text-sm">{serverError}</p>}

      <motion.button
        whileHover={{ y: -2, boxShadow: "0 16px 40px -12px rgba(47,184,224,0.5)" }}
        whileTap={{ scale: 0.98 }}
        type="submit"
        disabled={status === "submitting"}
        className="bg-brand-gradient w-full text-white font-semibold px-8 py-4 rounded-xl disabled:opacity-60 shadow-[0_10px_30px_-10px_rgba(60,100,200,0.6)]"
      >
        {status === "submitting" ? "Claiming your place…" : "Claim your place"}
      </motion.button>
    </form>
  );
}
