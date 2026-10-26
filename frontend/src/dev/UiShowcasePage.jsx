import { useState } from 'react';
import { Plus, Save, Trash2, Pencil } from 'lucide-react';
import { Button } from '../components/ui/Button.jsx';
import { IconButton } from '../components/ui/IconButton.jsx';
import { Input } from '../components/ui/Input.jsx';
import { Textarea } from '../components/ui/Textarea.jsx';
import { DateInput } from '../components/ui/DateInput.jsx';
import { NumberInput } from '../components/ui/NumberInput.jsx';
import { MoneyInput } from '../components/ui/MoneyInput.jsx';
import { Select } from '../components/ui/Select.jsx';
import { FormField } from '../components/ui/FormField.jsx';
import { Checkbox } from '../components/ui/Checkbox.jsx';
import { Switch } from '../components/ui/Switch.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { StatusBadge } from '../components/ui/StatusBadge.jsx';
import { Card } from '../components/ui/Card.jsx';
import { Money } from '../components/ui/Money.jsx';
import { Qty } from '../components/ui/Qty.jsx';
import { ROLE_OPTIONS } from '../lib/constants.js';
import UiShowcasePart2 from './UiShowcasePart2.jsx';

// DEV ONLY page (route /_ui exists only in `npm run dev`). Shows every UI component for visual review.
export default function UiShowcasePage() {
  const [name, setName] = useState('');
  const [qty, setQty] = useState('12,5');
  const [price, setPrice] = useState(1322500);
  const [role, setRole] = useState('gudang');
  const [date, setDate] = useState('2026-10-26');
  const [checked, setChecked] = useState(true);
  const [active, setActive] = useState(true);

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6">
      <h1 className="text-2xl font-semibold text-ink">Komponen UI</h1>

      <Card title="Tombol" description="Button dan IconButton">
        <div className="flex flex-wrap items-center gap-3">
          <Button leftIcon={Plus}>Tambah Barang</Button>
          <Button variant="secondary">Batal</Button>
          <Button variant="ghost">Lihat semua</Button>
          <Button variant="danger" leftIcon={Trash2}>Hapus</Button>
          <Button loading>Menyimpan…</Button>
          <Button size="sm" leftIcon={Save}>Kecil</Button>
          <Button size="lg">Besar</Button>
          <Button disabled>Nonaktif</Button>
          <IconButton icon={Pencil} label="Ubah" />
          <IconButton icon={Trash2} label="Hapus" variant="danger" />
        </div>
      </Card>

      <Card title="Form" description="Input, NumberInput, MoneyInput, Select, DateInput, Textarea">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Nama" htmlFor="ui-name" required hint="Nama lengkap pengguna.">
            <Input id="ui-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Contoh: Budi Santoso" />
          </FormField>
          <FormField label="Email" htmlFor="ui-email" error="Email sudah dipakai.">
            <Input id="ui-email" type="email" invalid defaultValue="budi@sulis.test" />
          </FormField>
          <FormField label="Jumlah" htmlFor="ui-qty">
            <NumberInput id="ui-qty" value={qty} onChange={setQty} suffix="m" />
          </FormField>
          <FormField label="Harga satuan" htmlFor="ui-price">
            <MoneyInput id="ui-price" value={price} onChange={setPrice} />
          </FormField>
          <FormField label="Peran" htmlFor="ui-role">
            <Select id="ui-role" value={role} onChange={setRole} options={ROLE_OPTIONS} />
          </FormField>
          <FormField label="Tanggal" htmlFor="ui-date">
            <DateInput id="ui-date" value={date} onChange={setDate} />
          </FormField>
          <FormField label="Catatan" htmlFor="ui-note" className="sm:col-span-2">
            <Textarea id="ui-note" placeholder="Opsional" />
          </FormField>
          <div className="flex flex-wrap items-center gap-6 sm:col-span-2">
            <Checkbox id="ui-check" checked={checked} onChange={setChecked} label="Tampilkan yang nonaktif" />
            <Switch checked={active} onChange={setActive} label={active ? 'Aktif' : 'Nonaktif'} />
          </div>
        </div>
      </Card>

      <Card title="Badge dan angka">
        <div className="flex flex-wrap gap-2">
          <Badge>Netral</Badge>
          <Badge tone="primary">Primer</Badge>
          <Badge tone="success">Sukses</Badge>
          <Badge tone="warning">Peringatan</Badge>
          <Badge tone="danger">Bahaya</Badge>
          <Badge tone="info">Info</Badge>
          <StatusBadge kind="user" status="active" />
          <StatusBadge kind="user" status="inactive" />
          <StatusBadge kind="opname" status="menunggu_persetujuan" />
        </div>
        <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-3">
          <div><dt className="text-muted">Money</dt><dd><Money value={1322500} /></dd></div>
          <div><dt className="text-muted">Money negatif</dt><dd><Money value={-575000} /></dd></div>
          <div><dt className="text-muted">Qty</dt><dd><Qty value="12.500" unit="m" /></dd></div>
        </dl>
      </Card>
      <UiShowcasePart2 />
    </main>
  );
}
