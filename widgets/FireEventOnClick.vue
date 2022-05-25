<template>
    <div @click="fireEvent()" class="fire-event-wrapper" v-bind:style="{display: typeof inline !== 'undefined' || inline == 'true' ? 'inline' : 'block'}">
        <slot></slot>
    </div>
</template>

<script>
import bus from './../bus'

export default {
    name: "FireEventOnClick",
    props: [ 'event', 'payload', 'inline' ],
    methods: {
        fireEvent() {
            if (typeof this.event === "undefined") {
                return ;
            }

            bus.$emit(this.event, this.payload);
        }
    }
}
</script>

<style scoped>

</style>
