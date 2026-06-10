import { Metadata } from 'next';
import { supabase } from '@/lib/supabase';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const { data: product } = await supabase
    .from('products')
    .select('name, brand, online_description, description, sale_price, images')
    .eq('id', params.id)
    .maybeSingle();

  if (!product) return { title: 'Producto' };

  return {
    title: `${product.name}${product.brand ? ' - ' + product.brand : ''}`,
    description: product.online_description || product.description || `${product.name} disponible en ADDANI - $${Number(product.sale_price).toLocaleString('es-AR')}`,
    openGraph: {
      title: product.name,
      description: product.online_description || product.description || `Compra ${product.name} en ADDANI`,
      images: product.images?.[0] ? [{ url: product.images[0], width: 800, height: 800 }] : [],
    },
  };
}

export default function ProductLayout({ children }: { children: React.ReactNode }) {
  return children;
}