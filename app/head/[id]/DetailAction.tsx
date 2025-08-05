import { createClient } from '@/utils/supabase/server';
import { inspectionItemDefinitions } from '@/constants/inspectionItems';
import type { InspectionItemDefinition } from '@/constants/inspectionItems';

export default async function getHeadInspectionDetailGrouped(id: string) {
  const supabase = await createClient();

  const { data: inspectionHeader, error: headerError } = await supabase
    .from('head_inspection')
    .select('*')
    .eq('id', id)
    .single();

  if (headerError || !inspectionHeader) {
    throw new Error('Failed to fetch header data');
  }

  const { data: inspectionResults, error: resultError } = await supabase
    .from('head_inspection_result')
    .select('*')
    .eq('inspection_id', id);

  if (resultError) {
    throw new Error('Failed to fetch result data');
  }

  const inspectionItemsByKey = inspectionItemDefinitions.reduce<Record<string, InspectionItemDefinition[]>>(
    (acc, item) => {
      if (!acc[item.category!]) acc[item.category!] = [];
      acc[item.category!].push(item);
      return acc;
    },
    {}
  );

  return {
    inspectionHeader,
    inspectionResults,
    inspectionItemsByKey,
    inspectionCategories: inspectionItemsByKey, // tetap gunakan Record<string, ...>
  };
}
