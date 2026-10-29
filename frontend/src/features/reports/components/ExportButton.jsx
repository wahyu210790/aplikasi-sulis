import { useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '../../../components/ui/Button.jsx';
import { useToast } from '../../../components/ui/useToast.js';
import { saveBlob } from '../../../lib/download.js';
import { downloadReport } from '../api.js';

// Today in WIB as YYYY-MM-DD, for the file name (the server uses the same date).
function today() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date());
}

// "Unduh Excel" for one report (docs/desain-v2.md T6.01). report: 'project-profit', 'stock-value' or 'movements'.
// params: the filters shown on screen (page and per_page are not sent: the file has every matching row).
export function ExportButton({ report, params, fileName }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  async function handleClick() {
    setBusy(true);
    try {
      saveBlob(await downloadReport(report, params), `${fileName}-${today()}.xlsx`);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button variant="secondary" leftIcon={Download} loading={busy} onClick={handleClick} className="w-full sm:ml-auto sm:w-auto">
      Unduh Excel
    </Button>
  );
}
