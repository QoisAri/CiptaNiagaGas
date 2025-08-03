// File ini akan menjadi "database" tiruan kita

export const masterCasisData = [
  {
    // Data untuk Casis ID 1
    summary: { 
      id: 1, storageNo: '115', tanggal: '21-07-2025', pemeriksa: 'Budi Santoso', pengecek: 'Andi Wijaya', type: 20 
    },
    checkSheet: [
      { no: 1, bagian: 'KONDISI BAN', subItems: [
          { standar: 'Semua Ban berulir...', kondisi: 'Baik', keterangan: 'Ban No.1'},
          { standar: '', kondisi: 'Baik', keterangan: 'Ban No.2'},
          { standar: '', kondisi: 'Baik', keterangan: 'Ban No.3'},
          { standar: '', kondisi: 'Baik', keterangan: 'Ban No.4'},
          { standar: '', kondisi: 'Baik', keterangan: 'Ban No.5'},
          { standar: '', kondisi: 'Baik', keterangan: 'Ban No.6'},
          { standar: '', kondisi: 'Baik', keterangan: 'Ban No.7'},
          // Perhatikan data ini, kondisinya 'Tidak'
          { standar: '', kondisi: 'Tidak', keterangan: 'Ban Setip TLG 0/2'}, 
      ], rowspan: 8},
      { no: 2, bagian: 'LAMPU', subItems: [
          { standar: 'Hidup', kondisi: 'Baik', keterangan: ''},
      ], rowspan: 1},
      // ...data check sheet lainnya untuk Casis ID 1...
    ]
  },
  {
    // Data untuk Casis ID 2
    summary: { 
      id: 2, storageNo: '116', tanggal: '22-07-2025', pemeriksa: 'Siti Aminah', pengecek: 'Rudi Hartono', type: 40 
    },
    checkSheet: [
      { no: 1, bagian: 'KONDISI BAN', subItems: [
          { standar: 'Semua Ban berulir...', kondisi: 'Baik', keterangan: 'Ban No.1'},
          { standar: '', kondisi: 'Baik', keterangan: 'Ban No.2'},
      ], rowspan: 2},
      { no: 2, bagian: 'LAMPU', subItems: [
          { standar: 'Hidup', kondisi: 'Baik', keterangan: ''},
      ], rowspan: 1},
       // Semua data di sini kondisinya 'Baik', jadi tidak akan ada error
    ]
  },
  // ... data casis lainnya ...
];