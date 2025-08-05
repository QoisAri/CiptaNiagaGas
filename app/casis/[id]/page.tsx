// app/casis/[id]/page.tsx

import { notFound } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { CasisDetailClient } from './CasisDetailClient';
import { deleteInspection } from '@/app/casis/actions';

export const dynamic = 'force-dynamic';

// Mendefinisikan tipe props dengan nama unik untuk menghindari konflik
type CasisPageProps = {
  params: { id: string };
};

// Tipe data lain yang dibutuhkan oleh komponen
type Row = {
  id: string;
  name: string;
  standard: string | null;
  resultId: string | null;
  kondisi: string;
  keterangan: string | null;
  problem_photo_url: string | null;
};
type SubGroup = { parentName: string; rows: Row[] };
type Group = Record<string, SubGroup[]>;
type InspectionItem = {
  id: string;
  name: string;
  standard: string | null;
  parent_id: string | null;
  page_title: string | null;
};
type ItemWithResult = InspectionItem & {
  resultId: string | null;
  kondisi: string;
  keterangan: string | null;
  problem_photo_url: string | null;
};
type ParentItem = { id: string; name: string };
type InspectionHeaderWithRelations = {
  id: string;
  tanggal: string;
  catatan: string | null;
  created_at: string;
  inspector_id: string;
  head_id: string | null;
  chassis_id: number | null;
  storage_id: number | null;
  chassis: { chassis_code: string; feet: number } | null;
  profiles: { name: string } | null;
};

// Menggunakan tipe CasisPageProps yang sudah didefinisikan
export default async function CasisDetailPage({ params }: CasisPageProps) {
  const inspectionId = params.id;
  const supabase = await createClient();

  const { data, error: headerError } = await supabase
    .from('inspections')
    .select(
      `*, chassis!inspections_chassis_id_fkey(chassis_code, feet), profiles!fk_inspector(name)`
    )
    .eq('id', inspectionId)
    .single();

  const inspectionHeader: InspectionHeaderWithRelations | null = data;

  if (headerError || !inspectionHeader || !inspectionHeader.chassis) {
    return notFound();
  }

  const feet = inspectionHeader.chassis.feet;
  const searchPattern = `%(C${feet})`;
  
  const { data: allMasterItems } = await supabase
    .from('inspection_items')
    .select('*')
    .eq('category', 'Chassis')
    .ilike('name', searchPattern);
    
  const { data: inspectionResults } = await supabase
    .from('inspection_results')
    .select('id, item_id, kondisi, keterangan, problem_photo_url')
    .eq('inspection_id', inspectionId);

  const resultsMap = new Map(
    (inspectionResults || []).map((result) => [
      result.item_id,
      {
        id: result.id,
        kondisi: result.kondisi,
        keterangan: result.keterangan,
        problem_photo_url: result.problem_photo_url,
      },
    ])
  );

  const itemsWithResults: ItemWithResult[] = (allMasterItems || []).map(
    (item: InspectionItem) => {
      const result = resultsMap.get(item.id);
      return {
        ...item,
        resultId: result?.id || null,
        kondisi: result?.kondisi || 'Belum Diperiksa',
        keterangan: result?.keterangan || '-',
        problem_photo_url: result?.problem_photo_url || null,
      };
    }
  );

  const groups: Group = {};
  const parentNameMap = new Map<string, string>();
  const parentIds = [
    ...new Set(itemsWithResults.map((item) => item.parent_id).filter(Boolean)),
  ];
  if (parentIds.length > 0) {
    const { data: parents } = await supabase
      .from('inspection_items')
      .select('id, name')
      .in('id', parentIds as string[]);
    (parents || []).forEach((p: ParentItem) => parentNameMap.set(p.id, p.name));
  }

  for (const item of itemsWithResults) {
    const pageTitle = item.page_title || 'Lainnya';
    if (!groups[pageTitle]) groups[pageTitle] = [];

    const parentName = item.parent_id
      ? parentNameMap.get(item.parent_id) || 'Sub-grup'
      : item.name;
    let subGroup = groups[pageTitle].find((g) => g.parentName === parentName);
    if (!subGroup) {
      subGroup = { parentName, rows: [] };
      groups[pageTitle].push(subGroup);
    }

    const rowData: Row = {
      id: item.id,
      name: item.name,
      standard: item.standard,
      resultId: item.resultId,
      kondisi: item.kondisi,
      keterangan: item.keterangan,
      problem_photo_url: item.problem_photo_url,
    };

    if (item.parent_id) {
      subGroup.rows.push(rowData);
    } else {
      if (subGroup.rows.length === 0) subGroup.rows.push(rowData);
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">
        Detail Pemeriksaan Casis {inspectionHeader.chassis.chassis_code} ({feet}{' '}
        Feet)
      </h1>
      <CasisDetailClient
        inspectionHeader={inspectionHeader}
        groups={groups}
        deleteAction={deleteInspection}
      />
    </div>
  );
}