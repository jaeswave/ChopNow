import { lazy, Suspense } from "react";
import { Link, Route, Routes } from "react-router-dom";
import { Button, Container } from "../ui";
import Home from "../pages/Home";
import usePageMeta from "../hooks/usePageMeta";
import useComingSoon from "../hooks/useComingSoon";
import { OpeningSoonPage } from "../sections/ComingSoon"; // the landing page stays in the main bundle, everything else loads when visited

// Every routed page. To add a page: create it, then add one line here.
const routes = [
  { path: "/listing/:id", Component: lazy(() => import("../pages/Listing")), soon: true },
  { path: "/auth", Component: lazy(() => import("../pages/AuthPage")) },
  { path: "/seller", Component: lazy(() => import("../pages/Seller")) },
  { path: "/orders", Component: lazy(() => import("../pages/Orders")) },
  { path: "/admin", Component: lazy(() => import("../pages/Admin")) },
  {
    path: "/pay/callback",
    Component: lazy(() => import("../pages/PayCallback")),
  },
  { path: "/terms", Component: lazy(() => import("../pages/Legal")) },
  {
    path: "/verify-email",
    Component: lazy(() => import("../pages/VerifyEmail")),
  },
  { path: "/deals", Component: lazy(() => import("../pages/Deals")), soon: true },
  { path: "/how-it-works", Component: lazy(() => import("../pages/HowItWorks")) },
  { path: "/sell-with-us", Component: lazy(() => import("../pages/SellWithUs")) },
  { path: "/account", Component: lazy(() => import("../pages/Account")) },
  { path: "/feedback", Component: lazy(() => import("../pages/Feedback")) },
  { path: "/forgot-password", Component: lazy(() => import("../pages/ForgotPassword")) },
  { path: "/reset-password", Component: lazy(() => import("../pages/ResetPassword")) },
];

// A short fade when a page opens (skipped when the phone asks for reduced motion)
const Page = ({ children }) => (
  <Container className="min-h-[70vh] py-10 motion-safe:animate-fade-in">{children}</Container>
);
// Full screen height, so the footer stays out of sight until the page arrives (otherwise it jumps down)
const Loading = () => (
  <div className="grid min-h-screen place-items-center">
    <span className="inline-block size-8 animate-spin rounded-full border-4 border-line border-t-leaf" />
  </div>
);

// Deals and listing pages: "We are opening soon" while coming soon mode is on (for visitors and buyers)
function SoonGate({ Component }) {
  return useComingSoon() ? <OpeningSoonPage /> : <Component />;
}

function NotFound() {
  usePageMeta("Page not found");
  return (
    <div className="grid place-items-center gap-3 py-24 text-center">
      <div className="text-7xl">🍽️</div>
      <h1 className="text-4xl font-extrabold">This plate is empty</h1>
      <p className="text-mute">We couldn't find that page.</p>
      <Button as={Link} to="/" className="mt-2">
        Back to live deals
      </Button>
    </div>
  );
}

export default function AppRoutes() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/" element={<div className="motion-safe:animate-fade-in"><Home /></div>} />
        {routes.map(({ path, Component, soon }) => (
          <Route
            key={path}
            path={path}
            element={
              <Page>
                {soon ? <SoonGate Component={Component} /> : <Component />}
              </Page>
            }
          />
        ))}
        <Route
          path="*"
          element={
            <Page>
              <NotFound />
            </Page>
          }
        />
      </Routes>
    </Suspense>
  );
}
