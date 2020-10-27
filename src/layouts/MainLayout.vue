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

        <q-footer bordered class="bg-white small-screen-only">
            <q-tabs
                class="text-grey-10"
                active-color="primary"
                indicator-color="transparent"
            >
                <q-route-tab to="/" icon="eva-home-outline" />
                <q-route-tab to="/camera" icon="eva-camera-outline" />
            </q-tabs>
        </q-footer>

        <q-page-container class="bg-grey-1">
            <router-view />
        </q-page-container>
    </q-layout>
</template>

<script>
export default {
    name: "MainLayout",
    components: {},
    data() {
        return {}
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
