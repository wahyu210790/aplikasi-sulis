import { PackageMinus, Undo2 } from 'lucide-react';

// Texts per stock document type (docs/desain-v2.md B5.2, B5.3, B12.4). Keys are the API `type` values.
export const DOC_TYPES = {
  project_out: {
    title: 'Barang Keluar',
    subtitle: 'Barang yang diambil dari gudang untuk proyek.',
    path: '/barang-keluar',
    icon: PackageMinus,
    createAction: 'stock.out',
    newLabel: 'Catat Barang Keluar',
    personLabel: 'Diambil oleh',
    printTitle: 'BUKTI BARANG KELUAR',
    emptyTitle: 'Belum ada barang keluar',
    // Signature boxes on the printout; person: true = the box is for the person named on the document.
    signatures: [
      { label: 'Diserahkan oleh (Gudang)', person: false },
      { label: 'Diterima oleh', person: true },
    ],
  },
  project_return: {
    title: 'Pengembalian',
    subtitle: 'Barang sisa proyek yang dikembalikan ke gudang.',
    path: '/pengembalian',
    icon: Undo2,
    createAction: 'stock.return',
    newLabel: 'Catat Pengembalian',
    personLabel: 'Dikembalikan oleh',
    printTitle: 'BUKTI PENGEMBALIAN BARANG',
    emptyTitle: 'Belum ada pengembalian',
    signatures: [
      { label: 'Dikembalikan oleh', person: true },
      { label: 'Diterima oleh (Gudang)', person: false },
    ],
  },
};
