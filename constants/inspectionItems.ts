export interface InspectionItemDefinition {
  key: string;
  label: string;
  category?: string;
  children?: InspectionItemDefinition[];
}

export const inspectionCategories: Record<string, InspectionItemDefinition[]> = {
  'Kondisi Ban': [
    { key: 'ban_no_1', label: 'Ban No.1' },
    { key: 'ban_no_2', label: 'Ban No.2' },
    { key: 'ban_no_3', label: 'Ban No.3' },
    { key: 'ban_no_4', label: 'Ban No.4' },
    { key: 'ban_no_5', label: 'Ban No.5' },
    { key: 'ban_no_6', label: 'Ban No.6' },
    { key: 'ban_serep', label: 'Ban Serep' },
  ],
  'Lampu': [
    { key: 'lampu_rem', label: 'Rem' },
    { key: 'lampu_kota', label: 'Kota/Malam' },
    { key: 'lampu_sen_kiri', label: 'Sen Kiri' },
    { key: 'lampu_sen_kanan', label: 'Sen Kanan' },
    { key: 'lampu_plug', label: 'Plug Elektrik' },
    { key: 'lampu_head', label: 'Head Lamp' },
  ],
  'Wiper': [
    { key: 'wiper_kiri', label: 'Kiri' },
    { key: 'wiper_kanan', label: 'Kanan' },
  ],
  'Sistem Pengereman': [
    { key: 'rem_chamber', label: 'Chamber' },
    { key: 'rem_coupler', label: 'Coupler' },
    { key: 'rem_valve', label: 'Relay Valve Angin/Kura-kura' },
    { key: 'rem_kampas', label: 'Kampas Rem' },
    { key: 'rem_head_chasis', label: 'Rem Head & Chasis' },
  ],
  'Per Head': [
    { key: 'per_head_l1', label: 'L1' },
    { key: 'per_head_r1', label: 'R1' },
    { key: 'per_head_l2', label: 'L2' },
    { key: 'per_head_r2', label: 'R2' },
  ],
  'U Bolt-Tusukan Per': [
    { key: 'ubolt_l1', label: 'L1' },
    { key: 'ubolt_r1', label: 'R1' },
    { key: 'ubolt_l2', label: 'L2' },
    { key: 'ubolt_r2', label: 'R2' },
  ],
  'Hubbolt Roda': [
    { key: 'hubolt_l1', label: 'L1' },
    { key: 'hubolt_r1', label: 'R1' },
    { key: 'hubolt_l2', label: 'L2' },
    { key: 'hubolt_r2', label: 'R2' },
  ],
  'Engine': [
    { key: 'engine_carter', label: 'Carter' },
    { key: 'engine_radiator', label: 'Radiator' },
    { key: 'engine_cylinder', label: 'Head Cylinder' },
    { key: 'engine_pump', label: 'Injector Pump' },
  ],
  'Surat Kendaraan': [
    { key: 'surat_stnk', label: 'STNK' },
    { key: 'surat_kir', label: 'KIR' },
    { key: 'surat_ijin_b3', label: 'Ijin Angkut B3' },
    { key: 'surat_sim', label: 'SIM' },
  ],
  'Tools & APAR': [
    { key: 'tools_dongkrak', label: 'Dongkrak' },
    { key: 'tools_kunci_roda', label: 'Kunci Roda' },
    { key: 'tools_stang', label: 'Stang Kunci Roda' },
    { key: 'tools_pipa', label: 'Pipa Extension' },
    { key: 'tools_apar', label: 'APAR' },
  ],
};

export function flattenInspectionItems(categories: Record<string, InspectionItemDefinition[]>): Record<string, InspectionItemDefinition> {
  const flatMap: Record<string, InspectionItemDefinition> = {};
  for (const category in categories) {
    categories[category].forEach(item => {
      flatMap[item.key] = item;
    });
  }
  return flatMap;
}
export const inspectionItemDefinitions: InspectionItemDefinition[] = Object.entries(inspectionCategories).flatMap(
  ([category, items]) =>
    items.map((item) => ({
      ...item,
      category,
    }))
);