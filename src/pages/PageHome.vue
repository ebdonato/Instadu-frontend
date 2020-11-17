<template>
    <q-page class="constrain q-pa-md">
        <transition
            appear
            enter-active-class="animated fadeIn"
            leave-active-class="animated fadeOut"
        >
            <div
                class="bg-primary"
                v-if="showNotificationBanner && pushNotificationSupported"
            >
                <div class="constrain bg-primary">
                    <q-banner class="bg-grey-2 q-mb-md">
                        <template v-slot:avatar>
                            <q-icon name="eva-bell-outline" color="primary" />
                        </template>

                        Gostaria de habilitar as notifcações?

                        <template v-slot:action>
                            <q-btn
                                dense
                                class="q-px-sm"
                                color="primary"
                                flat
                                label="Sim"
                                @click="enableNotification"
                            />
                            <q-btn
                                dense
                                class="q-px-sm"
                                color="primary"
                                flat
                                label="Depois"
                                @click="showNotificationBanner = false"
                            />
                            <q-btn
                                dense
                                class="q-px-sm"
                                color="primary"
                                flat
                                label="Nunca"
                                @click="neverShowNotificationBanner"
                            />
                        </template>
                    </q-banner>
                </div>
            </div>
        </transition>

        <div class="row q-col-gutter-lg">
            <div class="col-12 col-sm-8">
                <template v-if="!loadingPosts && posts.length">
                    <q-card
                        v-for="post in posts"
                        :key="post.id"
                        class="card-post q-mb-md"
                        :class="{ 'bg-red-1': post.offline }"
                        flat
                        bordered
                    >
                        <q-badge
                            v-if="post.offline"
                            color="red"
                            class="absolute-top-right badge-offline"
                        >
                            <q-icon
                                name="warning"
                                color="white"
                                class="q-mr-xs"
                            />

                            Offline
                        </q-badge>

                        <q-item>
                            <q-item-section avatar>
                                <q-avatar>
                                    <img
                                        src="https://secure.gravatar.com/avatar/95436a1e6147f1668b10d37547f7e930"
                                    />
                                </q-avatar>
                            </q-item-section>

                            <q-item-section>
                                <q-item-label class="text-bold"
                                    >ebdonato</q-item-label
                                >
                                <q-item-label caption>
                                    {{ post.location }}
                                </q-item-label>
                            </q-item-section>
                        </q-item>

                        <q-separator />

                        <q-img :src="post.imageUrl" />

                        <q-separator />

                        <q-card-section>
                            <div>{{ post.caption }}</div>
                            <div class="text-caption text-grey">
                                {{ post.date | niceDate }}
                            </div>
                        </q-card-section>
                    </q-card>
                </template>
                <template v-else-if="!loadingPosts && !posts.length">
                    <h5 class="text-center text-grey">
                        Nenhuma postagem ainda!
                    </h5>
                </template>
                <template v-else>
                    <q-card flat bordered>
                        <q-item>
                            <q-item-section avatar>
                                <q-skeleton
                                    type="QAvatar"
                                    animation="fade"
                                    size="40px"
                                />
                            </q-item-section>

                            <q-item-section>
                                <q-item-label>
                                    <q-skeleton type="text" animation="fade" />
                                </q-item-label>
                                <q-item-label caption>
                                    <q-skeleton type="text" animation="fade" />
                                </q-item-label>
                            </q-item-section>
                        </q-item>

                        <q-skeleton height="200px" square animation="fade" />

                        <q-card-section>
                            <q-skeleton
                                type="text"
                                class="text-subtitle2"
                                animation="fade"
                            />
                            <q-skeleton
                                type="text"
                                width="50%"
                                class="text-subtitle2"
                                animation="fade"
                            />
                        </q-card-section>
                    </q-card>
                </template>
            </div>
            <div class="col large-screen-only">
                <q-item class="fixed">
                    <q-item-section avatar>
                        <q-avatar size="48px">
                            <img
                                src="https://secure.gravatar.com/avatar/95436a1e6147f1668b10d37547f7e930"
                            />
                        </q-avatar>
                    </q-item-section>

                    <q-item-section>
                        <q-item-label class="text-bold">ebdonato</q-item-label>
                        <q-item-label caption> Eduardo Donato </q-item-label>
                    </q-item-section>
                </q-item>
            </div>
        </div>
    </q-page>
