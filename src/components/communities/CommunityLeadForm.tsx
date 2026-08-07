import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const schema = z.object({
  firstName: z.string().trim().min(1, "Please enter your first name").max(80, "First name is too long"),
  email: z.string().trim().min(1, "Please enter your email").email("Enter a valid email address").max(255),
  phone: z
    .string()
    .trim()
    .min(7, "Please enter a phone number we can reach you at")
    .max(30, "Phone number is too long"),
  moveDate: z.string().trim().min(1, "Please tell me roughly when you're moving").max(60),
});

type FormValues = z.infer<typeof schema>;

interface CommunityLeadFormProps {
  /** Tracked in the admin leads inbox, e.g. 'redbird-school-zones'. */
  source: string;
  /** Customizes the heading and submit button copy per page. */
  offerLabel?: string;
  heading?: string;
  className?: string;
}

const PRE_VISIT_WARNING =
  "One thing that matters more than the guide: if you're planning to visit the model home, talk to me first. Builders register the first buyer who walks in unaccompanied, and once you're registered on your own you've given up your representation and your leverage for that community. It costs you nothing to have someone in your corner. It costs real money not to.";

const fieldBase =
  "w-full min-h-[44px] px-3.5 py-2.5 font-body text-[15px] bg-background text-foreground border border-border rounded-md transition-colors placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring";

export default function CommunityLeadForm({
  source,
  offerLabel = "Send me the guide",
  heading,
  className,
}: CommunityLeadFormProps) {
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { firstName: "", email: "", phone: "", moveDate: "" },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      const { error } = await supabase.functions.invoke("sync-lead", {
        body: {
          name: values.firstName,
          email: values.email,
          phone: values.phone,
          intent: `Timeframe: ${values.moveDate}`,
          message: `${offerLabel} request from ${source}. Target move date: ${values.moveDate}.`,
          form_type: "contact",
          source,
        },
      });
      if (error) throw error;
      setSubmitted(true);
      toast.success("Got it — I'll be in touch shortly.");
    } catch (err) {
      console.error("Community lead submit failed:", err);
      toast.error("Something went wrong sending that. Please call or text (210) 912-0806.");
    }
  };

  return (
    <section className={`bg-warm border border-border rounded-lg p-5 sm:p-7 ${className ?? ""}`}>
      {submitted ? (
        <div role="status" aria-live="polite" className="text-center py-4">
          <h3 className="font-display text-2xl mb-2 text-foreground">You're all set.</h3>
          <p className="font-body text-[15px] leading-relaxed text-muted-foreground max-w-[46ch] mx-auto">
            I'll send it over shortly. If you need it faster, call or text me at{" "}
            <a href="tel:2109120806" className="underline hover:text-gold-light transition-colors">
              (210) 912-0806
            </a>
            .
          </p>
        </div>
      ) : (
        <>
          <h3 className="font-display text-2xl sm:text-[28px] mb-1.5 text-foreground">
            {heading ?? offerLabel}
          </h3>
          <p className="font-body text-[14px] text-muted-foreground mb-5">
            Four quick details and I'll get it to you. No spam, no drip campaign.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-1">
              <label htmlFor="cl-firstName" className="block font-body text-[11px] tracking-[1.5px] uppercase text-gold mb-1.5">
                First name
              </label>
              <input
                id="cl-firstName"
                type="text"
                autoComplete="given-name"
                className={fieldBase}
                aria-invalid={!!errors.firstName}
                aria-describedby={errors.firstName ? "cl-firstName-error" : undefined}
                {...register("firstName")}
              />
              {errors.firstName && (
                <p id="cl-firstName-error" role="alert" className="mt-1.5 font-body text-[13px] text-destructive">
                  {errors.firstName.message}
                </p>
              )}
            </div>

            <div className="sm:col-span-1">
              <label htmlFor="cl-email" className="block font-body text-[11px] tracking-[1.5px] uppercase text-gold mb-1.5">
                Email
              </label>
              <input
                id="cl-email"
                type="email"
                autoComplete="email"
                className={fieldBase}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "cl-email-error" : undefined}
                {...register("email")}
              />
              {errors.email && (
                <p id="cl-email-error" role="alert" className="mt-1.5 font-body text-[13px] text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="sm:col-span-1">
              <label htmlFor="cl-phone" className="block font-body text-[11px] tracking-[1.5px] uppercase text-gold mb-1.5">
                Phone
              </label>
              <input
                id="cl-phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                className={fieldBase}
                aria-invalid={!!errors.phone}
                aria-describedby={errors.phone ? "cl-phone-error" : undefined}
                {...register("phone")}
              />
              {errors.phone && (
                <p id="cl-phone-error" role="alert" className="mt-1.5 font-body text-[13px] text-destructive">
                  {errors.phone.message}
                </p>
              )}
            </div>

            <div className="sm:col-span-1">
              <label htmlFor="cl-moveDate" className="block font-body text-[11px] tracking-[1.5px] uppercase text-gold mb-1.5">
                Target move date
              </label>
              <input
                id="cl-moveDate"
                type="text"
                placeholder="e.g. March 2027, or ASAP"
                className={fieldBase}
                aria-invalid={!!errors.moveDate}
                aria-describedby={errors.moveDate ? "cl-moveDate-error" : undefined}
                {...register("moveDate")}
              />
              {errors.moveDate && (
                <p id="cl-moveDate-error" role="alert" className="mt-1.5 font-body text-[13px] text-destructive">
                  {errors.moveDate.message}
                </p>
              )}
            </div>

            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-er-primary w-full sm:w-auto min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Sending…" : offerLabel}
              </button>
            </div>
          </form>
        </>
      )}

      <p className="mt-6 pt-5 border-t border-border font-body text-[14px] leading-[1.8] text-foreground">
        {PRE_VISIT_WARNING}
      </p>
    </section>
  );
}
