<template>
    <div>
        <a href="javascript:" @click="changeByEvent()">change by event</a>
    </div>
</template>

<script>
import bus from './../bus'

export default {
    name: "TestingEvents",
    props: [ 'event' ],
    methods: {
        changeByEvent() {
            bus.$emit(this.event, 5);
        }
    }
}
</script>

<style scoped>

</style>
