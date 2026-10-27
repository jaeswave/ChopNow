import { lazy, Suspense } from "react";
import { Link, Route, Routes } from "react-router-dom";
import { Button, Container } from "../ui";
import Home from "../pages/Home"; // the landing page stays in the main bundle, everything else loads when visited

// Every routed page. To add a page: create it, then add one line here.
const routes = [
  { path: "/listing/:id", Component: lazy(() => import("../pages/Listing")) },
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
  { path: "/deals", Component: lazy(() => import("../pages/Deals")) },
];

const Page = ({ children }) => (
  <Container className="min-h-[70vh] py-10">{children}</Container>
);
const Loading = () => (
  <div className="grid min-h-[50vh] place-items-center">
    <span className="inline-block size-8 animate-spin rounded-full border-4 border-line border-t-leaf" />
  </div>
);

const NotFound = () => (
  <div className="grid place-items-center gap-3 py-24 text-center">
    <div className="text-7xl">🍽️</div>
    <h1 className="text-4xl font-extrabold">This plate is empty</h1>
    <p className="text-mute">We couldn't find that page.</p>
    <Button as={Link} to="/" className="mt-2">
      Back to live deals
    </Button>
  </div>
);

export default function AppRoutes() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/" element={<Home />} />
        {routes.map(({ path, Component }) => (
          <Route
            key={path}
            path={path}
            element={
              <Page>
                <Component />
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
