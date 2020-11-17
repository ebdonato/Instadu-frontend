/*
 * This file (which will be your service worker)
 * is picked up by the build system ONLY if
 * quasar.conf > pwa > workboxPluginMode is set to "InjectManifest"
 */

//dependências - precaching
import { precacheAndRoute } from 'workbox-precaching'

//dependências - caching
import { registerRoute } from 'workbox-routing'
import { StaleWhileRevalidate } from 'workbox-strategies'
import { CacheFirst } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'
import { CacheableResponsePlugin } from 'workbox-cacheable-response'
import { NetworkFirst } from 'workbox-strategies'

//dependências - background sync
import { Queue } from 'workbox-background-sync'

//configurações - precaching
precacheAndRoute(self.__WB_MANIFEST);

//configurações - background sync
let backgroundSyncSupported = 'sync' in self.registration

let createPostQueue = null

if (backgroundSyncSupported) {
    createPostQueue = new Queue('createPostQueue', {
        onSync: async ({ queue }) => {
            let entry;
            while (entry = await queue.shiftRequest()) {
                try {
                    await fetch(entry.request);
                    console.log('Replay successful for request', entry.request);
                    const channel = new BroadcastChannel('sw-messages');
                    channel.postMessage({ msg: 'offline-post-uploaded' });
                } catch (error) {
                    console.error('Replay failed for request', entry.request, error);

                    // Put the entry back in the queue and re-throw the error:
                    await queue.unshiftRequest(entry);
                    throw error;
                }
            }
        }
    })
}

//estratégias de caching
registerRoute(
    ({ url }) => url.host.startsWith('fonts.g'),
    new CacheFirst({
        cacheName: 'google-fonts',
        plugins: [
            new ExpirationPlugin({
                maxEntries: 30,
            }),
            new CacheableResponsePlugin({
                statuses: [0, 200]
            }),
        ],
    })
);

registerRoute(
    ({ url }) => url.pathname.startsWith('/posts'),
    new NetworkFirst()
);

registerRoute(
    ({ url }) => url.href.startsWith('http'),
    new StaleWhileRevalidate()
)

// event fectch background sync

if (backgroundSyncSupported) {
    self.addEventListener('fetch', (event) => {

        if (event.request.url.endsWith('/createPost')) {

            //verificar se o navegador está offline para clonar o evento // para não ser disparado duas vezes
            if (!self.navigator.onLine) {

                // Clone the request to ensure it's safe to read when
                // adding to the Queue.
                const promiseChain = fetch(event.request.clone()).catch((_err) => {
                    return createPostQueue.pushRequest({ request: event.request })
                })

                event.waitUntil(promiseChain)
            }
        }
    })
}

// event push notification

self.addEventListener('push', event => {

    if (event.data) {
        const data = JSON.parse(event.data.text())
        console.log('push-notification-data', data)

        event.waitUntil(
            self.registration.showNotification(
                data.title,
                {
                    body: data.body,
                    icon: "icons/favicon-128x128.png",
                    badge: "icons/favicon-128x128.png",
                    data: {
                        openUrl: data.openUrl
                    }
                }
            )
        )
    }

})
// event notification

self.addEventListener('notificationclick', event => {
    let notification = event.notification
    let action = event.action

    if (action == 'hello') {
        console.log('Hello button was clicked')
    }
    else if (action == 'goodbye') {
        console.log('Goodbye button was clicked')
    }
    else {
        event.waitUntil(
            clients.matchAll().then(clis => {

                console.log('clients', clis)

                const clientUsingApp = clis.find(cli => cli.visibilityState === 'visible')

                console.log('clientUsingApp', clientUsingApp)

                if (clientUsingApp) {
                    clientUsingApp.navigate(notification.data.openUrl)
                    clientUsingApp.focus()
                }
                else {
                    clients.openWindow(notification.data.openUrl)
                }
            })

        )
    }

    notification.close()
})

self.addEventListener('notificationclose', event => {

    console.log('Notification was clicked', event)

})
