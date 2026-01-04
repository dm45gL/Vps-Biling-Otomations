import type { RouteRecordRaw } from 'vue-router';
import HomePage from './HomePage.vue';
import PublicProductsList from './components/produk.vue';
import PublicProductDetail from './components/ProductDetail.vue';

const pageRoutes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: HomePage,
  },
  {
    path: '/products',
    name: 'public-products-list',
    component: PublicProductsList,
  },
  {
    path: '/products/:publicId',
    name: 'public-product-detail',
    component: PublicProductDetail,
    props: true, // agar publicId bisa diterima sebagai prop
  },
];

export default pageRoutes;
