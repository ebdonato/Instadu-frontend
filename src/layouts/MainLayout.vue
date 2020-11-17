<template>
    <q-layout view="lHh Lpr lFf">
        <q-header class="bg-white text-grey-10" bordered>
            <q-toolbar class="constrain">
                <q-btn
                    flat
                    round
                    dense
                    icon="eva-camera-outline"
                    class="large-screen-only q-mr-sm"
                    size="18px"
                    to="/camera"
                />
                <q-separator vertical spaced class="large-screen-only" />
                <q-toolbar-title class="text-grand-hotel text-bold">
                    Instadu!
                </q-toolbar-title>
                <q-btn
                    flat
                    round
                    dense
                    icon="eva-home-outline"
                    class="large-screen-only"
                    size="18px"
                    to="/"
                />
            </q-toolbar>
        </q-header>

        <q-footer bordered class="bg-white">
            <transition
                appear
                enter-active-class="animated fadeIn"
                leave-active-class="animated fadeOut"
            >
                <div class="bg-primary" v-if="showAppInstallBanner">
                    <div class="constrain bg-primary">
                        <q-banner
                            inline-actions
                            dense
                            class="bg-primary text-white"
                        >
                            <template v-slot:avatar>
                                <q-avatar>
                                    <img src="icons/favicon-32x32.png" />
                                </q-avatar>
                            </template>

                            <b>Instalar <i>Instadu!</i> ?</b>

                            <template v-slot:action>
                                <q-btn
                                    dense
                                    class="q-px-sm"
                                    flat
                                    label="Sim"
                                    @click="installApp"
                                />
                                <q-btn
                                    dense
                                    class="q-px-sm"
                                    flat
                                    label="Depois"
                                    @click="showAppInstallBanner = false"
                                />
                                <q-btn
                                    dense
                                    class="q-px-sm"
                                    flat
                                    label="Nunca"
                                    @click="neverShowAppInstallBanner"
                                />
                            </template>
                        </q-banner>
                    </div>
                </div>
            </transition>
            <q-tabs
                class="small-screen-only text-grey-10"
                active-color="primary"
                indicator-color="transparent"
            >
                <q-route-tab to="/" icon="eva-home-outline" />
                <q-route-tab to="/camera" icon="eva-camera-outline" />
            </q-tabs>
        </q-footer>

        <q-page-container class="bg-grey-1">
            <keep-alive :include="['PageHome']">
                <router-view />
            </keep-alive>
        </q-page-container>
    </q-layout>
</template>

<script>
export default {
    name: "MainLayout",
    components: {},
    data() {
        return {
            showAppInstallBanner: false,
            deferredPrompt: null,
        }
    },
    methods: {
        installApp() {
            // Hide the app provided install promotion
            this.showAppInstallBanner = false
            // Show the install prompt
            this.deferredPrompt.prompt()
            // Wait for the user to respond to the prompt
            this.deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === "accepted") {
                    console.log("User accepted the install prompt")
                } else {
                    console.log("User dismissed the install prompt")
                }
            })
        },
        neverShowAppInstallBanner() {
            this.showAppInstallBanner = false
            this.$q.localStorage.set("neverShowAppInstallBanner", true)
        },
    },
    mounted() {
        const neverShowAppInstallBanner = this.$q.localStorage.getItem(
            "neverShowAppInstallBanner"
        )

        if (!neverShowAppInstallBanner) {
            window.addEventListener("beforeinstallprompt", (e) => {
                // Prevent the mini-infobar from appearing on mobile
                e.preventDefault()
                // Stash the event so it can be triggered later.
                this.deferredPrompt = e
                // Update UI notify the user they can install the PWA

                setTimeout(() => {
                    this.showAppInstallBanner = true
                }, 2000)
            })
        }
    },
}
</script>

<style lang="sass">
.q-toolbar
    @media (min-width: $breakpoint-sm-min)
        height: 75px
.q-toolbar__title
    font-size: 30px
    @media (max-width: $breakpoint-xs-max)
        text-align: center
</style>
