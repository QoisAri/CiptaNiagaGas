// types/supabase.ts

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      inspection: {
        Row: {
          id: string;
          created_at: string;
          pemeriksa: string;
          pengecek: string;
          head_id: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          pemeriksa: string;
          pengecek: string;
          head_id: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          pemeriksa?: string;
          pengecek?: string;
          head_id?: string;
        };
      };

      inspection_result: {
        Row: {
          id: string;
          inspection_id: string;
          item_key: string;
          status: 'baik' | 'tidak';
          keterangan: string | null;
        };
        Insert: {
          id?: string;
          inspection_id: string;
          item_key: string;
          status: 'baik' | 'tidak';
          keterangan?: string | null;
        };
        Update: {
          id?: string;
          inspection_id?: string;
          item_key?: string;
          status?: 'baik' | 'tidak';
          keterangan?: string | null;
        };
      };

      inspection_item: {
        Row: {
          key: string;
          label: string;
          category: string;
          parent_id: string | null;
          type: 'checkbox' | 'input'; // atau sesuaikan dengan tipe lainnya
        };
        Insert: {
          key: string;
          label: string;
          category: string;
          parent_id?: string | null;
          type: 'checkbox' | 'input';
        };
        Update: {
          key?: string;
          label?: string;
          category?: string;
          parent_id?: string | null;
          type?: 'checkbox' | 'input';
        };
      };

      head: {
        Row: {
          id: string;
          nomor_polisi: string;
          // tambahkan kolom lain jika ada
        };
        Insert: {
          id?: string;
          nomor_polisi: string;
        };
        Update: {
          id?: string;
          nomor_polisi?: string;
        };
      };
    };
  };
}
