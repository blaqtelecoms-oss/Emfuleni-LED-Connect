import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useLedProfile } from "@/hooks/useLedProfile";
import { useLedList } from "@/hooks/useLedList";
import PageHeader from "@/components/PageHeader";
import { SectionLoading, SectionEmpty } from "@/components/SectionStates";
import { toast } from "@/components/ui/use-toast";
import { formatSAST } from "@/lib/ledUtils";
import { GraduationCap, Calendar, MapPin, Check } from "lucide-react";

export default function BusinessTraining() {
  const { user } = useAuth();
  const { business } = useLedProfile();
  const { data, loading, reload } = useLedList(() =>
    Promise.all([
      base44.entities.Workshop.list().catch(() => []),
      base44.entities.WorkshopBooking.filter({ business: business?.id }).catch(() => []),
    ]),
    [business?.id]
  );

  const [busy, setBusy] = useState(null);

  if (loading || !data) return <SectionLoading />;
  const [workshops, bookings] = data;
  const bookingMap = Object.fromEntries(bookings.map((b) => [b.workshop, b]));
  const upcoming = workshops
    .filter((w) => new Date(w.starts_at) > new Date())
    .sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at));

  const book = async (w) => {
    setBusy(w.id);
    try {
      await base44.entities.WorkshopBooking.create({ workshop: w.id, business: business.id, user: user.id });
      toast({ title: "Seat booked", description: `You're registered for ${w.title}.` });
      reload();
    } catch (e) {
      toast({ title: "Booking failed", description: e.message, variant: "destructive" });
    } finally {
      setBusy(null);
    }
  };

  const cancel = async (booking) => {
    setBusy(booking.id);
    try {
      await base44.entities.WorkshopBooking.delete(booking.id);
      toast({ title: "Booking cancelled" });
      reload();
    } catch (e) {
      toast({ title: "Cancel failed", description: e.message, variant: "destructive" });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div>
      <PageHeader title="Training" subtitle="Book seats at LED workshops and skills development sessions." />

      {upcoming.length === 0 ? (
        <SectionEmpty>No upcoming workshops. Check back soon.</SectionEmpty>
      ) : (
        <div className="space-y-2.5">
          {upcoming.map((w) => {
            const booking = bookingMap[w.id];
            return (
              <div key={w.id} className="led-box py-3 flex flex-wrap items-center gap-3">
                <GraduationCap className="w-5 h-5 text-brand flex-none" />
                <div className="min-w-0 flex-1">
                  <b className="text-sm text-ink block">{w.title}</b>
                  <span className="text-xs text-mute flex items-center gap-1"><Calendar className="w-3 h-3" /> {formatSAST(w.starts_at, { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                  {w.venue && <span className="text-xs text-mute flex items-center gap-1"><MapPin className="w-3 h-3" /> {w.venue}</span>}
                </div>
                {booking ? (
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#d9efe0] text-[#14532b]">Booked</span>
                    <button onClick={() => cancel(booking)} disabled={busy === booking.id} className="led-btn led-btn-r led-btn-s">Cancel</button>
                  </div>
                ) : (
                  <button onClick={() => book(w)} disabled={busy === w.id} className="led-btn led-btn-s flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5" /> Book seat
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}