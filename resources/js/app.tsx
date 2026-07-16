import '../css/app.css';
import './bootstrap';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

// Development on localhost must not be controlled by a stale service worker.
// A previously registered worker can cache Vite's HMR and React Refresh files,
// mixing runtimes from different dependency versions.
if (import.meta.env.DEV && 'serviceWorker' in navigator) {
    void navigator.serviceWorker
        .getRegistrations()
        .then(async (registrations) => {
            if (registrations.length === 0) {
                return;
            }

            await Promise.all(
                registrations.map((registration) => registration.unregister()),
            );

            if (navigator.serviceWorker.controller) {
                window.location.reload();
            }
        })
        .catch(() => {
            // Service worker access can be blocked by browser privacy settings.
        });
}

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.tsx`,
            import.meta.glob('./Pages/**/*.tsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(<App {...props} />);
    },
    progress: {
        color: '#4B5563',
    },
});
