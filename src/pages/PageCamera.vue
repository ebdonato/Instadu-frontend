<template>
    <q-page class="constrain-more q-pa-md">
        <div class="camera-frame q-pa-md">
            <video
                v-show="!imageCaptured"
                class="full-width"
                autoplay
                playsinline
                ref="video"
            />
            <canvas
                v-show="imageCaptured"
                class="full-width"
                height="240"
                ref="canvas"
            />
        </div>

        <div class="text-center q-pa-md">
            <q-btn
                v-if="hasCameraSupport"
                round
                color="grey-10"
                icon="eva-camera"
                size="lg"
                @click="captureImage"
                :disable="imageCaptured"
            />

            <q-file
                v-else
                outlined
                v-model="imageUpload"
                label="Escolha uma imagem"
                accept="image/*"
                @input="captureImageFallback"
            >
                <template v-slot:prepend>
                    <q-icon name="eva-attach-outline" />
                </template>
            </q-file>
        </div>

        <div class="row justify-center q-ma-md">
            <q-input
                class="col col-sm-8"
                v-model="post.caption"
                label="Legenda *"
                dense
            />
        </div>

        <div class="row justify-center q-ma-md">
            <q-input
                v-if="locationSupported"
                class="col col-sm-8"
                v-model="post.location"
                label="Localização"
                dense
            >
                <template v-slot:append>
                    <q-btn
                        round
                        dense
                        flat
                        icon="eva-navigation-2-outline"
                        @click="getLocation"
                        :loading="locationLoading"
                    />
                </template>
            </q-input>
        </div>

        <div class="row justify-center q-mt-lg">
            <q-btn
                rounded
                unelevated
                color="primary"
                label="Postar Imagem"
                @click="addPost"
                :disable="!post.photo || !post.caption"
            />
        </div>
    </q-page>
</template>

<script>
import { uid } from "quasar"

//load "md-gum-polyfill" with require before using code that uses getUserMedia
require("md-gum-polyfill")

export default {
    name: "PageCamera",
    data() {
        return {
            post: {
                id: uid(),
                caption: "",
                location: "",
                photo: null,
                date: Date.now(),
            },
            imageCaptured: false,
            imageUpload: [],
            hasCameraSupport: true,
            locationLoading: false,
        }
    },
    computed: {
        locationSupported() {
            if ("geolocation" in navigator) return true
            return false
        },
    },
    methods: {
        initCamera() {
            navigator.mediaDevices
                .getUserMedia({
                    video: true,
                })
                .then((stream) => {
                    this.$refs.video.srcObject = stream
                })
                .catch((e) => {
                    this.hasCameraSupport = false
                })
        },
        captureImageFallback(file) {
            this.post.photo = file

            let canvas = this.$refs.canvas
            let context = canvas.getContext("2d")

            let reader = new FileReader()

            reader.onload = (event) => {
                let img = new Image()
                img.onload = () => {
                    canvas.width = img.width
                    canvas.height = img.height
                    context.drawImage(img, 0, 0)
                    this.imageCaptured = true
                }
                img.src = event.target.result
            }
            reader.readAsDataURL(file)
        },
        captureImage() {
            let video = this.$refs.video
            let canvas = this.$refs.canvas

            canvas.width = video.getBoundingClientRect().width
            canvas.height = video.getBoundingClientRect().height

            let context = canvas.getContext("2d")
            context.drawImage(video, 0, 0, canvas.width, canvas.height)
            this.imageCaptured = true
            this.post.photo = this.dataURItoBlob(canvas.toDataURL())

            this.disableCamera()
        },
        disableCamera() {
            this.$refs.video.srcObject.getVideoTracks().forEach((track) => {
                track.stop()
            })
        },
        dataURItoBlob(dataURI) {
            // convert base64 to raw binary data held in a string
            // doesn't handle URLEncoded DataURIs - see SO answer #6850276 for code that does this
            let byteString = atob(dataURI.split(",")[1])

            // separate out the mime component
            let mimeString = dataURI.split(",")[0].split(":")[1].split(";")[0]

            // write the bytes of the string to an ArrayBuffer
            let ab = new ArrayBuffer(byteString.length)

            // create a view into the buffer
            let ia = new Uint8Array(ab)

            // set the bytes of the buffer to the correct values
            for (let i = 0; i < byteString.length; i++) {
                ia[i] = byteString.charCodeAt(i)
            }

            // write the ArrayBuffer to a blob, and you're done
            let blob = new Blob([ab], { type: mimeString })
            return blob
        },
        getLocation() {
            this.locationLoading = true
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    this.getCityStateAndCountry(position)
                },
                (err) => {
                    this.locationError()
                },
                { timeout: 7000 }
            )
        },
        getCityStateAndCountry(position) {
            let apiUrl = `https://geocode.xyz/${position.coords.latitude},${position.coords.longitude}?json=1`
            this.$axios
                .get(apiUrl)
                .then((result) => {
                    //console.log("result: ", result)
                    this.locationSucess(result)
                })
                .catch((err) => {
                    this.locationError()
                })
        },
        locationSucess(result) {
            this.post.location = result.data.city
            if (result.data.state) {
                this.post.location += `, ${result.data.state}`
            }
            if (result.data.country) {
                this.post.location += `, ${result.data.country}`
            }
            this.locationLoading = false
        },
        locationError() {
            this.$q.dialog({
                title: "Erro",
                message: "Não foi possível obter a localização",
            })
            this.locationLoading = false
        },
        addPost() {
            this.$q.loading.show()

            let formData = new FormData()

            formData.append("id", this.post.id)
            formData.append("caption", this.post.caption)
            formData.append("location", this.post.location)
            formData.append("date", this.post.date)
            formData.append("photo", this.post.photo, this.post.id + ".png")

            this.$axios
                .post(`${process.env.API}/createPost`, formData)
                .then((response) => {
                    console.log("response: ", response)

                    this.$router.push("/")

                    this.$q.notify({
                        message: "Postagem Criada.",

                        actions: [
                            {
                                label: "Dismiss",
                                color: "white",
                            },
                        ],
                    })

                    this.$q.loading.hide()
                })
                .catch(() => {
                    this.$q.dialog({
                        title: "Erro",
                        message: "Não foi possível criar a postagem.",
                    })

                    this.$q.loading.hide()
                })
        },
    },
    mounted() {
        this.initCamera()
    },
    beforeDestroy() {
        if (this.hasCameraSupport) {
            this.disableCamera()
        }
    },
}
</script>

<style lang="sass">
.camera-frame
    border: 2px solid $grey-10
    border-radius: 10px
</style>
