const CACHE_NAME =
    "red-attendance-v1";

const APP_FILES = [
    "./",
    "./checkin.html",
    "./manifest.json",
    "./css/style.css?v=12"
];


// =====================================
// Install
// =====================================

self.addEventListener(
    "install",
    function (
        event
    ) {

        event.waitUntil(
            caches.open(
                CACHE_NAME
            ).then(
                function (
                    cache
                ) {

                    return cache.addAll(
                        APP_FILES
                    );

                }
            )
        );

        self.skipWaiting();

    }
);


// =====================================
// Activate
// =====================================

self.addEventListener(
    "activate",
    function (
        event
    ) {

        event.waitUntil(
            caches.keys().then(
                function (
                    cacheNames
                ) {

                    return Promise.all(
                        cacheNames.map(
                            function (
                                cacheName
                            ) {

                                if (
                                    cacheName !==
                                    CACHE_NAME
                                ) {

                                    return caches.delete(
                                        cacheName
                                    );

                                }

                            }
                        )
                    );

                }
            )
        );

        self.clients.claim();

    }
);


// =====================================
// Fetch
// =====================================

self.addEventListener(
    "fetch",
    function (
        event
    ) {

        event.respondWith(
            fetch(
                event.request
            ).catch(
                function () {

                    return caches.match(
                        event.request
                    );

                }
            )
        );

    }
);