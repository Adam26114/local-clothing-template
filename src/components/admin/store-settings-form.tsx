'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import type { StoreSettings } from '@/lib/types';

export function StoreSettingsForm({ initialSettings }: { initialSettings: StoreSettings }) {
  const [form, setForm] = useState(initialSettings);

  return (
    <form className="space-y-6 rounded border bg-white p-6">
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Hero Banner</h2>
        <div className="space-y-2">
          <Label>Hero Title</Label>
          <Input
            value={form.heroTitle ?? ''}
            onChange={(event) => setForm((prev) => ({ ...prev, heroTitle: event.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label>Hero Subtitle</Label>
          <Textarea
            rows={3}
            value={form.heroSubtitle ?? ''}
            onChange={(event) => setForm((prev) => ({ ...prev, heroSubtitle: event.target.value }))}
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Sale Banner</h2>
        <label className="flex items-center gap-2 text-sm">
          <Switch
            checked={Boolean(form.saleBannerEnabled)}
            onCheckedChange={(checked) =>
              setForm((prev) => ({
                ...prev,
                saleBannerEnabled: checked,
              }))
            }
          />
          Enable sale banner
        </label>
        <Input
          value={form.saleBannerText ?? ''}
          onChange={(event) => setForm((prev) => ({ ...prev, saleBannerText: event.target.value }))}
        />
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Contact Email</Label>
          <Input
            value={form.contactEmail ?? ''}
            onChange={(event) => setForm((prev) => ({ ...prev, contactEmail: event.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label>Contact Phone</Label>
          <Input
            value={form.contactPhone ?? ''}
            onChange={(event) => setForm((prev) => ({ ...prev, contactPhone: event.target.value }))}
          />
        </div>
      </section>

      <section className="space-y-2">
        <Label>Pickup Address</Label>
        <Textarea
          rows={2}
          value={form.pickupAddress ?? ''}
          onChange={(event) => setForm((prev) => ({ ...prev, pickupAddress: event.target.value }))}
        />
      </section>

      <section className="space-y-2">
        <Label>Pickup Hours</Label>
        <Input
          value={form.pickupHours ?? ''}
          onChange={(event) => setForm((prev) => ({ ...prev, pickupHours: event.target.value }))}
        />
      </section>

      <Button type="button" className="bg-black text-white hover:bg-zinc-800">
        Save Storefront Controls
      </Button>
    </form>
  );
}
