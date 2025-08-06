'use server'
import { createClient } from '../../utils/supabase/server';

export async function getWashingHistory() {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('washing_history')
    .select(`
      id,
      tanggal_pencucian,
      asset_type,
      asset_code,
      profiles ( name )
    `)
    .order('tanggal_pencucian', { ascending: false });

  if (error) {
    console.error('Error fetching washing history:', error);
    return [];
  }
  
  // Menambahkan data feet dummy jika diperlukan untuk filter
  return data.map(item => {
    const profileData = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles;
    return {
      ...item,
      diinput_oleh: profileData?.name || 'N/A',
      // Ganti logika ini jika Anda memiliki data feet di tabel washing_history
      feet: item.asset_type === 'head' ? '10' : 'N/A' 
    }
  });
}