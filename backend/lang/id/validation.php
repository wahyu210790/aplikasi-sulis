<?php

// Indonesian validation messages. Keys not listed here fall back to lang/en.
// Use only plain text (no HTML). Placeholders (:attribute, :min, ...) must be kept.

return [
    'accepted' => ':Attribute harus disetujui.',
    'after_or_equal' => ':Attribute harus tanggal yang sama atau setelah :date.',
    'array' => ':Attribute harus berupa daftar.',
    'before_or_equal' => ':Attribute harus tanggal yang sama atau sebelum :date.',
    'between' => [
        'array' => ':Attribute harus berisi antara :min sampai :max item.',
        'file' => 'Ukuran :attribute harus antara :min sampai :max kilobyte.',
        'numeric' => ':Attribute harus antara :min sampai :max.',
        'string' => ':Attribute harus antara :min sampai :max karakter.',
    ],
    'boolean' => ':Attribute harus bernilai ya atau tidak.',
    'confirmed' => 'Konfirmasi :attribute tidak cocok.',
    'current_password' => 'Password saat ini salah.',
    'date' => ':Attribute bukan tanggal yang valid.',
    'date_format' => ':Attribute harus berformat :format.',
    'decimal' => ':Attribute harus memiliki :decimal angka desimal.',
    'different' => ':Attribute dan :other harus berbeda.',
    'digits_between' => ':Attribute harus terdiri dari :min sampai :max angka.',
    'distinct' => ':Attribute tidak boleh duplikat.',
    'email' => ':Attribute harus berupa alamat email yang valid.',
    'enum' => ':Attribute yang dipilih tidak valid.',
    'exists' => ':Attribute yang dipilih tidak ditemukan.',
    'file' => ':Attribute harus berupa file.',
    'gt' => [
        'numeric' => ':Attribute harus lebih besar dari :value.',
    ],
    'gte' => [
        'numeric' => ':Attribute harus lebih besar dari atau sama dengan :value.',
    ],
    'in' => ':Attribute yang dipilih tidak valid.',
    'integer' => ':Attribute harus berupa bilangan bulat.',
    'lowercase' => ':Attribute harus huruf kecil.',
    'max' => [
        'array' => ':Attribute maksimal berisi :max item.',
        'file' => 'Ukuran :attribute maksimal :max kilobyte.',
        'numeric' => ':Attribute maksimal :max.',
        'string' => ':Attribute maksimal :max karakter.',
    ],
    'mimes' => ':Attribute harus berupa file bertipe: :values.',
    'min' => [
        'array' => ':Attribute minimal berisi :min item.',
        'file' => 'Ukuran :attribute minimal :min kilobyte.',
        'numeric' => ':Attribute minimal :min.',
        'string' => ':Attribute minimal :min karakter.',
    ],
    'numeric' => ':Attribute harus berupa angka.',
    'password' => [
        'letters' => ':Attribute harus mengandung minimal satu huruf.',
        'mixed' => ':Attribute harus mengandung minimal satu huruf besar dan satu huruf kecil.',
        'numbers' => ':Attribute harus mengandung minimal satu angka.',
        'symbols' => ':Attribute harus mengandung minimal satu simbol.',
        'uncompromised' => ':Attribute ini pernah bocor di internet. Gunakan password lain.',
    ],
    'present' => ':Attribute wajib ada.',
    'regex' => 'Format :attribute tidak valid.',
    'required' => ':Attribute wajib diisi.',
    'required_if' => ':Attribute wajib diisi bila :other adalah :value.',
    'required_with' => ':Attribute wajib diisi bila :values diisi.',
    'same' => ':Attribute dan :other harus sama.',
    'string' => ':Attribute harus berupa teks.',
    'unique' => ':Attribute sudah digunakan.',

    'custom' => [],

    // Indonesian names for request fields. Later tasks ADD entries here (never remove).
    'attributes' => [
        'name' => 'nama',
        'email' => 'email',
        'password' => 'password',
        'password_confirmation' => 'konfirmasi password',
        'current_password' => 'password saat ini',
        'role' => 'peran',
        'is_active' => 'status aktif',
        'search' => 'kata pencarian',
        'per_page' => 'jumlah per halaman',
        'page' => 'halaman',
        'sort' => 'urutan',
        'direction' => 'arah urutan',
        'notes' => 'catatan',
        'reason' => 'alasan',
    ],
];