</template>

<script>
import { date } from "quasar"

//biblioteca para abrir o DB do Service Worker para Backgoudn Sync (indexedDB)
import { openDB } from "idb"

//transforma json em link para get
const qs = require("qs")

export default {
    name: "PageHome",
    data() {
        return {
            posts: [],
            loadingPosts: false,
            showNotificationBanner: false,
        }
    },
    computed: {
        serviceWorkerSupported() {
            return "serviceWorker" in navigator
        },
        pushNotificationSupported() {
            // PushManager é para notificações Push, para notificações de maneria geral, "Notification"
            return "PushManager" in window
        },
    },
    methods: {
        getPosts() {
            this.loadingPosts = true

            this.$axios
                .get(`${process.env.API}/posts`)
                .then((response) => {
                    this.posts = response.data
                    this.loadingPosts = false

                    if (!navigator.onLine) {
                        console.warn("Navegador está offline")
                        this.getOfflinePosts()
                    }
                })
                .catch((err) => {
                    this.$q.dialog({
                        title: "Erro",
                        message: "Não foi possível baixar as postagens.",
                    })
                    this.loadingPosts = false
                })
        },
        getOfflinePosts() {
            let db = openDB("workbox-background-sync").then((db) => {
                db.getAll("requests")
                    .then((failedRequests) => {
                        failedRequests.forEach((failedRequest) => {
                            if (failedRequest.queueName == "createPostQueue") {
                                let request = new Request(
                                    failedRequest.requestData.url,
                                    failedRequest.requestData
                                )
                                request.formData().then((formData) => {
                                    let offlinePost = {}

                                    offlinePost.id = formData.get("id")

                                    offlinePost.caption = formData.get(
                                        "caption"
                                    )

                                    offlinePost.location = formData.get(
                                        "location"
                                    )

                                    offlinePost.date = parseInt(
                                        formData.get("date")
                                    )

                                    offlinePost.offline = true

                                    let reader = new FileReader()

                                    reader.readAsDataURL(formData.get("photo"))

                                    reader.onloadend = () => {
                                        offlinePost.imageUrl = reader.result
                                        this.posts.unshift(offlinePost)
                                    }
                                })
                            }
                        })
                    })
                    .catch((err) => {
                        console.log("Error accessing IndexedDB: ", err)
                    })
            })
        },
        listenForOfflinePostUploaded() {
            if (this.serviceWorkerSupported) {
                const channel = new BroadcastChannel("sw-messages")
                channel.addEventListener("message", (event) => {
                    console.log("Received", event.data)
                    if (event.data.msg == "offline-post-uploaded") {
                        const offlinePostCount = this.posts.filter(
                            (post) => post.offline == true
                        ).length
                        this.posts[offlinePostCount - 1].offline = false
                    }
                })
            }
        },
        enableNotification() {
            if (this.pushNotificationSupported) {
                Notification.requestPermission((result) => {
                    this.neverShowNotificationBanner()

                    if (result == "granted") {
                        //this.displayGrantedNotification()
                        this.checkForExistingPushSubscription()
                    }
                })
            }
        },
        checkForExistingPushSubscription() {
            if (this.serviceWorkerSupported && this.pushNotificationSupported) {
                let reg
                navigator.serviceWorker.ready
                    .then((swreg) => {
                        reg = swreg
                        swreg.pushManager.getSubscription()
                    })
                    .then((sub) => {
                        if (!sub) {
                            this.createPushSubscription(reg)
                        }
                    })
            }
        },
        createPushSubscription(reg) {
            const vapidPublicKey =
                "BOt09vMIvG_JXilxKflPMM_FxJr1FgGhSAbZlLMxVGiH3alTfWo2jK5R6d4M6_TYZ8F9Oe40HYtslU2f4N4bd70"

            const vapidPublicKeyConverted = this.urlBase64ToUint8Array(
                vapidPublicKey
            )

            reg.pushManager
                .subscribe({
                    applicationServerKey: vapidPublicKeyConverted,
                    userVisibleOnly: true,
                })
                .then((newSub) => {
                    const newSubData = newSub.toJSON()
                    const newSubDataQS = qs.stringify(newSubData)

                    return this.$axios.post(
                        ` ${process.env.API}/createSubscription?${newSubDataQS} `
                    )
                })
                .then((response) => {
                    this.displayGrantedNotification()
                })
                .catch((err) => {
                    console.log("err: ", err)
                })
        },

        urlBase64ToUint8Array(base64String) {
            const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
            const base64 = (base64String + padding)
                .replace(/-/g, "+")
                .replace(/_/g, "/")

            const rawData = window.atob(base64)
            const outputArray = new Uint8Array(rawData.length)

            for (let i = 0; i < rawData.length; ++i) {
                outputArray[i] = rawData.charCodeAt(i)
            }
            return outputArray
        },

        displayGrantedNotification() {
            // esse código mostra a nofiticação direto no aplicativo front-end

            // new Notification("Você está escrito nas notificações!", {
            //     //https://developer.mozilla.org/en-US/docs/Web/API/Notification/Notification
            //     body: "Obrigado por se inscrever!",
            //     icon: "icons/favicon-128x128.png",
            //     image: "icons/favicon-128x128.png",
            //     badge: "icons/favicon-128x128.png",
            //     dir: "auto",
            //     lang: "pt-BR",
            //     vibrate: [100, 50, 200],
            //     tag: "confirmation-notification", //agrupar as notificações no Android
            //     renotify: true,
            // })

            // esse código mostra a nofiticação direto do service worker

            if (this.serviceWorkerSupported && this.pushNotificationSupported) {
                navigator.serviceWorker.ready.then((swreg) => {
                    swreg.showNotification(
                        "Você está escrito nas notificações!",
                        {
                            //https://developer.mozilla.org/en-US/docs/Web/API/Notification/Notification
                            body: "Obrigado por se inscrever!",
                            icon: "icons/favicon-128x128.png",
                            image: "icons/favicon-128x128.png",
                            badge: "icons/favicon-128x128.png",
                            dir: "auto",
                            lang: "pt-BR",
                            vibrate: [100, 50, 200],
                            tag: "confirmation-notification", //agrupar as notificações no Android
                            renotify: true,
                            actions: [
                                {
                                    action: "hello",
                                    title: "Hello",
                                    icon: "icons/favicon-32x32.png",
                                },
                                {
                                    action: "goodbye",
                                    title: "Good Bye",
                                    icon: "icons/favicon-32x32.png",
                                },
                            ],
                        }
                    )
                })
            }
        },
        neverShowNotificationBanner() {
            this.showNotificationBanner = false
            this.$q.localStorage.set("neverShowNotificationBanner", true)
        },
        initNotificationBanner() {
            const neverShowNotificationBanner = this.$q.localStorage.getItem(
                "neverShowNotificationBanner"
            )

            if (!neverShowNotificationBanner) {
                this.showNotificationBanner = true
            }
        },
    },
    activated() {
        this.getPosts()
    },
    created() {
        this.listenForOfflinePostUploaded()
        this.initNotificationBanner()
    },
    filters: {
        niceDate(value) {
            const postDate = date.formatDate(value, "dddd, DD.MM.YYYY")

            const postHour = date.formatDate(value, "HH:mm")

            return `${postDate} às ${postHour}h`
        },
    },
}
</script>

<style lang="sass">
.card-post
    .badge-offline
        border-top-left-radius: 0 !important
    .q-img
        min-height: 200px
</style>
