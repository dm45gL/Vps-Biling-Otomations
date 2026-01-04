import express from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import cors from 'cors';

// Routes
import adminAuthRoutes from './modules/auth/routes/auth.routes';
import clientAuthRoutes from './modules/client/routes/auth.routes';
import sysadminRoutes from './modules/sysadmin/routes/admin.routes';
import protectedRoute from './modules/auth/routes/protected.route';
import hypervisorRoutes from "./modules/sysadmin/routes/hypervisor.routes";
import backupStorageRoutes from "./modules/backup/routes/backupStorage.routes";
import backupPolicyRoutes  from "./modules/backup/routes/backupPolicy.routes";
import Iproute  from "./modules/sysadmin/routes/ip.routes";
import rawProduct  from "./modules/sysadmin/routes/rawProduct.routs";
import pricingDuration  from "./modules/productPricing/routes/productPricing.routes";
import promoRoutes from "./modules/productPricing/routes/promo.routes";
import promoUsageRoutes from "./modules/loging/routes/promoUsage.routes";
import checkout from "./modules/productPricing/routes/checkout.routes"
import Publicproduct from "./modules/produk/routes"
import regionRouter from "./modules/sysadmin/routes/regional"
import masterRouter from "./modules/sysadmin/routes/mastes"
import xenditRoute  from "./modules/payment/routes/xendit.routes"

import order from "./modules/productPricing/routes/order.routes"


// Utils
import { errorHandler } from './core/utils/error-handler';

const app = express();

// ── Middleware Global ─────────────
app.use(helmet());
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// CORS setup (whitelist frontend URL)
app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL || 'http://localhost:5173',
      'http://localhost:5000',
    ],
    credentials: true,
  })
);

// ── Routes ─────────────────────────

// Client routes (self-service, register/login OTP)
app.use('/client', clientAuthRoutes);

// Admin auth routes (login, verify OTP, forgot password, refresh, logout)
app.use('/admin', adminAuthRoutes);

// Sysadmin management routes (requires authentication + SYSADMIN role)
app.use('/sysadmin', sysadminRoutes);

// Protected example route
app.use('/protected-route', protectedRoute);

// hypervisor
app.use("/hypervisors", hypervisorRoutes);

// backupStorage
app.use("/api/backup-storage", backupStorageRoutes);

// backup policy
app.use("/api/backup-policy", backupPolicyRoutes);

// ip 
app.use("/api/ip", Iproute);

// rawProduk
app.use("/api/rawProduct", rawProduct)



// produk Pricing
app.use("/api/product-pricing", pricingDuration);

// promo
app.use("/api/promos", promoRoutes);

// cekout
app.use("/api/checkout", checkout);

// product
app.use("/api/public-products", Publicproduct)

// loging
app.use("/api/promos", promoUsageRoutes);

app.use("/api/orders", order)

// biling addres





app.use("/webhooks", xenditRoute);


app.use('/regions', regionRouter);
app.use('/api/master', masterRouter);



import vpsRoutes from "./modules/VPS/route/vps.routes";
import orderClient from "./modules/VPS/route/order.routes";

app.use("/api/vps", vpsRoutes);
app.use("/api/client/order", orderClient);



// ── Global Error Handler ───────────
app.use(errorHandler);

export default app;
