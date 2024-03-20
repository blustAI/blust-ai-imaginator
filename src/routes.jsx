import React, { Suspense, lazy } from 'react';
import { LoadingScreen, basic_auth_routes, extra_auth_routes, basic_doc_routes , AuthGuard, NotFound} from 'blustai-react-ui';

const Loadable = (Component) => (props) => (
    <Suspense fallback={<LoadingScreen />}>
        <Component {...props} />
    </Suspense>
);

const MainLayout = Loadable(lazy(() => import('./layouts/MainLayout')));

const CustomTool = Loadable(lazy(() => import('./pages/CustomTool/CustomTool')));


const default_not_found_route = {
    path: '*',
    element: <NotFound />
}
const all_subdomain_routes = [...basic_auth_routes, ...basic_doc_routes];


const routes = [
    //main domain routes
    {
        path: '/',
        element: <MainLayout><CustomTool /></MainLayout>
    },
    {
        path: '/generate',
        element: <MainLayout><CustomTool action="generate" /></MainLayout>
    },
    ...all_subdomain_routes,
    ...extra_auth_routes,
    default_not_found_route
]

const router = { routes };

export default router;