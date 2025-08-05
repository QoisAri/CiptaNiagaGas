import { notFound } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { CasisDetailClient } from './CasisDetailClient';
import { deleteInspection } from '@/app/casis/actions';

export const dynamic = 'force-dynamic';

type Row = {
  id: string;
  name: string;
  standard: string | null;
  resultId: string | null;
  kondisi: string;
  keterangan: string | null;
  problem_photo_url: string | null;
};

export default async function Page({
  params,
}: {
  params: { id: string };
}) {
  const inspectionId = params.id;
  const supabase = await createClient();

  const { data, error: headerError } = await supabase
    .from('inspections')
    .select(
      `*, chassis!inspections_chassis_id_fkey(chassis_code, feet), profiles!fk_inspector(name)`
    )
    .eq('id', inspectionId)
    .single();

  if (headerError || !data || !data.chassis) return notFound();

  const inspectionHeader = data;
  const feet = data.chassis.feet;
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

  const itemsWithResults = (allMasterItems || []).map((item) => {
    const result = resultsMap.get(item.id);
    return {
      ...item,
      resultId: result?.id || null,
      kondisi: result?.kondisi || 'Belum Diperiksa',
      keterangan: result?.keterangan || '-',
      problem_photo_url: result?.problem_photo_url || null,
    };
  });

  const groups: Record<string, { parentName: string; rows: Row[] }[]> = {};
  const parentNameMap = new Map<string, string>();
  const parentIds = [
    ...new Set(itemsWithResults.map((item) => item.parent_id).filter(Boolean)),
  ];

  if (parentIds.length > 0) {
    const { data: parents } = await supabase
      .from('inspection_items')
      .select('id, name')
      .in('id', parentIds as string[]);
    (parents || []).forEach((p) => parentNameMap.set(p.id, p.name));
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
        Detail Pemeriksaan Casis {inspectionHeader.chassis.chassis_code} ({feet} Feet)
      </h1>
      <CasisDetailClient
        inspectionHeader={inspectionHeader}
        groups={groups}
        deleteAction={deleteInspection}
      />
    </div>
  );
}
